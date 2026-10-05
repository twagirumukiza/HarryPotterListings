/**
 * Mise à jour optionnelle des compteurs via eBay Finding API (clé App ID).
 * Usage:
 *   EBAY_APP_ID=xxx node scripts/update-listings.js
 *
 * Sans clé : génère la structure vide (placeholders).
 * Limites : eBay Finding API — quotas développeur ; Vinted/LBC n'ont pas d'API publique stable.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const FIGURES_JS = path.join(ROOT, 'js', 'figures.js');
const OUT = path.join(ROOT, 'data', 'listings.json');
const APP_ID = process.env.EBAY_APP_ID || '';

function extractCodes() {
  const src = fs.readFileSync(FIGURES_JS, 'utf8');
  const codes = [...src.matchAll(/code:\s*"([^"]+)"/g)].map(m => m[1]);
  const names = [...src.matchAll(/name:\s*"([^"]+)"[\s\S]*?code:\s*"([^"]+)"/g)];
  const map = {};
  names.forEach(m => { map[m[2]] = m[1]; });
  // fallback
  codes.forEach(c => { if (!map[c]) map[c] = c; });
  return map;
}

function ebayCount(keywords) {
  return new Promise((resolve) => {
    if (!APP_ID) return resolve(null);
    const q = encodeURIComponent(keywords);
    const url =
      `https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsByKeywords` +
      `&SERVICE-VERSION=1.13.0&SECURITY-APPNAME=${APP_ID}&RESPONSE-DATA-FORMAT=JSON` +
      `&REST-PAYLOAD&keywords=${q}&paginationInput.entriesPerPage=1` +
      `&GLOBAL-ID=EBAY-FR&siteid=71`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const n = j?.findItemsByKeywordsResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0];
          resolve(n != null ? Number(n) : null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  const map = extractCodes();
  const items = {};
  const codes = Object.keys(map);
  console.log(`Items: ${codes.length} | eBay API: ${APP_ID ? 'oui' : 'non (placeholders)'}`);

  for (const code of codes) {
    const name = map[code];
    const keywords = `Kinder Joy Harry Potter ${name} ${code}`;
    let ebay = null;
    if (APP_ID) {
      ebay = await ebayCount(keywords);
      await new Promise(r => setTimeout(r, 350)); // douceur quota
      console.log(code, 'ebay=', ebay);
    }
    items[code] = {
      ebay,
      vinted: null,
      leboncoin: null,
      amazon: null,
      coleka: null,
      total: ebay,
      manual: null
    };
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    sources: ['ebay.fr (Finding API si EBAY_APP_ID)', 'saisie manuelle app'],
    note: 'Compteurs annonces actives. Vinted/LBC/Amazon à compléter manuellement ou via autres sources.',
    items
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log('Written', OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
