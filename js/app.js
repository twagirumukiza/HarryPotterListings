/**
 * HarryPotterListings — compteur d'exemplaires en vente
 * - Charge data/listings.json (GitHub Actions / commit)
 * - Saisie manuelle persistée en localStorage (prioritaire)
 * - Ouvre recherches multi-marketplaces préremplies
 */
const LS_KEY = 'hplistings-manual-v1';

const MARKETS = [
  {
    id: 'ebay',
    label: 'eBay',
    url: (q) => `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(q)}&_sacat=0&LH_ItemCondition=3|4|1000&rt=nc&LH_PrefLoc=1`
  },
  {
    id: 'vinted',
    label: 'Vinted',
    url: (q) => `https://www.vinted.fr/catalog?search_text=${encodeURIComponent(q)}`
  },
  {
    id: 'leboncoin',
    label: 'Leboncoin',
    url: (q) => `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(q)}`
  },
  {
    id: 'amazon',
    label: 'Amazon',
    url: (q) => `https://www.amazon.fr/s?k=${encodeURIComponent(q)}`
  },
  {
    id: 'coleka',
    label: 'Coleka',
    url: (q) => `https://www.coleka.com/fr/search?q=${encodeURIComponent(q)}`
  },
  {
    id: 'mercari',
    label: 'Mercari JP',
    url: (q) => `https://jp.mercari.com/search?keyword=${encodeURIComponent(q)}`
  }
];

let remote = { items: {}, updatedAt: null };
let manual = loadManual();

function loadManual() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; }
  catch { return {}; }
}
function saveManual() {
  localStorage.setItem(LS_KEY, JSON.stringify(manual));
}

async function loadRemote() {
  try {
    const r = await fetch('data/listings.json?t=' + Date.now());
    if (r.ok) remote = await r.json();
  } catch (e) {
    console.warn('listings.json indisponible', e);
  }
}

function searchQuery(fig) {
  return `Kinder Joy Harry Potter ${fig.name} ${fig.code}`;
}

function countsFor(code) {
  const r = (remote.items && remote.items[code]) || {};
  const m = manual[code] || {};
  const out = {
    ebay: num(m.ebay ?? r.ebay),
    vinted: num(m.vinted ?? r.vinted),
    leboncoin: num(m.leboncoin ?? r.leboncoin),
    amazon: num(m.amazon ?? r.amazon),
    coleka: num(m.coleka ?? r.coleka),
    manual: num(m.manual ?? r.manual)
  };
  const parts = [out.ebay, out.vinted, out.leboncoin, out.amazon, out.coleka].filter(x => x != null);
  if (out.manual != null) out.total = out.manual;
  else if (parts.length) out.total = parts.reduce((a, b) => a + b, 0);
  else out.total = null;
  out._hasLocal = !!(manual[code] && Object.keys(manual[code]).length);
  return out;
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

function openAll(fig) {
  const q = searchQuery(fig);
  MARKETS.forEach((m, i) => {
    setTimeout(() => window.open(m.url(q), '_blank'), i * 200);
  });
}

function setField(code, field, value) {
  if (!manual[code]) manual[code] = {};
  const n = String(value).trim();
  if (n === '' || isNaN(n)) delete manual[code][field];
  else manual[code][field] = Math.max(0, Math.floor(Number(n)));
  if (!Object.keys(manual[code]).length) delete manual[code];
  saveManual();
  render();
}

function exportJson() {
  const items = {};
  FIGURES.forEach(f => {
    items[f.code] = countsFor(f.code);
    delete items[f.code]._hasLocal;
  });
  const blob = new Blob([JSON.stringify({
    updatedAt: new Date().toISOString(),
    note: 'Export HarryPotterListings (saisies locales + remote)',
    items
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'listings-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
}

function clearLocal() {
  if (!confirm('Effacer toutes les saisies locales ?')) return;
  manual = {};
  saveManual();
  render();
}

function renderStats(list) {
  let withData = 0, sum = 0, zero = 0;
  list.forEach(f => {
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

function renderCard(fig) {
  const c = countsFor(fig.code);
  const fmt = (v) => v == null ? '—' : String(v);
  const cls = (v) => v == null ? 'n null' : 'n';
  return `<article class="card" data-code="${fig.code}">
    <div class="card-head">
      <div>
        <span class="code">${fig.code}</span>
        <h3>${esc(fig.name)}</h3>
      </div>
      <span class="badge">${fig.category || fig.rarity || ''}${c._hasLocal ? ' · local' : ''}</span>
    </div>
    <div class="counts">
      <div class="cnt"><div class="${cls(c.ebay)}">${fmt(c.ebay)}</div><div class="l">eBay</div></div>
      <div class="cnt"><div class="${cls(c.vinted)}">${fmt(c.vinted)}</div><div class="l">Vinted</div></div>
      <div class="cnt"><div class="${cls(c.leboncoin)}">${fmt(c.leboncoin)}</div><div class="l">LBC</div></div>
      <div class="cnt"><div class="${cls(c.amazon)}">${fmt(c.amazon)}</div><div class="l">Amazon</div></div>
      <div class="cnt total"><div class="${cls(c.total)}">${fmt(c.total)}</div><div class="l">Total</div></div>
    </div>
    <div class="actions">
      <button type="button" data-open="${fig.code}">🔍 Ouvrir recherches</button>
      ${MARKETS.slice(0, 4).map(m =>
        `<a href="${m.url(searchQuery(fig))}" target="_blank" rel="noopener">${m.label}</a>`
      ).join('')}
    </div>
    <div class="manual-row">
      <span style="font-size:.8rem;color:var(--muted)">Saisie :</span>
      <input type="number" min="0" placeholder="eBay" title="eBay" data-f="ebay" data-c="${fig.code}" value="${c.ebay ?? ''}" />
      <input type="number" min="0" placeholder="Vinted" title="Vinted" data-f="vinted" data-c="${fig.code}" value="${c.vinted ?? ''}" />
      <input type="number" min="0" placeholder="Total forcé" title="Total manuel (écrase la somme)" data-f="manual" data-c="${fig.code}" value="${c.manual ?? ''}" />
    </div>
  </article>`;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
}

function filtered() {
  const q = (document.getElementById('q').value || '').trim().toLowerCase();
  const cat = document.getElementById('cat').value;
  return FIGURES.filter(f => {
    if (cat && f.category !== cat) return false;
    if (!q) return true;
    return (f.name + ' ' + f.code).toLowerCase().includes(q);
  });
}

function render() {
  const list = filtered();
  renderStats(list);
  document.getElementById('grid').innerHTML = list.map(renderCard).join('') || '<p class="note">Aucun item.</p>';
  const t = remote.updatedAt ? new Date(remote.updatedAt).toLocaleString('fr-FR') : '—';
  document.getElementById('updatedLabel').textContent =
    `Fichier distant mis à jour : ${t} · Saisies locales : ${Object.keys(manual).length} item(s)`;
}

document.getElementById('grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-open]');
  if (!btn) return;
  const fig = FIGURES.find(f => f.code === btn.dataset.open);
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

(async function init() {
  await loadRemote();
  render();
})();
