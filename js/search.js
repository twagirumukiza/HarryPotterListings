/**
 * Logique de recherche PARTAGÉE entre le site (navigateur) et le script
 * de relevé (Node). Ainsi le lien « eBay » affiché sur le site correspond
 * exactement à la recherche dont le script a compté les résultats.
 */
(function (root) {
  const HPL = {
    /** Requête envoyée aux marketplaces : le code produit seul (le plus fiable). */
    query(fig) {
      return fig.code;
    },

    /**
     * Une annonce compte pour l'item si son titre contient le code,
     * sans lettre/chiffre collé (VD390 ne doit pas matcher VD390A).
     */
    codeRegex(code) {
      return new RegExp('(?<![A-Z0-9])' + code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Z0-9])', 'i');
    },

    ebayUrl(q) {
      return 'https://www.ebay.fr/sch/i.html?_nkw=' + encodeURIComponent(q) + '&_sacat=0&_ipg=240&rt=nc';
    },
    vintedUrl(q) {
      return 'https://www.vinted.fr/catalog?search_text=' + encodeURIComponent(q);
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = HPL;
  else root.HPL = HPL;
})(typeof self !== 'undefined' ? self : this);
