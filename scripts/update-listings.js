/**
 * Relève le nombre d'annonces EN VENTE pour chaque item et écrit data/listings.json.
 *
 * eBay.fr
 *   1. Si EBAY_CLIENT_ID + EBAY_CLIENT_SECRET sont définis → API officielle Browse
 *      (fiable, gratuite, ne se fait pas bloquer). Méthode recommandée.
 *   2. Sinon → lecture de la page de recherche publique (eBay bloque souvent les
 *      IP de datacenter : dans ce cas la source est marquée « bloquée », pas inventée).
 * Vinted
 *   Tentative via l'API web publique (cookie de session anonyme). Souvent bloqué
 *   depuis un datacenter → même traitement.
 *
 * Règles :
 *   - une annonce compte si son TITRE contient le code de l'item (HPL.codeRegex) ;
 *   - un échec ne remplace JAMAIS une ancienne valeur par « rien » : on garde la
 *     dernière valeur connue et sa date de relevé (checked[source]).
 *
 * Usage : node scripts/update-listings.js
 */
const fs = require('fs');
const path = require('path');
const HPL = require('../js/search.js');

const ROOT = path.join(__dirname, '..');
const FIGURES_JS = path.join(ROOT, 'js', 'figures.js');
const OUT = path.join(ROOT, 'data', 'listings.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const MAX_CONSECUTIVE_BLOCKED = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = () => sleep(700 + Math.floor(Math.random() * 600));

class Blocked extends Error {}

function loadFigures() {
  const src = fs.readFileSync(FIGURES_JS, 'utf8');
  return new Function(src + '\n;return FIGURES;')();
}

function loadPrevious() {
  try {
    return JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch {
    return { items: {} };
  }
}

async function http(url, opts = {}) {
  return fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(25000),
    ...opts,
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      ...(opts.headers || {})
    }
  });
}

/* ------------------------------------------------------------------ eBay */

function stripTags(s) {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Analyse une page de résultats eBay.fr.
 * @returns {{state:'ok'|'blocked'|'unknown', count?:number, truncated?:boolean}}
 */
function parseEbayHtml(html, code) {
  if (!html) return { state: 'blocked' };

  const looksLikeResults = /srp-results|srp-controls|s-item__|s-card/.test(html);
  if (!looksLikeResults) {
    if (/Pardon Our Interruption|captcha|splashui|challenge|robot|Access Denied/i.test(html)) {
      return { state: 'blocked' };
    }
    return { state: 'unknown' };
  }

  // eBay ajoute, sous les vrais résultats, une section « moins de mots » : on la coupe.
  const cut = html.search(
    /srp-river-answer--NO_EXACT_MATCHES|r[ée]sultats? correspondant [àa] moins de mots|srp-save-null-search/i
  );
  const head = cut >= 0 ? html.slice(0, cut) : html;

  const titles = [];
  const re = /<(?:div|span|h3)[^>]*class="[^"]*(?:s-item__title|s-card__title)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|h3)>/gi;
  let m;
  while ((m = re.exec(head))) titles.push(stripTags(m[1]));

  if (titles.length === 0) {
    // Page de résultats sans aucune annonce exploitable
    if (/aucun r[ée]sultat|0\s+r[ée]sultat/i.test(html) || cut >= 0) {
      return { state: 'ok', count: 0 };
    }
    return { state: 'unknown' };
  }

  const rx = HPL.codeRegex(code);
  const count = titles.filter((t) => rx.test(t)).length;
  return { state: 'ok', count, truncated: titles.length >= 240 };
}

async function ebayHtmlCount(fig) {
  const r = await http(HPL.ebayUrl(HPL.query(fig)));
  if ([403, 429, 503].includes(r.status)) throw new Blocked(`HTTP ${r.status}`);
  const html = await r.text();
  const res = parseEbayHtml(html, fig.code);
  if (res.state === 'blocked') throw new Blocked('challenge anti-bot');
  if (res.state === 'unknown') throw new Error('page eBay non reconnue');
  return res.count;
}

let ebayToken = null;
async function getEbayToken() {
  if (ebayToken) return ebayToken;
  const id = process.env.EBAY_CLIENT_ID;
  const secret = process.env.EBAY_CLIENT_SECRET;
  const r = await http('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials&scope=' + encodeURIComponent('https://api.ebay.com/oauth/api_scope')
  });
  if (!r.ok) throw new Blocked(`OAuth eBay refusé (HTTP ${r.status}) — vérifie EBAY_CLIENT_ID / EBAY_CLIENT_SECRET`);
  ebayToken = (await r.json()).access_token;
  return ebayToken;
}

