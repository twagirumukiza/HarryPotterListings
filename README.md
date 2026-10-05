# HarryPotterListings

Application pour **compter le nombre d’exemplaires en vente** (annonces actives) à un instant *t* pour chaque item Kinder Joy × Harry Potter.

Site compagnon : [HarryPotterPops](https://twagirumukiza.github.io/HarryPotterPops/)

## Ce que fait l’app

| Fonction | Détail |
|----------|--------|
| Grille des 50 items | Code + nom + compteurs |
| Marketplaces | eBay, Vinted, Leboncoin, Amazon, Coleka, Mercari JP |
| Bouton « Ouvrir recherches » | Onglets préremplis pour compter |
| Saisie manuelle | Totaux / par site → **localStorage** |
| Export JSON | Pour archiver ou committer |
| Auto (optionnel) | GitHub Action + **eBay Finding API** |

## Limite importante

Un site **statique** (GitHub Pages) **ne peut pas scraper** Vinted / Leboncoin / eBay depuis le navigateur (CORS + conditions d’utilisation).

Solutions réalistes :

1. **Semi-auto (zéro compte)** — ouvrir les recherches, lire le nombre d’annonces, saisir dans l’app  
2. **Auto eBay** — créer une [clé développeur eBay](https://developer.ebay.com/), la mettre en secret GitHub `EBAY_APP_ID`, laisser l’Action tourner chaque jour  
3. **Backend plus tard** — Supabase Edge Function qui interroge les APIs et écrit dans `listings.json`

## Installation GitHub Pages

1. Crée un dépôt `HarryPotterListings`
2. Pousse tout le contenu de ce dossier
3. Settings → Pages → branch `main` / root
4. Ouvre `https://<user>.github.io/HarryPotterListings/`

### Auto eBay (optionnel)

1. Compte [eBay Developers](https://developer.ebay.com/) → App ID (Production)
2. Repo → Settings → Secrets → `EBAY_APP_ID`
3. Actions → « Update listings counts » → Run workflow

## Structure

```
HarryPotterListings/
  index.html
  css/style.css
  js/figures.js      # 50 items
  js/app.js
  data/listings.json # compteurs (mis à jour par Action ou export)
  scripts/update-listings.js
  .github/workflows/update-listings.yml
```

## Licence

Outil fan, non affilié Warner Bros., Funko, Kinder ni Ferrero.
