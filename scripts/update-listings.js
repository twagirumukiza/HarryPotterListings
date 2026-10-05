/**
 * Remplit automatiquement data/listings.json
 * en lisant le nombre de résultats visible sur les pages de recherche publiques.
 *
 * Aucune clé API requise.
 * Sources : eBay.fr (principal), tentative Vinted (souvent bloqué).
 *
 * Usage : node scripts/update-listings.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const FIGURES_JS = path.join(ROOT, 'js', 'figures.js');
const OUT = path.join(ROOT, 'data', 'listings.json');

function extractFigures() {
  const src = fs.readFileSync(FIGURES_JS, 'utf8');
  const list = [];
  const re = /\{\s*id:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"\s*,\s*code:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    list.push({ id: m[1], name: m[2], code: m[3] });
  }
  return list;
}

function fetchText(url, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > 5) return resolve('');
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
        },
        timeout: 20000
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, url).href;
          res.resume();
          return resolve(fetchText(next, redirects + 1));
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', () => resolve(''));
    req.on('timeout', () => {
      req.destroy();
      resolve('');
    });
  });
}

/** Extrait un nombre d'annonces depuis le HTML eBay */
function parseEbayCount(html) {
  if (!html) return null;
  // Formats fréquents eBay FR
  const patterns = [
    /(\d[\d\s\u00a0.]*)\s+r[eé]sultats?/i,
    /"totalEntries"\s*:\s*"?(\d+)"?/i,
    /"totalEntriesGuided"\s*:\s*"?(\d+)"?/i,
    /"itemMatchCount"\s*:\s*"?(\d+)"?/i,
    /aria-label="[^"]*?(\d[\d\s.]*)\s+r[eé]sultats?/i,
    /class="[^"]*srp-controls__count[^"]*"[^>]*>[\s\S]*?(\d[\d\s.]*)/i
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) {
      const n = parseInt(String(m[1]).replace(/[\s.\u00a0]/g, ''), 10);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  }
  // Parfois 0 résultat explicite
  if (/0\s+r[eé]sultat/i.test(html) || /aucun r[eé]sultat/i.test(html)) return 0;
  return null;
}

async function countEbay(name, code) {
  // Requête ciblée : code + Kinder (réduit le bruit)
  const q1 = encodeURIComponent(`${code} Kinder`);
  const url1 = `https://www.ebay.fr/sch/i.html?_nkw=${q1}&_sacat=0&LH_TitleDesc=0&rt=nc`;
  let html = await fetchText(url1);
  let n = parseEbayCount(html);
  if (n == null) {
    const q2 = encodeURIComponent(`Kinder Joy ${name} ${code}`);
    const url2 = `https://www.ebay.fr/sch/i.html?_nkw=${q2}&_sacat=0&rt=nc`;
    html = await fetchText(url2);
    n = parseEbayCount(html);
  }
  return n;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const figures = extractFigures();
  console.log(`Items: ${figures.length}`);
  console.log('Mode: lecture pages publiques eBay.fr (sans clé API)');

  const items = {};
  let ok = 0;

  for (let i = 0; i < figures.length; i++) {
    const f = figures[i];
    process.stdout.write(`[${i + 1}/${figures.length}] ${f.code} ${f.name} ... `);
    let ebay = null;
    try {
      ebay = await countEbay(f.name, f.code);
    } catch (e) {
      ebay = null;
    }
    console.log(ebay == null ? '—' : ebay);
    if (ebay != null) ok++;

    items[f.code] = {
      ebay,
      vinted: null,
      leboncoin: null,
      amazon: null,
      coleka: null,
      total: ebay,
      manual: null,
      note: ebay != null ? 'eBay.fr (page recherche publique)' : 'non trouvé / page bloquée'
    };

    // Pause pour ne pas surcharger
    await sleep(800 + Math.floor(Math.random() * 400));
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    sources: ['ebay.fr (pages de recherche publiques)'],
    note:
      'Compteurs automatiques basés sur le nombre de résultats visible sur eBay.fr. Indicatif — peut varier selon les filtres eBay.',
    stats: { items: figures.length, filled: ok },
    items
  };

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\nÉcrit ${OUT} — ${ok}/${figures.length} compteurs remplis`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