async function ebayApiCount(fig) {
  const token = await getEbayToken();
  const rx = HPL.codeRegex(fig.code);
  let matched = 0;
  for (let offset = 0, page = 0; page < 5; page++, offset += 200) {
    const url =
      'https://api.ebay.com/buy/browse/v1/item_summary/search?q=' +
      encodeURIComponent(HPL.query(fig)) +
      `&limit=200&offset=${offset}`;
    const r = await http(url, {
      headers: { Authorization: `Bearer ${token}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_FR' }
    });
    if (r.status === 401 || r.status === 403) throw new Blocked(`API eBay HTTP ${r.status}`);
    if (!r.ok) throw new Error(`API eBay HTTP ${r.status}`);
    const j = await r.json();
    for (const it of j.itemSummaries || []) if (rx.test(it.title || '')) matched++;
    if (offset + 200 >= (j.total || 0)) break;
  }
  return matched;
}

/* ---------------------------------------------------------------- Vinted */

let vintedCookie = null;
async function getVintedCookie() {
  if (vintedCookie) return vintedCookie;
  const r = await http('https://www.vinted.fr/', { headers: { Accept: 'text/html' } });
  if ([403, 429, 503].includes(r.status)) throw new Blocked(`HTTP ${r.status}`);
  const cookies = (r.headers.getSetCookie ? r.headers.getSetCookie() : [])
    .map((c) => c.split(';')[0])
    .join('; ');
  if (!cookies) throw new Blocked('pas de cookie de session Vinted');
  vintedCookie = cookies;
  return vintedCookie;
}

async function vintedCount(fig) {
  const cookie = await getVintedCookie();
  const rx = HPL.codeRegex(fig.code);
  let matched = 0;
  for (let page = 1; page <= 3; page++) {
    const url =
      'https://www.vinted.fr/api/v2/catalog/items?per_page=96&page=' +
      page +
      '&search_text=' +
      encodeURIComponent(HPL.query(fig));
    const r = await http(url, { headers: { Cookie: cookie, Accept: 'application/json' } });
    if ([401, 403, 429].includes(r.status)) throw new Blocked(`HTTP ${r.status}`);
    if (!r.ok) throw new Error(`Vinted HTTP ${r.status}`);
    const j = await r.json();
    for (const it of j.items || []) if (rx.test(it.title || '')) matched++;
    const total = (j.pagination && j.pagination.total_pages) || 1;
    if (page >= total) break;
  }
  return matched;
}

/* ------------------------------------------------------------------ main */

const hasEbayKeys = !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);

const SOURCES = [
  { id: 'ebay', label: 'eBay.fr', method: hasEbayKeys ? 'api' : 'html', run: hasEbayKeys ? ebayApiCount : ebayHtmlCount },
  { id: 'vinted', label: 'Vinted', method: 'api-web', run: vintedCount }
];

async function main() {
  const figures = loadFigures();
  const prev = loadPrevious();
  const now = new Date().toISOString();
  const items = {};
  const status = {};

  for (const f of figures) {
    const p = (prev.items && prev.items[f.code]) || {};
    items[f.code] = {
      ebay: p.ebay ?? null,
      vinted: p.vinted ?? null,
      leboncoin: p.leboncoin ?? null,
      amazon: p.amazon ?? null,
      coleka: p.coleka ?? null,
      total: null,
      manual: p.manual ?? null,
      checked: { ...(p.checked || {}) },
      note: ''
    };
  }

  for (const src of SOURCES) {
    const st = { label: src.label, method: src.method, fresh: 0, failed: 0, state: 'ok', error: null };
    status[src.id] = st;
    let consecutiveBlocked = 0;
    console.log(`\n=== ${src.label} (${src.method}) ===`);

    for (let i = 0; i < figures.length; i++) {
      const f = figures[i];
      if (st.state === 'blocked') {
        st.failed++;
        continue;
      }
      process.stdout.write(`[${i + 1}/${figures.length}] ${f.code} ${f.name} ... `);
      try {
        const n = await src.run(f);
        items[f.code][src.id] = n;
        items[f.code].checked[src.id] = now;
        st.fresh++;
        consecutiveBlocked = 0;
        console.log(n);
      } catch (e) {
        st.failed++;
        st.error = e.message;
        console.log('— ' + e.message);
        if (e instanceof Blocked && ++consecutiveBlocked >= MAX_CONSECUTIVE_BLOCKED) {
          st.state = 'blocked';
          console.log(`Source bloquée après ${MAX_CONSECUTIVE_BLOCKED} échecs : on arrête ici pour ${src.label}.`);
        }
      }
      await jitter();
    }

    if (st.state !== 'blocked') st.state = st.fresh === 0 ? 'failed' : st.failed ? 'partial' : 'ok';
    if (st.state === 'blocked' || st.state === 'failed') {
      console.log(`::warning::${src.label} : aucun relevé (${st.error || 'inconnu'})`);
    }
  }

  for (const f of figures) {
    const it = items[f.code];
    const parts = ['ebay', 'vinted', 'leboncoin', 'amazon', 'coleka'].map((k) => it[k]).filter((x) => x != null);
    it.total = it.manual != null ? it.manual : parts.length ? parts.reduce((a, b) => a + b, 0) : null;
  }

  const anyFresh = Object.values(status).some((s) => s.fresh > 0);
  const payload = {
    updatedAt: anyFresh ? now : prev.updatedAt || null,
    lastRunAt: now,
    sources: status,
    note:
      "Nombre d'annonces actives dont le titre contient le code de l'item. Indicatif : un vendeur qui n'écrit pas le code dans son titre n'est pas compté.",
    items
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  const summary = Object.entries(status)
    .map(([k, s]) => `${k}: ${s.fresh}/${figures.length} (${s.state})`)
    .join(' · ');
  console.log(`\nÉcrit ${path.relative(process.cwd(), OUT)} — ${summary}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { parseEbayHtml };
