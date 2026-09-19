/* ==========================================================================
   RAPPORT D'AUDIT AU FORMAT PDF
   ==========================================================================
   Même source que le web : le rapport produit par `lib/audit.ts`. Aucun score
   n'est recalculé, aucun constat reformulé — ce fichier met en page.

   Vrai document : texte sélectionnable, logo et captures intégrés, adresses
   cliquables, pages numérotées, blocs insécables. Ce n'est pas une capture de
   la page web exportée.

   La charte est reprise telle quelle : encre #0B1726, ivoire #F7F4EE,
   terracotta #D96C4F, bleu minéral #49657A.
   ========================================================================== */

import { type Constat, type RapportPage, type Strategy } from "@/lib/audit"
import { LOGO_PDF_JPEG, LOGO_PDF_RATIO } from "@/lib/logo-pdf"
import { DocumentPdf, PAGE_PDF, type Couleur } from "@/lib/pdf"
import { siteConfig } from "@/lib/site"

/* Charte, convertie une fois pour toutes en composantes 0-1. */
const ENCRE: Couleur = [0.043, 0.09, 0.149]
const IVOIRE: Couleur = [0.969, 0.957, 0.933]
const IVOIRE_CREUX: Couleur = [0.941, 0.918, 0.878]
const PAPIER: Couleur = [0.988, 0.984, 0.973]
const BLANC: Couleur = [1, 1, 1]
const TERRACOTTA: Couleur = [0.851, 0.424, 0.31]
const TERRACOTTA_PALE: Couleur = [0.976, 0.941, 0.925]
const MINERAL: Couleur = [0.286, 0.396, 0.478]
const GRIS: Couleur = [0.42, 0.46, 0.5]
const VERT: Couleur = [0.267, 0.384, 0.314]
const AMBRE: Couleur = [0.569, 0.388, 0.141]
const SABLE: Couleur = [0.902, 0.875, 0.824]

const ton = (note: number): Couleur => (note >= 75 ? VERT : note >= 45 ? AMBRE : TERRACOTTA)

const LIBELLE_PRIORITE = { haute: "Prioritaire", moyenne: "À corriger", basse: "À surveiller" }
const LIBELLE_NATURE = { mesure: "Mesuré", appreciation: "Apprécié", non_verifie: "Non vérifié" }
const APPAREIL: Record<Strategy, string> = { mobile: "Mobile", desktop: "Ordinateur" }

export type InfosRapport = {
  url: string
  prenom: string
  mobile: RapportPage | null
  desktop: RapportPage | null
}

/* -------------------------------------------------------------------------- */
/* Briques de mise en page                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Titre de section : filet terracotta, surtitre, puis un peu d'air.
 * `hauteurSuivante` réserve la place du premier bloc qui suit, pour éviter un
 * titre seul en bas de page. Les sections faites d'un panneau unique passent
 * plutôt par `panneauTitre`, qui rend la séparation impossible.
 */
function titreSection(doc: DocumentPdf, texte: string, hauteurSuivante = 90) {
  doc.reserverBloc(hauteurSuivante + 44)
  doc.espace(18)
  doc.rectangle(48, doc.position - 2, 26, 2, TERRACOTTA)
  doc.espace(10)
  doc.texte(texte.toUpperCase(), { taille: 8.5, police: "grasse", couleur: MINERAL })
  doc.espace(4)
}

/**
 * Panneau portant son titre à l'intérieur. Comme le titre et le contenu sont
 * dans le même bloc réservé, ils ne peuvent pas se retrouver sur deux pages —
 * ce qui arrivait avec un titre posé au-dessus, faute de pouvoir estimer la
 * hauteur au point près.
 */
function panneauTitre(
  doc: DocumentPdf,
  titre: string,
  hauteur: number,
  fond: Couleur
): () => void {
  const fermer = doc.panneau(hauteur + 22, fond, { marge: 16 })
  doc.texte(titre.toUpperCase(), { taille: 8.5, police: "grasse", couleur: MINERAL })
  doc.espace(6)
  return fermer
}

/** Ligne « libellé — note » avec sa barre, à l'intérieur d'un panneau. */
function ligneNote(doc: DocumentPdf, libelle: string, note: number | null, sens?: string) {
  doc.espace(6)
  doc.texte(libelle, { taille: 10.5, police: "grasse", couleur: ENCRE })
  doc.texteDroite(note === null ? "non mesuré" : `${note}`, {
    taille: 12,
    police: "grasse",
    couleur: note === null ? GRIS : ton(note),
  })
  if (note !== null) doc.barre(note, ton(note))
  if (sens) doc.texte(sens, { taille: 8.5, couleur: GRIS })
}

