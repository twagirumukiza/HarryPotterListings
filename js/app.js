/**
 * HarryPotterListings — compteur d'exemplaires en vente
 * - Charge data/listings.json (relevé automatique par GitHub Actions)
 * - Saisie manuelle persistée en localStorage (prioritaire sur le relevé)
 * - Liens de recherche identiques à ceux utilisés par le relevé automatique
 */
const LS_KEY = 'hplistings-manual-v1';
const REPO = 'twagirumukiza/HarryPotterListings';
const WORKFLOW_URL = `https://github.com/${REPO}/actions/workflows/update-listings.yml`;

const MARKETS = [
  { id: 'ebay', label: 'eBay', short: 'eBay', url: (q) => HPL.ebayUrl(q) },
  { id: 'vinted', label: 'Vinted', short: 'Vinted', url: (q) => HPL.vintedUrl(q) },
  { id: 'leboncoin', label: 'Leboncoin', short: 'LBC', url: (q) => `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(q)}` },
  { id: 'amazon', label: 'Amazon', short: 'Amazon', url: (q) => `https://www.amazon.fr/s?k=${encodeURIComponent(q)}` },
  { id: 'coleka', label: 'Coleka', short: 'Coleka', url: (q) => `https://www.coleka.com/fr/search?q=${encodeURIComponent(q)}` },
  { id: 'mercari', label: 'Mercari JP', short: 'Mercari', url: (q) => `https://jp.mercari.com/search?keyword=${encodeURIComponent(q)}` }
];
const COUNT_FIELDS = ['ebay', 'vinted', 'leboncoin', 'amazon'];

let remote = { items: {}, updatedAt: null, sources: {} };
let manual = loadManual();

function loadManual() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; }
  catch { return {}; }
}
function saveManual() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(manual)); } catch { /* stockage indisponible */ }
}

