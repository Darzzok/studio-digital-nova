/* ==========================================================================
   RAPPORT D'AUDIT AU FORMAT PDF
   ==========================================================================
   Même source que le web et le mail : le rapport produit par `lib/audit.ts`.
   Aucun score n'est recalculé ici, aucun constat n'est reformulé — ce fichier
   ne fait que mettre en page.

   Le document est un vrai PDF : texte sélectionnable, capture intégrée en
   JPEG, adresses cliquables, pages numérotées. Ce n'est pas une capture de la
   page web exportée.
   ========================================================================== */

import { type Constat, type RapportPage, type Strategy } from "@/lib/audit"
import { DocumentPdf, PAGE_PDF, type Couleur } from "@/lib/pdf"
import { siteConfig } from "@/lib/site"

const ENCRE: Couleur = [0.043, 0.09, 0.149]
const GRIS: Couleur = [0.42, 0.46, 0.5]
const TERRACOTTA: Couleur = [0.851, 0.424, 0.31]
const MINERAL: Couleur = [0.286, 0.396, 0.478]
const VERT: Couleur = [0.267, 0.384, 0.314]
const AMBRE: Couleur = [0.569, 0.388, 0.141]

const ton = (note: number): Couleur => (note >= 75 ? VERT : note >= 45 ? AMBRE : TERRACOTTA)

const LIBELLE_PRIORITE = { haute: "Prioritaire", moyenne: "À corriger", basse: "À surveiller" }
const LIBELLE_NATURE = { mesure: "Mesuré", appreciation: "Apprécié", non_verifie: "Non vérifié" }
const LIBELLE_APPAREIL: Record<Strategy, string> = { mobile: "Mobile", desktop: "Ordinateur" }

export type InfosRapport = {
  url: string
  prenom: string
  mobile: RapportPage | null
  desktop: RapportPage | null
}

/** Bloc « constat → preuve → conséquence → correction », jamais coupé en deux. */
function bloc(doc: DocumentPdf, c: Constat, rang?: number) {
  /* On réserve la hauteur complète : un constat ne se coupe pas en deux pages. */
  const hauteur =
    10 +
    doc.mesurerHauteur(c.constat, 11.5, "grasse", doc.largeurUtile - 96) +
    doc.mesurerHauteur(`Relevé : ${c.preuve}`, 9) +
    doc.mesurerHauteur(c.consequence, 9.5) +
    doc.mesurerHauteur(`À faire : ${c.recommandation}`, 9.5) +
    6
  doc.reserverBloc(hauteur)

  doc.espace(10)
  doc.texte(`${rang !== undefined ? `${String(rang).padStart(2, "0")}  ` : ""}${c.constat}`, {
    taille: 11.5,
    police: "grasse",
    couleur: ENCRE,
    largeur: doc.largeurUtile - 96,
  })
  doc.texteDroite(
    `${LIBELLE_PRIORITE[c.priorite]} · ${LIBELLE_NATURE[c.nature]}`,
    {
      taille: 8,
      police: "grasse",
      couleur: c.priorite === "haute" ? TERRACOTTA : c.priorite === "moyenne" ? AMBRE : MINERAL,
    }
  )
  doc.espace(2)
  doc.texte(`Relevé : ${c.preuve}  ·  ${LIBELLE_APPAREIL[c.appareil]}`, { taille: 9, couleur: MINERAL })
  doc.texte(c.consequence, { taille: 9.5, couleur: GRIS })
  doc.texte(`À faire : ${c.recommandation}`, { taille: 9.5, couleur: ENCRE })
}

