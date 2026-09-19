/* ==========================================================================
   RAPPORT D'AUDIT AU FORMAT PDF
   ==========================================================================
   Met en page le rapport complet. Aucune donnée n'est recalculée ici : tout
   vient tel quel du moteur (`lib/audit.ts`). Ce fichier ne fait que mettre en
   forme ce qui a déjà été mesuré.
   ========================================================================== */

import { BAREME, CATEGORY_MEANING, type AuditReport } from "@/lib/audit"
import { DocumentPdf, MARGE_PDF, PAGE_PDF, type Couleur } from "@/lib/pdf"
import { siteConfig } from "@/lib/site"

const ENCRE: Couleur = [0.043, 0.09, 0.149]
const GRIS: Couleur = [0.42, 0.46, 0.5]
const TERRACOTTA: Couleur = [0.851, 0.424, 0.31]
const MINERAL: Couleur = [0.286, 0.396, 0.478]
const VERT: Couleur = [0.267, 0.384, 0.314]
const AMBRE: Couleur = [0.569, 0.388, 0.141]

function tonNote(note: number): Couleur {
  if (note >= 75) return VERT
  if (note >= 45) return AMBRE
  return TERRACOTTA
}

const LIBELLE_SEVERITE: Record<string, string> = {
  critique: "Critique",
  important: "Important",
  mineur: "À surveiller",
}

export type InfosRapport = {
  url: string
  prenom: string
  mobile: AuditReport | null
  desktop: AuditReport | null
}

