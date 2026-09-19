/* ==========================================================================
   CARTES DE PARTAGE
   ==========================================================================
   Le visuel commun aux cartes Open Graph et Twitter. Les deux étaient deux
   copies du même code, à maintenir en double.

   Le logo est lu sur le disque au moment du build et embarqué en base64 :
   satori ne sait pas aller chercher un chemin relatif, et le fichier vit hors
   de `public/` pour ne pas être livré au visiteur — il ne sert qu'ici.

   C'est la version CLAIRE du logo : le fond de la carte est l'encre #0B1726.
   ========================================================================== */

import { readFileSync } from "node:fs"
import path from "node:path"

const ENCRE = "#0b1726"
const PAPIER = "#fcfbf8"
const TERRACOTTA = "#d96c4f"

/* Lu une seule fois par processus de build. */
const LOGO_CLAIR = `data:image/png;base64,${readFileSync(
  path.join(process.cwd(), "src/assets/logo-clair.png")
).toString("base64")}`

export const TAILLE_CARTE = { width: 1200, height: 630 }

export function CartePartage({ accroche }: { accroche: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        backgroundColor: ENCRE,
        fontFamily: "sans-serif",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_CLAIR} alt="" width={470} height={130} />

      {/* La signature de la marque : deux filets et un losange. */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", width: 60, height: 1, backgroundColor: "rgba(252,251,248,0.28)" }} />
        <div
          style={{
            display: "flex",
            width: 9,
            height: 9,
            backgroundColor: TERRACOTTA,
            transform: "rotate(45deg)",
          }}
        />
        <div style={{ display: "flex", width: 60, height: 1, backgroundColor: "rgba(252,251,248,0.28)" }} />
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 42,
          fontWeight: 600,
          color: PAPIER,
          textAlign: "center",
          maxWidth: 940,
          lineHeight: 1.3,
        }}
      >
        {accroche}
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: "rgba(252,251,248,0.62)",
          letterSpacing: 1,
        }}
      >
        studiodigitalnova.fr
      </div>
    </div>
  )
}

/*
  Le bandeau de marque posé sur les cartes d'article, en haut à gauche.

  Le logo clair se pose sur la photo de couverture, dont on ne maîtrise ni la
  clarté ni le contenu : sur un mur blanc il disparaissait. Un pavé d'encre
  translucide derrière lui garantit la lisibilité quelle que soit l'image.
*/
export function BandeauMarque() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px 24px",
        borderRadius: 16,
        backgroundColor: "rgba(11,23,38,0.78)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_CLAIR} alt="" width={254} height={70} />
    </div>
  )
}
