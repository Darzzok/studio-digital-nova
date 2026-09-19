import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#0b1726",
    /*
      Le manifeste ne déclarait que le fichier .ico. Android n'y trouvait donc
      rien d'utilisable pour une icône d'accueil, et les moteurs n'avaient
      qu'une seule définition à se mettre sous la dent. Les deux PNG du pack —
      192 et 512 — comblent ça.

      Usage « any » et non « maskable » : l'icône a son propre fond clair et
      ses coins arrondis, un masque système la rognerait.
    */
    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48 64x64",
        type: "image/x-icon",
      },
      {
        src: "/icons/icone-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icone-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