/** Construit le PDF complet et le renvoie sous forme de Blob. */
export function construireRapport({ url, prenom, mobile, desktop }: InfosRapport): Blob {
  const doc = new DocumentPdf()
  const principal = mobile ?? desktop
  if (!principal) throw new Error("Aucun rapport à mettre en page.")

  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  /* ---- Bandeau ------------------------------------------------------------ */
  doc.rectangle(0, PAGE_PDF.hauteur - 168, PAGE_PDF.largeur, 168, ENCRE)
  doc.espace(22)
  doc.texte("STUDIO DIGITAL NOVA", { taille: 8, police: "grasse", couleur: [1, 1, 1] })
  doc.texte("Audit de votre site", { taille: 24, police: "grasse", couleur: [1, 1, 1] })
  doc.texte(url, { taille: 10, couleur: [0.75, 0.78, 0.81] })
  doc.texte(`Analyse du ${date}`, { taille: 9, couleur: [0.62, 0.66, 0.7] })
  doc.espace(42)

  if (prenom) {
    doc.texte(`Bonjour ${prenom},`, { taille: 11, police: "grasse", couleur: ENCRE })
    doc.texte(
      "Voici le relevé complet de ce que j'ai mesuré sur votre page. Chaque point est classé " +
        "par ordre de gravité, avec sa conséquence concrète pour vos visiteurs.",
      { taille: 10, couleur: GRIS }
    )
    doc.espace(14)
  }

  /* ---- Note globale ------------------------------------------------------- */
  doc.texte("NOTE GLOBALE", { taille: 8, police: "grasse", couleur: GRIS })
  doc.espace(4)
  doc.texte(`${principal.overall} / 100`, {
    taille: 34,
    police: "grasse",
    couleur: tonNote(principal.overall),
  })
  doc.espace(6)
  doc.barre(principal.overall, tonNote(principal.overall))
  doc.espace(12)
  doc.texte(
    `Mesure brute pondérée : ${principal.overallRaw} / 100. La note ci-dessus applique ensuite ` +
      "le barème d'exigence détaillé en fin de rapport. Elle est plus sévère que celle de Google, " +
      "volontairement : Google note la conformité technique, moi je note un site livrable.",
    { taille: 9, couleur: GRIS }
  )
  doc.espace(8)
  doc.filet()

  /* ---- Dimensions --------------------------------------------------------- */
  doc.espace(10)
  doc.texte("LE DÉTAIL PAR DIMENSION", { taille: 8, police: "grasse", couleur: GRIS })
  doc.espace(6)

  const dimensions: { label: string; note: number | null; sens: string }[] = [
    {
      label: "Confort visuel",
      note: principal.visual.score,
      sens: "Lisibilité, stabilité de la mise en page, netteté des images, confort au doigt.",
    },
    ...principal.categories.map((c) => ({
      label: CATEGORY_MEANING[c.id]?.label ?? c.label,
      note: c.score,
      sens: CATEGORY_MEANING[c.id]?.meaning ?? "",
    })),
  ]

  for (const dimension of dimensions) {
    doc.espace(6)
    doc.texte(dimension.label, { taille: 11, police: "grasse", couleur: ENCRE })
    doc.texteDroite(dimension.note === null ? "non mesuré" : `${dimension.note} / 100`, {
      taille: 11,
      police: "grasse",
      couleur: dimension.note === null ? GRIS : tonNote(dimension.note),
    })
    if (dimension.note !== null) doc.barre(dimension.note, tonNote(dimension.note))
    if (dimension.sens) doc.texte(dimension.sens, { taille: 9, couleur: GRIS })
  }

  /* ---- Confort visuel, signal par signal ---------------------------------- */
  if (principal.visual.signals.length) {
    doc.nouvellePage()
    doc.texte("CE QUI PÈSE SUR LE CONFORT VISUEL", { taille: 8, police: "grasse", couleur: GRIS })
    doc.espace(4)
    doc.texte(
      "Classé du plus dégradé au moins dégradé. C'est la dimension qui pèse le plus lourd " +
        "dans la note : un visiteur juge ce qu'il voit avant de lire quoi que ce soit.",
      { taille: 9, couleur: GRIS }
    )
    doc.espace(8)
    for (const signal of principal.visual.signals) {
      const note = Math.round(signal.score * 100)
      doc.espace(6)
      doc.texte(signal.label, { taille: 10, police: "grasse", couleur: ENCRE, largeur: doc.largeurUtile - 70 })
      doc.texteDroite(`${note} / 100`, { taille: 10, police: "grasse", couleur: tonNote(note) })
      doc.texte(signal.detail, { taille: 9, couleur: GRIS })
    }
  }

  /* ---- Ressenti ----------------------------------------------------------- */
  if (principal.vitals.length) {
    doc.espace(16)
    doc.filet()
    doc.espace(10)
    doc.texte("CE QUE RESSENT VOTRE VISITEUR", { taille: 8, police: "grasse", couleur: GRIS })
    doc.espace(6)
    for (const vital of principal.vitals) {
      doc.texte(vital.label, { taille: 10, police: "grasse", couleur: ENCRE })
      doc.texteDroite(vital.value, {
        taille: 10,
        police: "grasse",
        couleur:
          vital.verdict === "good" ? VERT : vital.verdict === "average" ? AMBRE : TERRACOTTA,
      })
      doc.texte(vital.hint, { taille: 9, couleur: GRIS })
      doc.espace(4)
    }
  }

  /* ---- Problèmes ---------------------------------------------------------- */
  doc.nouvellePage()
  doc.texte("CE QU'IL FAUT CORRIGER", { taille: 8, police: "grasse", couleur: GRIS })
  doc.espace(4)

  if (principal.issues.length === 0) {
    doc.texte(
      "Aucun défaut majeur détecté sur cette page parmi les points que je contrôle. " +
        "C'est rare, et bon signe.",
      { taille: 10, couleur: ENCRE }
    )
  } else {
    doc.texte(
      `${principal.issues.length} point${principal.issues.length > 1 ? "s" : ""} relevé` +
        `${principal.issues.length > 1 ? "s" : ""}, du plus grave au moins grave.`,
      { taille: 9, couleur: GRIS }
    )
    doc.espace(8)
    principal.issues.forEach((issue, index) => {
      const ton =
        issue.severity === "critique" ? TERRACOTTA : issue.severity === "important" ? AMBRE : MINERAL
      doc.espace(8)
      doc.texte(`${String(index + 1).padStart(2, "0")}  ${issue.title}`, {
        taille: 11,
        police: "grasse",
        couleur: ENCRE,
        largeur: doc.largeurUtile - 80,
      })
      doc.texteDroite(LIBELLE_SEVERITE[issue.severity] ?? issue.severity, {
        taille: 8,
        police: "grasse",
        couleur: ton,
      })
      doc.texte(issue.impact, { taille: 9.5, couleur: GRIS })
    })
  }

  /* ---- Comparaison mobile / ordinateur ------------------------------------ */
  if (mobile && desktop) {
    doc.espace(16)
    doc.filet()
    doc.espace(10)
    doc.texte("MOBILE ET ORDINATEUR", { taille: 8, police: "grasse", couleur: GRIS })
    doc.espace(6)
    doc.texte("Sur téléphone", { taille: 10, police: "grasse", couleur: ENCRE })
    doc.texteDroite(`${mobile.overall} / 100`, {
      taille: 10,
      police: "grasse",
      couleur: tonNote(mobile.overall),
    })
    doc.texte("Sur ordinateur", { taille: 10, police: "grasse", couleur: ENCRE })
    doc.texteDroite(`${desktop.overall} / 100`, {
      taille: 10,
      police: "grasse",
      couleur: tonNote(desktop.overall),
    })
    doc.espace(4)
    doc.texte(
      "La note retenue est celle du mobile : c'est là que se joue la majorité des visites, " +
        "et c'est la version la plus exigeante à tenir.",
      { taille: 9, couleur: GRIS }
    )
  }

  /* ---- Barème ------------------------------------------------------------- */
  doc.nouvellePage()
  doc.texte("COMMENT CETTE NOTE EST CALCULÉE", { taille: 8, police: "grasse", couleur: GRIS })
  doc.espace(6)
  doc.texte(
    "Rien n'est inventé et rien n'est arrondi en votre défaveur. La mesure vient de l'API " +
      "Google PageSpeed Insights, la même que celle de pagespeed.web.dev : vous pouvez recouper " +
      "à tout moment.",
    { taille: 10, couleur: ENCRE }
  )
  doc.espace(8)
  doc.texte("1. Pondération des dimensions", { taille: 10, police: "grasse", couleur: ENCRE })
  doc.texte(
    "Confort visuel 50 %, vitesse 25 %, référencement 15 %, bonnes pratiques 10 %. " +
      "Le visuel domine parce que c'est ce qui décide un visiteur avant toute lecture.",
    { taille: 9.5, couleur: GRIS }
  )
  doc.espace(8)
  doc.texte("2. Barème d'exigence", { taille: 10, police: "grasse", couleur: ENCRE })
  doc.texte(
    "La courbe de Google est indulgente : un site tout juste correct y décroche facilement 70. " +
      "J'applique ensuite le barème ci-dessous, celui que j'exige d'un site que je livre.",
    { taille: 9.5, couleur: GRIS }
  )
  doc.espace(8)

  const colonne = doc.largeurUtile / 2
  doc.texte("Mesure brute", { taille: 9, police: "grasse", couleur: GRIS })
  doc.texteDroite("Note retenue", { taille: 9, police: "grasse", couleur: GRIS })
  doc.filet()
  for (const palier of [...BAREME].reverse()) {
    doc.espace(2)
    doc.texte(`${palier.brut} / 100`, { taille: 10, couleur: ENCRE, largeur: colonne })
    doc.texteDroite(`${palier.note} / 100`, { taille: 10, police: "grasse", couleur: ENCRE })
  }
  doc.espace(10)
  doc.texte(
    "Entre deux paliers, la note est interpolée. La fonction est croissante : un meilleur site " +
      "obtient toujours une meilleure note.",
    { taille: 9, couleur: GRIS }
  )

  /* ---- Périmètre et contact ----------------------------------------------- */
  doc.espace(16)
  doc.filet()
  doc.espace(10)
  doc.texte("CE QUE CE RAPPORT NE COUVRE PAS", { taille: 8, police: "grasse", couleur: GRIS })
  doc.espace(4)
  doc.texte(
    "Cette analyse porte sur une seule page, mesurée automatiquement. Elle ne juge ni votre " +
      "contenu, ni votre positionnement, ni la structure de votre site, ni vos concurrents. " +
      "Un audit complet couvre tout cela — et c'est là que se trouvent souvent les vraies " +
      "occasions manquées.",
    { taille: 9.5, couleur: GRIS }
  )
  doc.espace(14)
  doc.texte("Parlons-en", { taille: 13, police: "grasse", couleur: ENCRE })
  doc.texte(
    "Je reprends votre site page par page et je vous dis quoi corriger en premier, " +
      "et ce que ça vaut. Réponse sous 24 heures, sans engagement.",
    { taille: 9.5, couleur: GRIS }
  )
  doc.espace(4)
  doc.texte(siteConfig.author.email, {
    taille: 10,
    police: "grasse",
    couleur: TERRACOTTA,
  })
  doc.texte(siteConfig.url, { taille: 9.5, couleur: MINERAL })

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
  // Le révoquer tout de suite annulerait le téléchargement dans Safari.
  setTimeout(() => URL.revokeObjectURL(lien.href), 30_000)
}

export { MARGE_PDF }