/** Un constat, dans son propre panneau teinté. Jamais coupé en deux pages. */
function panneauConstat(doc: DocumentPdf, c: Constat, rang?: number) {
  const titre = `${rang !== undefined ? `${String(rang).padStart(2, "0")}   ` : ""}${c.constat}`
  const hauteur =
    doc.mesurerHauteur(titre, 11.5, "grasse", 330) +
    doc.mesurerHauteur(`Relevé  ${c.preuve}  ·  ${APPAREIL[c.appareil]}`, 8.5, "normale", 420) +
    doc.mesurerHauteur(c.consequence, 9.5, "normale", 420) +
    doc.mesurerHauteur(`À faire  ${c.recommandation}`, 9.5, "normale", 420) +
    22

  const fond = c.priorite === "haute" ? TERRACOTTA_PALE : PAPIER
  const filet = c.priorite === "haute" ? TERRACOTTA : c.priorite === "moyenne" ? AMBRE : SABLE
  const fermer = doc.panneau(hauteur, fond, { filetGauche: filet })

  doc.texte(titre, { taille: 11.5, police: "grasse", couleur: ENCRE, largeur: 330 })
  doc.texteDroite(`${LIBELLE_PRIORITE[c.priorite]} · ${LIBELLE_NATURE[c.nature]}`, {
    taille: 7.5,
    police: "grasse",
    couleur: c.priorite === "haute" ? TERRACOTTA : c.priorite === "moyenne" ? AMBRE : MINERAL,
  })
  doc.espace(3)
  doc.texte(`Relevé  ${c.preuve}  ·  ${APPAREIL[c.appareil]}`, { taille: 8.5, couleur: MINERAL })
  doc.espace(2)
  doc.texte(c.consequence, { taille: 9.5, couleur: GRIS })
  doc.espace(2)
  doc.texte(`À faire  ${c.recommandation}`, { taille: 9.5, police: "grasse", couleur: ENCRE })
  fermer()
}

/* -------------------------------------------------------------------------- */
/* Document                                                                    */
/* -------------------------------------------------------------------------- */

