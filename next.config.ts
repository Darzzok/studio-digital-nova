import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  /*
    Sans cette option, l'export produit `faq.html` ET un dossier `faq/`.
    Sur un hébergement Apache/LiteSpeed, `/faq` correspond alors au DOSSIER :
    le serveur redirige vers `/faq/`, n'y trouve pas d'index, et renvoie 403.
    Il fallait un `.htaccess` de réécriture pour rattraper ça — donc le site
    cassait dès que ce fichier n'était pas lu.

    Avec `trailingSlash`, Next écrit `faq/index.html` : le serveur sert la page
    nativement, sans aucune règle de réécriture. Ça marche sur n'importe quel
    hébergement statique.
  */
  trailingSlash: true,
  /*
    Aucune optimisation d'images côté serveur : le site est exporté en statique.
    Les déclinaisons sont produites au build par `scripts/images-responsives.mjs`
    et servies par le composant `NovaImage`, qui écrit lui-même son `srcset`.
  */
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