async function loadRemote() {
  try {
    const r = await fetch('data/listings.json?t=' + Date.now(), { cache: 'no-store' });
    if (r.ok) remote = await r.json();
  } catch (e) {
    console.warn('listings.json indisponible', e);
  }
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/** Valeurs affichées pour un item : saisie locale > relevé automatique. */
function countsFor(code) {
  const r = (remote.items && remote.items[code]) || {};
  const m = manual[code] || {};
  const out = { _remote: {}, _local: {}, _checked: r.checked || {} };
  COUNT_FIELDS.forEach((f) => {
    out[f] = num(m[f] ?? r[f]);
    out._remote[f] = num(r[f]);
    out._local[f] = num(m[f]);
  });
  out.manual = num(m.manual);
  out._remote.manual = num(r.manual);
  const parts = COUNT_FIELDS.map((f) => out[f]).filter((x) => x != null);
  out.total = out.manual != null ? out.manual : (num(r.manual) ?? (parts.length ? parts.reduce((a, b) => a + b, 0) : null));
  out._hasLocal = !!(manual[code] && Object.keys(manual[code]).length);
  return out;
}

function ago(iso) {
  if (!iso) return '';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(min)) return '';
  if (min < 2) return "à l'instant";
  if (min < 90) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

function openAll(fig) {
  const q = HPL.query(fig);
  // Les navigateurs ne tolèrent que quelques pop-ups : on ouvre les 4 principales
  MARKETS.slice(0, 4).forEach((m, i) => {
    setTimeout(() => window.open(m.url(q), '_blank', 'noopener'), i * 150);
  });
}

function setField(code, field, value) {
  if (!manual[code]) manual[code] = {};
  const s = String(value).trim();
  if (s === '' || isNaN(s)) delete manual[code][field];
  else manual[code][field] = Math.max(0, Math.floor(Number(s)));
  if (!Object.keys(manual[code]).length) delete manual[code];
  saveManual();
  refreshCard(code); // ne reconstruit pas toute la grille : le focus des champs est conservé
}

function exportJson() {
  const items = {};
  FIGURES.forEach((f) => {
    const c = countsFor(f.code);
    items[f.code] = {
      ebay: c.ebay, vinted: c.vinted, leboncoin: c.leboncoin, amazon: c.amazon,
      manual: c.manual, total: c.total, checked: c._checked
    };
  });
  const blob = new Blob([JSON.stringify({
    updatedAt: remote.updatedAt || null,
    exportedAt: new Date().toISOString(),
    note: 'Export HarryPotterListings (saisies locales + relevé automatique)',
    items
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'listings-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function clearLocal() {
  if (!confirm('Effacer toutes les saisies locales ?')) return;
  manual = {};
  saveManual();
  render();
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ------------------------------------------------------------- rendu */

function renderStats(list) {
  let withData = 0, sum = 0, zero = 0;
  list.forEach((f) => {
    const c = countsFor(f.code);
    if (c.total != null) {
      withData++;
      sum += c.total;
      if (c.total === 0) zero++;
    }
  });
  document.getElementById('stats').innerHTML = `
    <div class="stat"><b>${list.length}</b><span>Items</span></div>
    <div class="stat"><b>${withData}</b><span>Avec compteur</span></div>
    <div class="stat"><b>${sum}</b><span>Annonces (somme)</span></div>
    <div class="stat"><b>${zero}</b><span>À 0 en vente</span></div>
  `;
}

function srcState(id) {
  const s = remote.sources && remote.sources[id];
  return s ? s.state : null;
}

function cell(c, id, label) {
  const v = c[id];
  const at = c._checked[id];
  const local = c._local[id] != null;
  let title = '';
  if (v == null) {
    const st = srcState(id);
    title = st === 'blocked' ? 'Source bloquée lors du dernier relevé' : 'Pas de relevé';
  } else if (local) {
    title = 'Saisie locale';
  } else if (at) {
    title = 'Relevé ' + ago(at);
  }
  return `<div class="cnt" title="${esc(title)}"><div class="n${v == null ? ' null' : ''}">${v == null ? '—' : v}</div><div class="l">${label}</div></div>`;
}

function countsHtml(c) {
  return COUNT_FIELDS.map((id) => cell(c, id, MARKETS.find((m) => m.id === id).short)).join('') +
    `<div class="cnt total"><div class="n${c.total == null ? ' null' : ''}">${c.total == null ? '—' : c.total}</div><div class="l">Total</div></div>`;
}

function renderCard(fig) {
  const c = countsFor(fig.code);
  const q = HPL.query(fig);
  const inp = (f, label) =>
    `<input type="number" min="0" inputmode="numeric" placeholder="${c._remote[f] != null ? c._remote[f] : label}" title="${label} (saisie)" data-f="${f}" data-c="${fig.code}" value="${c._local[f] ?? ''}" />`;
  return `<article class="card" data-code="${fig.code}">
    <div class="card-head">
      <div>
        <span class="code">${fig.code}</span>
        <h3>${esc(fig.name)}</h3>
      </div>
      <span class="badge" data-badge>${esc(fig.category || fig.rarity || '')}${c._hasLocal ? ' · local' : ''}</span>
    </div>
    <div class="counts" data-counts>${countsHtml(c)}</div>
    <div class="actions">
      <button type="button" data-open="${fig.code}">🔍 Ouvrir recherches</button>
      ${MARKETS.slice(0, 4).map((m) => `<a href="${m.url(q)}" target="_blank" rel="noopener">${m.label}</a>`).join('')}
    </div>
    <div class="manual-row">
      <span class="note">Saisie :</span>
      ${inp('ebay', 'eBay')}${inp('vinted', 'Vinted')}${inp('leboncoin', 'LBC')}${inp('amazon', 'Amazon')}
      <input type="number" min="0" inputmode="numeric" placeholder="Total forcé" title="Total manuel (écrase la somme)" data-f="manual" data-c="${fig.code}" value="${c.manual ?? ''}" />
    </div>
  </article>`;
}

function refreshCard(code) {
  const el = document.querySelector(`.card[data-code="${CSS.escape(code)}"]`);
  const fig = FIGURES.find((f) => f.code === code);
  if (!el || !fig) return render();
  const c = countsFor(code);
  el.querySelector('[data-counts]').innerHTML = countsHtml(c);
  el.querySelector('[data-badge]').textContent = (fig.category || fig.rarity || '') + (c._hasLocal ? ' · local' : '');
  renderStats(filtered());
  renderUpdated();
}

function filtered() {
  const q = (document.getElementById('q').value || '').trim().toLowerCase();
  const cat = document.getElementById('cat').value;
  return FIGURES.filter((f) => {
    if (cat && f.category !== cat) return false;
    if (!q) return true;
    return (f.name + ' ' + f.code).toLowerCase().includes(q);
  });
}

function renderUpdated() {
  const el = document.getElementById('updatedLabel');
  if (remote.updatedAt) {
    el.textContent = `Dernier relevé : ${new Date(remote.updatedAt).toLocaleString('fr-FR')} (${ago(remote.updatedAt)}) · Saisies locales : ${Object.keys(manual).length} item(s)`;
    el.className = 'updated';
  } else {
    el.textContent = `Aucun relevé automatique pour l'instant · Saisies locales : ${Object.keys(manual).length} item(s)`;
    el.className = 'updated warn';
  }

  const box = document.getElementById('sourceStatus');
  const srcs = remote.sources || {};
  const labels = { ok: 'OK', partial: 'partiel', blocked: 'bloqué', failed: 'échec', skipped: 'ignoré' };
  box.innerHTML = Object.keys(srcs).map((id) => {
    const s = srcs[id];
    const tip = s.error ? ` title="${esc(s.error)}"` : '';
    return `<span class="pill ${esc(s.state)}"${tip}>${esc(s.label)} · ${labels[s.state] || esc(s.state)} · ${s.fresh} relevé(s)</span>`;
  }).join('');

  const ebay = srcs.ebay;
  const needKeys = ebay && ebay.method === 'html' && (ebay.state === 'blocked' || ebay.state === 'failed');
  document.getElementById('hint').hidden = !needKeys;
}

function render() {
  const list = filtered();
  renderStats(list);
  document.getElementById('grid').innerHTML = list.map(renderCard).join('') || '<p class="note">Aucun item.</p>';
  renderUpdated();
}

document.getElementById('grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-open]');
  if (!btn) return;
  const fig = FIGURES.find((f) => f.code === btn.dataset.open);
  if (fig) openAll(fig);
});
document.getElementById('grid').addEventListener('change', (e) => {
  const inp = e.target.closest('input[data-f]');
  if (!inp) return;
  setField(inp.dataset.c, inp.dataset.f, inp.value);
});
document.getElementById('q').addEventListener('input', render);
document.getElementById('cat').addEventListener('change', render);
document.getElementById('btnExport').addEventListener('click', exportJson);
document.getElementById('btnClearLocal').addEventListener('click', clearLocal);
document.getElementById('btnRefresh').addEventListener('click', async () => {
  await loadRemote();
  render();
});
document.getElementById('lnkRun').href = WORKFLOW_URL;

(async function init() {
  await loadRemote();
  render();
})();