export function construireRapport({ url, prenom, mobile, desktop }: InfosRapport): Blob {
  const doc = new DocumentPdf()
  const principal = mobile ?? desktop
  if (!principal) throw new Error("Aucun rapport à mettre en page.")

  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  const domaine = url.replace(/^https?:\/\//, "").replace(/\/$/, "")

  /* ---- Couverture --------------------------------------------------------- */
  doc.rectangle(0, PAGE_PDF.hauteur - 232, PAGE_PDF.largeur, 232, ENCRE)
  doc.espace(34)
  doc.imageJpeg(LOGO_PDF_JPEG, 112, LOGO_PDF_RATIO)
  doc.espace(16)
  doc.texte("Audit de votre site", { taille: 26, police: "grasse", couleur: BLANC })
  doc.espace(2)
  doc.texte(domaine, { taille: 12, couleur: [0.82, 0.85, 0.88] })
  doc.texte(`Analyse du ${date}`, { taille: 9, couleur: [0.6, 0.65, 0.7] })
  doc.espace(46)

  if (prenom) {
    doc.texte(`Bonjour ${prenom},`, { taille: 12, police: "grasse", couleur: ENCRE })
    doc.espace(2)
    doc.texte(
      "Voici le relevé complet de votre page. Chaque point indique ce qui a été mesuré, ce que " +
        "cela peut coûter, et quoi faire. Les points que l'analyse ne peut pas trancher sont " +
        "listés à part, sans note.",
      { taille: 10, couleur: GRIS }
    )
    doc.espace(10)
  }

  /* ---- Note globale, en grand -------------------------------------------- */
  {
    const h = principal.note === null ? 62 : 74
    const fermer = doc.panneau(h, IVOIRE_CREUX, { marge: 18 })
    doc.texte("NOTE GLOBALE", { taille: 8, police: "grasse", couleur: MINERAL })
    doc.espace(4)
    if (principal.note === null) {
      doc.texte("Bilan partiel", { taille: 24, police: "grasse", couleur: MINERAL })
      doc.espace(4)
      doc.texte(
        "Une dimension majeure n'a pas pu être mesurée. Aucune note globale n'est affichée : " +
          "elle serait trompeuse.",
        { taille: 9, couleur: GRIS }
      )
    } else {
      doc.texte(`${principal.note}`, { taille: 40, police: "grasse", couleur: ton(principal.note) })
      doc.texteDroite("sur 100", { taille: 10, couleur: GRIS })
      doc.espace(2)
      doc.barre(principal.note, ton(principal.note))
      doc.espace(8)
      doc.texte(
        "Moyenne pondérée des dimensions réellement mesurées, ramenée à leur poids cumulé. " +
          "Une dimension non mesurable sort du calcul au lieu de compter zéro.",
        { taille: 8.5, couleur: GRIS }
      )
    }
    fermer()
  }

  /* ---- Les cinq dimensions ------------------------------------------------ */
  {
    const h = principal.dimensions.reduce(
      (s, d) => s + 34 + doc.mesurerHauteur(d.sens, 8.5, "normale", 420),
      0
    )
    doc.espace(16)
    const fermer = panneauTitre(doc, "Le détail par dimension", h, PAPIER)
    for (const d of principal.dimensions) {
      ligneNote(doc, `${d.libelle}   ·   ${Math.round(d.poids * 100)} %`, d.note, d.sens)
    }
    fermer()
  }

  /* ---- Analyse visuelle, par appareil ------------------------------------- */
  for (const r of [mobile, desktop].filter((x): x is RapportPage => Boolean(x))) {
    doc.nouvellePage()
    titreSection(doc, `Analyse visuelle — ${APPAREIL[r.appareil]}`)
    doc.texte(r.url, { taille: 9, couleur: MINERAL })
    doc.espace(2)
    doc.texte(
      r.note === null ? "Bilan partiel sur cette version." : `Note de cette version : ${r.note} / 100.`,
      { taille: 9.5, police: "grasse", couleur: r.note === null ? GRIS : ton(r.note) }
    )

    if (r.capture) {
      doc.espace(8)
      doc.imageJpeg(r.capture.data, r.appareil === "mobile" ? 180 : 330, r.capture.largeur / r.capture.hauteur)
      doc.texte(
        "Premier écran, tel que Google l'a affiché. Les éléments situés plus bas dans la page " +
          "ne figurent pas sur cette image.",
        { taille: 8, couleur: GRIS }
      )
    } else {
      doc.espace(8)
      doc.texte("Aucune capture n'a pu être obtenue pour cette page.", { taille: 9.5, couleur: GRIS })
    }

    const visuels = r.constats.filter((c) => c.dimension === "apparence")
    doc.espace(10)
    if (visuels.length) {
      doc.texte("Ce qui pèse sur l'apparence", { taille: 11, police: "grasse", couleur: ENCRE })
      doc.espace(2)
      visuels.forEach((c) => panneauConstat(doc, c))
    } else {
      doc.texte("Aucun défaut d'apparence relevé au-dessus du seuil sur cette version.", {
        taille: 9.5,
        couleur: GRIS,
      })
    }
  }

  /* ---- Parcours ----------------------------------------------------------- */
  doc.nouvellePage()
  titreSection(doc, "Parcours et confiance")
  const parcours = principal.constats.filter((c) => c.dimension === "parcours")
  if (parcours.length) {
    doc.texte("Ce qui gêne un visiteur — ou Google — dans sa navigation vers vous.", {
      taille: 9.5,
      couleur: GRIS,
    })
    doc.espace(4)
    parcours.forEach((c) => panneauConstat(doc, c))
  } else {
    doc.texte("Rien à signaler sur ce point pour cette page.", { taille: 9.5, couleur: GRIS })
  }

  /* ---- Technique ---------------------------------------------------------- */
  titreSection(doc, "Résultats techniques")
  const technique = principal.constats.filter(
    (c) => c.dimension === "performance" || c.dimension === "referencement" || c.dimension === "pratiques"
  )
  if (technique.length) technique.forEach((c) => panneauConstat(doc, c))
  else doc.texte("Aucun défaut technique relevé au-dessus du seuil.", { taille: 9.5, couleur: GRIS })

  if (principal.vitals.length) {
    const h = principal.vitals.reduce((s, v) => s + 16 + doc.mesurerHauteur(v.aide, 8.5, "normale", 420), 0)
    doc.espace(16)
    const fermer = panneauTitre(doc, "Ce que ressent votre visiteur", h, PAPIER)
    for (const v of principal.vitals) {
      doc.texte(v.libelle, { taille: 10, police: "grasse", couleur: ENCRE })
      doc.texteDroite(v.valeur, {
        taille: 11,
        police: "grasse",
        couleur:
          v.verdict === "bon" ? VERT : v.verdict === "moyen" ? AMBRE : v.verdict === "faible" ? TERRACOTTA : GRIS,
      })
      doc.texte(v.aide, { taille: 8.5, couleur: GRIS })
      doc.espace(4)
    }
    fermer()
  }

  /* ---- Plan d'action ------------------------------------------------------ */
  doc.nouvellePage()
  titreSection(doc, "Plan d'action")
  const rang = { haute: 0, moyenne: 1, basse: 2 } as const
  const ordonnes = [...principal.constats].sort((a, b) => rang[a.priorite] - rang[b.priorite])
  if (ordonnes.length) {
    doc.texte("Dans cet ordre : le plus rentable d'abord.", { taille: 9.5, couleur: GRIS })
    doc.espace(6)
    ordonnes.forEach((c, i) => {
      const h =
        doc.mesurerHauteur(c.recommandation, 10, "grasse", 400) +
        doc.mesurerHauteur(c.constat, 8.5, "normale", 400) +
        10
      const fermer = doc.panneau(h, i % 2 === 0 ? PAPIER : IVOIRE, { marge: 11 })
      doc.texte(`${i + 1}.  ${c.recommandation}`, { taille: 10, police: "grasse", couleur: ENCRE, largeur: 400 })
      doc.texteDroite(LIBELLE_PRIORITE[c.priorite], {
        taille: 7.5,
        police: "grasse",
        couleur: c.priorite === "haute" ? TERRACOTTA : c.priorite === "moyenne" ? AMBRE : MINERAL,
      })
      doc.espace(1)
      doc.texte(c.constat, { taille: 8.5, couleur: GRIS })
      fermer()
    })
  } else {
    doc.texte("Aucune correction prioritaire n'a été relevée sur cette page.", { taille: 10, couleur: ENCRE })
  }

  /* ---- Non vérifié --------------------------------------------------------- */
  {
    const h = principal.nonVerifies.reduce((s, p) => s + doc.mesurerHauteur(p, 9.5, "normale", 400) + 3, 26)
    doc.espace(16)
    const fermer = panneauTitre(doc, "Ce que cette analyse n'a pas vérifié", h, IVOIRE)
    doc.texte(
      "Une analyse automatique mesure ce qui est mesurable. Ces points demandent un œil humain : " +
        "ils ne sont ni notés, ni comptés dans le bilan.",
      { taille: 9, couleur: GRIS }
    )
    doc.espace(6)
    for (const p of principal.nonVerifies) {
      doc.texte(`—   ${p}`, { taille: 9.5, couleur: MINERAL })
      doc.espace(1)
    }
    fermer()
  }

  /* ---- Coordonnées --------------------------------------------------------- */
  doc.espace(16)
  {
    const fermer = doc.panneau(104, ENCRE, { marge: 18 })
    doc.imageJpeg(LOGO_PDF_JPEG, 92, LOGO_PDF_RATIO)
    doc.espace(8)
    doc.texte("Parlons de ces corrections", { taille: 14, police: "grasse", couleur: BLANC })
    doc.espace(2)
    doc.texte(
      "Je reprends votre site page par page et je vous dis quoi corriger en premier, et ce que " +
        "ça vaut. Devis clair sous 24 heures, sans engagement.",
      { taille: 9.5, couleur: [0.76, 0.79, 0.82] }
    )
    doc.espace(6)
    doc.texte(siteConfig.author.email, { taille: 10.5, police: "grasse", couleur: TERRACOTTA })
    doc.lienSurDerniereLigne(`mailto:${siteConfig.author.email}`, 190)
    doc.texte(siteConfig.url.replace(/^https?:\/\//, ""), { taille: 10, couleur: [0.76, 0.79, 0.82] })
    doc.lienSurDerniereLigne(siteConfig.url, 160)
    fermer()
  }

  doc.paginer(`Audit ${domaine} — Studio Digital Nova`)
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