export function construireRapport({ url, prenom, mobile, desktop }: InfosRapport): Blob {
  const doc = new DocumentPdf()
  const principal = mobile ?? desktop
  if (!principal) throw new Error("Aucun rapport à mettre en page.")

  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  /* ---- Couverture, compacte ---------------------------------------------- */
  doc.rectangle(0, PAGE_PDF.hauteur - 150, PAGE_PDF.largeur, 150, ENCRE)
  doc.espace(26)
  doc.texte("STUDIO DIGITAL NOVA", { taille: 8, police: "grasse", couleur: [1, 1, 1] })
  doc.texte("Audit de votre site", { taille: 23, police: "grasse", couleur: [1, 1, 1] })
  doc.texte(url, { taille: 10, couleur: [0.78, 0.81, 0.84] })
  doc.texte(`Analyse du ${date}`, { taille: 9, couleur: [0.62, 0.66, 0.7] })
  doc.espace(38)

  if (prenom) {
    doc.texte(`Bonjour ${prenom},`, { taille: 11, police: "grasse", couleur: ENCRE })
    doc.texte(
      "Voici ce que l'analyse a relevé sur votre page, classé par ordre de priorité. " +
        "Chaque point indique ce qui a été mesuré, ce que cela peut coûter, et quoi faire.",
      { taille: 10, couleur: GRIS }
    )
    doc.espace(12)
  }

  /* ---- Synthèse ----------------------------------------------------------- */
  doc.texte("SYNTHÈSE", { taille: 8, police: "grasse", couleur: GRIS })
  doc.espace(4)
  if (principal.note === null) {
    doc.texte("Bilan partiel", { taille: 28, police: "grasse", couleur: MINERAL })
    doc.espace(6)
    doc.texte(
      "Une dimension majeure n'a pas pu être mesurée sur cette page. Aucune note globale " +
        "n'est affichée : elle serait trompeuse. Les constats ci-dessous restent valables.",
      { taille: 9.5, couleur: GRIS }
    )
  } else {
    doc.texte(`${principal.note} / 100`, { taille: 32, police: "grasse", couleur: ton(principal.note) })
    doc.espace(6)
    doc.barre(principal.note, ton(principal.note))
    doc.espace(10)
    doc.texte(
      "Moyenne pondérée des dimensions réellement mesurées, ramenée à leur poids cumulé. " +
        "Une dimension non mesurable sort du calcul au lieu de compter zéro.",
      { taille: 9, couleur: GRIS }
    )
  }
  doc.espace(8)
  doc.filet()

  /* ---- Notes par dimension ------------------------------------------------ */
  doc.espace(10)
  doc.texte("LE DÉTAIL PAR DIMENSION", { taille: 8, police: "grasse", couleur: GRIS })
  for (const d of principal.dimensions) {
    doc.espace(7)
    doc.texte(`${d.libelle}  (${Math.round(d.poids * 100)} %)`, {
      taille: 11,
      police: "grasse",
      couleur: ENCRE,
    })
    doc.texteDroite(d.note === null ? "non mesuré" : `${d.note} / 100`, {
      taille: 11,
      police: "grasse",
      couleur: d.note === null ? GRIS : ton(d.note),
    })
    if (d.note !== null) doc.barre(d.note, ton(d.note))
    doc.texte(d.sens, { taille: 9, couleur: GRIS })
  }

  /* ---- Analyse visuelle, par appareil ------------------------------------- */
  for (const r of [mobile, desktop].filter((x): x is RapportPage => Boolean(x))) {
    doc.nouvellePage()
    doc.texte(`ANALYSE VISUELLE — ${LIBELLE_APPAREIL[r.appareil].toUpperCase()}`, {
      taille: 8,
      police: "grasse",
      couleur: GRIS,
    })
    doc.espace(4)
    doc.texte(r.url, { taille: 9, couleur: MINERAL })

    if (r.capture) {
      doc.espace(6)
      doc.imageJpeg(r.capture.data, r.appareil === "mobile" ? 190 : 340, r.capture.largeur / r.capture.hauteur)
      doc.texte(
        "Premier écran, tel que Google l'a affiché. Les éléments situés plus bas dans la page " +
          "ne figurent pas sur cette image.",
        { taille: 8.5, couleur: GRIS }
      )
    } else {
      doc.espace(6)
      doc.texte("Aucune capture n'a pu être obtenue pour cette page.", { taille: 9.5, couleur: GRIS })
    }

    const visuels = r.constats.filter((c) => c.dimension === "apparence")
    if (visuels.length) {
      doc.espace(12)
      doc.texte("Ce qui pèse sur l'apparence", { taille: 10, police: "grasse", couleur: ENCRE })
      visuels.forEach((c) => bloc(doc, c))
    } else {
      doc.espace(12)
      doc.texte("Aucun défaut d'apparence relevé au-dessus du seuil sur cette page.", {
        taille: 9.5,
        couleur: GRIS,
      })
    }
  }

  /* ---- Parcours et confiance ---------------------------------------------- */
  const parcours = principal.constats.filter((c) => c.dimension === "parcours")
  doc.nouvellePage()
  doc.texte("PARCOURS ET CONFIANCE", { taille: 8, police: "grasse", couleur: GRIS })
  doc.espace(4)
  if (parcours.length) {
    doc.texte(
      "Ce qui gêne un visiteur — ou Google — dans sa navigation vers vous.",
      { taille: 9.5, couleur: GRIS }
    )
    parcours.forEach((c) => bloc(doc, c))
  } else {
    doc.texte("Rien à signaler sur ce point pour cette page.", { taille: 9.5, couleur: GRIS })
  }

  /* ---- Résultats techniques ----------------------------------------------- */
  doc.espace(16)
  doc.filet()
  doc.espace(10)
  doc.texte("RÉSULTATS TECHNIQUES", { taille: 8, police: "grasse", couleur: GRIS })
  doc.espace(4)
  const technique = principal.constats.filter(
    (c) => c.dimension === "performance" || c.dimension === "referencement" || c.dimension === "pratiques"
  )
  if (technique.length) technique.forEach((c) => bloc(doc, c))
  else doc.texte("Aucun défaut technique relevé au-dessus du seuil.", { taille: 9.5, couleur: GRIS })

  if (principal.vitals.length) {
    doc.espace(14)
    doc.texte("Ce que ressent votre visiteur", { taille: 10, police: "grasse", couleur: ENCRE })
    doc.espace(4)
    for (const v of principal.vitals) {
      doc.texte(v.libelle, { taille: 10, couleur: ENCRE })
      doc.texteDroite(v.valeur, {
        taille: 10,
        police: "grasse",
        couleur: v.verdict === "bon" ? VERT : v.verdict === "moyen" ? AMBRE : v.verdict === "faible" ? TERRACOTTA : GRIS,
      })
      doc.texte(v.aide, { taille: 8.5, couleur: GRIS })
      doc.espace(3)
    }
  }

  /* ---- Plan d'action ------------------------------------------------------ */
  doc.nouvellePage()
  doc.texte("PLAN D'ACTION", { taille: 8, police: "grasse", couleur: GRIS })
  doc.espace(4)
  const ordonnes = [...principal.constats].sort(
    (a, b) => ({ haute: 0, moyenne: 1, basse: 2 })[a.priorite] - ({ haute: 0, moyenne: 1, basse: 2 })[b.priorite]
  )
  if (ordonnes.length) {
    doc.texte("Dans cet ordre : le plus rentable d'abord.", { taille: 9.5, couleur: GRIS })
    doc.espace(6)
    ordonnes.forEach((c, i) => {
      doc.espace(5)
      doc.texte(`${i + 1}.  ${c.recommandation}`, { taille: 10, couleur: ENCRE })
      doc.texte(`    ${c.constat} — ${LIBELLE_PRIORITE[c.priorite].toLowerCase()}`, {
        taille: 8.5,
        couleur: GRIS,
      })
    })
  } else {
    doc.texte("Aucune correction prioritaire n'a été relevée sur cette page.", { taille: 10, couleur: ENCRE })
  }

  /* ---- Ce qui n'a pas été vérifié ----------------------------------------- */
  doc.espace(16)
  doc.filet()
  doc.espace(10)
  doc.texte("CE QUE CETTE ANALYSE N'A PAS VÉRIFIÉ", { taille: 8, police: "grasse", couleur: GRIS })
  doc.espace(4)
  doc.texte(
    "Une analyse automatique mesure ce qui est mesurable. Les points suivants demandent un " +
      "œil humain : ils ne sont ni notés, ni comptés dans le bilan.",
    { taille: 9.5, couleur: GRIS }
  )
  doc.espace(4)
  for (const p of principal.nonVerifies) {
    doc.texte(`—  ${p}`, { taille: 9.5, couleur: GRIS })
  }

  /* ---- Accompagnement ------------------------------------------------------ */
  doc.espace(18)
  doc.filet()
  doc.espace(12)
  doc.texte("Parlons-en", { taille: 14, police: "grasse", couleur: ENCRE })
  doc.texte(
    "Je reprends votre site page par page et je vous dis quoi corriger en premier, et ce que " +
      "ça vaut. Réponse sous 24 heures, sans engagement.",
    { taille: 9.5, couleur: GRIS }
  )
  doc.espace(4)
  doc.texte(siteConfig.author.email, { taille: 10.5, police: "grasse", couleur: TERRACOTTA })
  doc.lienSurDerniereLigne(`mailto:${siteConfig.author.email}`, 180)
  doc.texte(siteConfig.url, { taille: 9.5, couleur: MINERAL })
  doc.lienSurDerniereLigne(siteConfig.url, 150)

  doc.paginer(`Audit ${url} — Studio Digital Nova`)

  return new Blob([doc.versOctets() as unknown as BlobPart], { type: "application/pdf" })
}

/** Déclenche le téléchargement du rapport dans le navigateur. */
export function telechargerRapport(blob: Blob, url: string) {
  const nom = url.replace(/^https?:\/\//, "").replace(/[^\w.-]+/g, "-").replace(/-+$/, "")
  const lien = document.createElement("a")
  lien.href = URL.createObjectURL(blob)
  lien.download = `audit-${nom || "site"}.pdf`
  document.body.appendChild(lien)
  lien.click()
  document.body.removeChild(lien)
  setTimeout(() => URL.revokeObjectURL(lien.href), 30_000)
}
