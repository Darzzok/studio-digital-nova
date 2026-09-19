/* ==========================================================================
   RAPPORT D'AUDIT AU FORMAT PDF
   ==========================================================================
   Même source que le web : le rapport produit par `lib/audit.ts`. Aucun score
   n'est recalculé, aucun constat reformulé — ce fichier met en page.

   Parti pris de cette version, après relecture page à page de la précédente :

   — PEU DE CADRES. Un encadré attire l'œil ; dix encadrés ne l'attirent nulle
     part. Il en reste trois : le verdict, la carte tarifaire, et les deux
     pages de couverture. Tout le reste est tenu par la typographie et des
     filets fins.
   — TITRES CENTRÉS. Filet court centré, titre centré dessous. La colonne de
     lecture reste alignée à gauche : centrer un paragraphe de six lignes le
     rend illisible.
   — COURT. Cinq constats détaillés au plus ; les autres tiennent dans le
     récapitulatif. Un rapport qu'on lit vaut mieux qu'un rapport exhaustif
     qu'on referme.
   — CE QUI SE COUPE PASSE APRÈS CE QUI NE SE COUPE PAS, faute de quoi la fin
     du document part sur des pages au quart remplies.

   Charte : encre #0B1726, ivoire #F7F4EE, terracotta #D96C4F, minéral #49657A.
   ========================================================================== */

import {
  PERIMETRES,
  type Constat,
  type Perimetre,
  type RapportPage,
  type Strategy,
} from "@/lib/audit"
import { suiteProposee } from "@/lib/audit-offre"
import { LOGO_PDF_JPEG, LOGO_PDF_RATIO } from "@/lib/logo-pdf"
import { DocumentPdf, MARGE_PDF, PAGE_PDF, type Couleur } from "@/lib/pdf"
import { siteConfig } from "@/lib/site"

const ENCRE: Couleur = [0.043, 0.09, 0.149]
const ENCRE_CLAIRE: Couleur = [0.098, 0.153, 0.216]
const IVOIRE: Couleur = [0.969, 0.957, 0.933]
const PAPIER: Couleur = [0.988, 0.984, 0.973]
const PAPIER_TERNE: Couleur = [0.72, 0.75, 0.78]
const BLANC: Couleur = [1, 1, 1]
const TERRACOTTA: Couleur = [0.851, 0.424, 0.31]
const MINERAL: Couleur = [0.286, 0.396, 0.478]
const GRIS: Couleur = [0.42, 0.46, 0.5]
const SABLE: Couleur = [0.886, 0.867, 0.835]
const VERT: Couleur = [0.267, 0.384, 0.314]
const AMBRE: Couleur = [0.569, 0.388, 0.141]

const ton = (note: number): Couleur => (note >= 75 ? VERT : note >= 45 ? AMBRE : TERRACOTTA)
const tonPriorite = (p: Constat["priorite"]): Couleur =>
  p === "haute" ? TERRACOTTA : p === "moyenne" ? AMBRE : MINERAL

const LIBELLE_PRIORITE = { haute: "Prioritaire", moyenne: "À corriger", basse: "À surveiller" }
const APPAREIL: Record<Strategy, string> = { mobile: "Mobile", desktop: "Ordinateur" }

/**
 * Constats détaillés par appareil. Au-delà, le rapport devient un annuaire :
 * le reste tient en une ligne dans le récapitulatif.
 */
const CONSTATS_PAR_APPAREIL = 3

export type InfosRapport = {
  url: string
  prenom: string
  perimetre: Perimetre
  mobile: RapportPage | null
  desktop: RapportPage | null
}

function domaine(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/* -------------------------------------------------------------------------- */
/* Briques                                                                     */
/* -------------------------------------------------------------------------- */

/** Titre de section, centré, précédé d'un filet court. */
function titre(doc: DocumentPdf, texte: string, reserve = 70) {
  doc.reserverBloc(reserve + 44)
  doc.espace(26)
  doc.rectangle(MARGE_PDF + doc.largeurUtile / 2 - 13, doc.position - 2, 26, 1.6, TERRACOTTA)
  doc.espace(14)
  doc.texteCentre(texte, { taille: 14, police: "grasse", couleur: ENCRE })
  doc.espace(6)
}

/** Chapeau centré sous un titre — une phrase, pas un paragraphe. */
function chapeau(doc: DocumentPdf, texte: string) {
  doc.texteCentre(texte, {
    taille: 9.5,
    couleur: GRIS,
    interligne: 14,
    largeur: doc.largeurUtile - 90,
  })
  doc.espace(6)
}

/* -------------------------------------------------------------------------- */
/* Couverture                                                                  */
/* -------------------------------------------------------------------------- */

function couverture(doc: DocumentPdf, infos: InfosRapport, base: RapportPage | null) {
  doc.rectangle(0, 0, PAGE_PDF.largeur, PAGE_PDF.hauteur, ENCRE)

  doc.espace(26)
  doc.imageJpegCentree(LOGO_PDF_JPEG, 124, LOGO_PDF_RATIO)

  doc.espace(30)
  doc.texteCentre("RAPPORT D'AUDIT", { taille: 8.5, police: "grasse", couleur: TERRACOTTA })

  doc.espace(14)
  doc.texteCentre(infos.prenom ? `Préparé pour ${infos.prenom}` : "Votre rapport d'audit", {
    taille: 26,
    police: "grasse",
    couleur: PAPIER,
    interligne: 31,
  })

  doc.espace(10)
  doc.texteCentre(domaine(infos.url), { taille: 12, couleur: PAPIER_TERNE })
  doc.espace(4)
  doc.texteCentre(PERIMETRES[infos.perimetre].resume, { taille: 9, couleur: PAPIER_TERNE })

  doc.espace(22)
  doc.anneau(base?.note ?? null, base?.note != null ? ton(base.note) : GRIS, {
    rayon: 58,
    epaisseur: 10,
    piste: ENCRE_CLAIRE,
    texte: PAPIER,
    legende:
      base?.note == null
        ? "Bilan partiel"
        : infos.mobile && infos.desktop
          ? `Note globale · ${APPAREIL[base.appareil].toLowerCase()}`
          : "Note globale",
  })

  if (base) {
    const verdict =
      base.note === null
        ? "Bilan partiel : une dimension majeure n'a pas pu être mesurée."
        : base.note >= 75
          ? "Votre site tient la route. Les points relevés sont des réglages fins."
          : base.note >= 45
            ? "Votre site fonctionne, mais plusieurs points gênent la lecture ou la navigation."
            : "Plusieurs défauts mesurés se cumulent. Ce sont les plus rentables à corriger."

    doc.espace(22)
    doc.texteCentre(verdict, {
      taille: 11.5,
      couleur: PAPIER,
      interligne: 17,
      largeur: doc.largeurUtile - 70,
    })

    const prioritaires = base.constats.filter((c) => c.priorite === "haute").length
    const appareils = [infos.mobile, infos.desktop].filter(Boolean).length
    const chiffres: [string, string][] = [
      [String(base.constats.length), base.constats.length > 1 ? "constats" : "constat"],
      [String(prioritaires), prioritaires > 1 ? "prioritaires" : "prioritaire"],
      [String(appareils), appareils > 1 ? "appareils" : "appareil"],
    ]

    doc.espace(30)
    const colonne = doc.largeurUtile / 3
    const ligne = doc.position
    chiffres.forEach(([valeur, libelle], i) => {
      const centre = MARGE_PDF + colonne * i + colonne / 2
      doc.texteAbsolu(valeur, centre - doc.largeurTexte(valeur, 21, "grasse") / 2, ligne - 6, {
        taille: 21,
        police: "grasse",
        couleur: TERRACOTTA,
      })
      const bas = libelle.toUpperCase()
      doc.texteAbsolu(bas, centre - doc.largeurTexte(bas, 7.5, "grasse") / 2, ligne - 23, {
        taille: 7.5,
        police: "grasse",
        couleur: PAPIER_TERNE,
      })
    })
    doc.espace(42)
  }

  doc.espace(16)
  doc.texteCentre(
    new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    { taille: 9, couleur: PAPIER_TERNE }
  )

  /* Les coordonnées dès la couverture : un document circule. */
  const bas = MARGE_PDF + 14
  doc.rectangle(MARGE_PDF, bas + 46, doc.largeurUtile, 1, ENCRE_CLAIRE)
  const contact = `${siteConfig.name}    ·    ${siteConfig.author.email}    ·    ${siteConfig.url.replace(/^https?:\/\//, "")}`
  doc.texteAbsolu(
    contact,
    MARGE_PDF + (doc.largeurUtile - doc.largeurTexte(contact, 9.5, "grasse")) / 2,
    bas + 26,
    { taille: 9.5, police: "grasse", couleur: PAPIER }
  )
  const sous = "Devis gratuit sous 24 heures, sans engagement"
  doc.texteAbsolu(
    sous,
    MARGE_PDF + (doc.largeurUtile - doc.largeurTexte(sous, 8.5)) / 2,
    bas + 10,
    { taille: 8.5, couleur: PAPIER_TERNE }
  )

  doc.nouvellePage()
}

/* -------------------------------------------------------------------------- */
/* La note                                                                     */
/* -------------------------------------------------------------------------- */

function laNote(doc: DocumentPdf, base: RapportPage, autre: RapportPage | null) {
  const total = base.dimensions.reduce((s, d) => s + d.poids, 0)

  titre(doc, `Votre note en ${APPAREIL[base.appareil].toLowerCase()}`, 190)
  chapeau(
    doc,
    `Pondération appliquée au périmètre demandé — ${PERIMETRES[base.perimetre].libelle.toLowerCase()}. ` +
      "Une dimension non mesurable sort du calcul au lieu de compter zéro."
  )

  doc.espace(10)
  for (const d of base.dimensions) {
    doc.ligneNote(d.libelle, d.note, d.note === null ? GRIS : ton(d.note), {
      appoint: `${Math.round((d.poids / total) * 100)} % de la note — ${d.sens}`,
      encre: ENCRE,
    })
    doc.espace(11)
  }

  /* Ce qui va bien, en une ligne : pas la peine d'une section pour ça. */
  const bons = base.dimensions.filter((d) => d.note !== null && d.note >= 90)
  if (bons.length > 0) {
    doc.espace(6)
    doc.texteCentre(
      `À conserver tel quel : ${bons.map((d) => `${d.libelle.toLowerCase()} (${d.note}/100)`).join(", ")}.`,
      { taille: 9, couleur: VERT, largeur: doc.largeurUtile - 60 }
    )
  }

  /* L'autre version en un chiffre : la comparaison vaut le détour. */
  if (autre && autre.note !== null) {
    doc.espace(8)
    doc.texteCentre(
      `Sur ${APPAREIL[autre.appareil].toLowerCase()}, la note globale est de ${autre.note}/100. Le détail de cette version suit.`,
      { taille: 9, couleur: GRIS, largeur: doc.largeurUtile - 60 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/* Votre page, telle qu'elle a été vue                                         */
/* -------------------------------------------------------------------------- */

/*
  Les repères portent le NUMÉRO DU CONSTAT auquel ils renvoient, et seuls les
  constats détaillés plus bas en reçoivent un. Numérotés dans leur propre
  ordre, ils désignaient des points que le lecteur ne retrouvait nulle part.
*/
function capture(doc: DocumentPdf, rapport: RapportPage, detailles: Constat[]) {
  if (!rapport.capture) return
  const situes = detailles
    .map((c, i) => ({ c, rang: i + 1 }))
    .filter(({ c }) => c.zone)

  /*
    La réserve se calcule sur la hauteur RÉELLE de l'image, pas sur une valeur
    au jugé : une estimation trop basse laissait le titre seul en bas d'une
    page et l'image passait à la suivante.
  */
  const ratio = rapport.capture.largeur / rapport.capture.hauteur
  const largeurVoulue = rapport.appareil === "mobile" ? 132 : 290
  /*
    La réserve se calcule sur la hauteur RÉELLE de l'image : une estimation au
    jugé laissait le titre seul en bas d'une page.
  */
  doc.reserverBloc(largeurVoulue / ratio + 46)
  doc.espace(8)
  const pose = doc.imageJpegCentree(rapport.capture.data, largeurVoulue, ratio)

  if (pose && situes.length > 0) {
    const k = pose.largeur / rapport.capture.largeur
    for (const { c, rang } of situes) {
      const z = c.zone!
      const x = pose.x + z.left * k
      const haut = pose.y + pose.hauteur - z.top * k
      const h = Math.max(6, z.height * k)
      doc.cadre(x, haut - h, Math.max(6, z.width * k), h, TERRACOTTA)
      doc.numero(rang, x, haut - h - 12, TERRACOTTA, BLANC)
    }
  }

  doc.espace(12)
  doc.texteCentre(
    situes.length > 0
      ? `Les repères portent le numéro du point correspondant, ci-dessous.`
      : "Capture réelle de votre page.",
    { taille: 8.5, couleur: GRIS }
  )
}

/* -------------------------------------------------------------------------- */
/* Les constats                                                                */
/* -------------------------------------------------------------------------- */
/*
  Sans encadré : un filet de couleur à gauche, le rang, la priorité, le titre,
  puis trois lignes étiquetées. Le bloc reste insécable — c'est la seule
  contrainte qui compte ici.
*/
function constat(doc: DocumentPdf, c: Constat, rang: number) {
  /*
    Deux colonnes : une gouttière d'étiquettes alignées à droite, et le texte.
    Mesuré — « CONSÉQUENCE » fait 46 points à 7 pt gras ; avec une gouttière de
    34 points, l'étiquette passait par-dessus la première ligne du paragraphe.
    La gouttière fait donc 56 points, et la colonne commence à 66.
  */
  const GOUTTIERE = 56
  const COLONNE = MARGE_PDF + 66
  const largeur = doc.largeurUtile - 66

  const hauteur =
    16 +
    doc.mesurerHauteur(c.constat, 12, "grasse", largeur) +
    10 +
    doc.mesurerHauteur(c.preuve, 9.5, "normale", largeur) +
    10 +
    doc.mesurerHauteur(c.consequence, 9.5, "normale", largeur) +
    10 +
    doc.mesurerHauteur(c.recommandation, 9.5, "normale", largeur) +
    20

  doc.reserverBloc(hauteur + 18)
  doc.espace(18)

  const teinte = tonPriorite(c.priorite)
  const haut = doc.position + 6

  doc.numero(rang, MARGE_PDF, haut - 13, teinte, BLANC)
  doc.texteAbsolu(
    `${LIBELLE_PRIORITE[c.priorite].toUpperCase()}  ·  ${APPAREIL[c.appareil].toUpperCase()}`,
    COLONNE,
    haut - 10,
    { taille: 7.5, police: "grasse", couleur: teinte }
  )
  doc.espace(16)

  doc.texte(c.constat, { taille: 12, police: "grasse", couleur: ENCRE, x: COLONNE, largeur })
  doc.espace(7)

  for (const [etiquette, contenu] of [
    ["Relevé", c.preuve],
    ["Conséquence", c.consequence],
    ["À faire", c.recommandation],
  ] as const) {
    doc.reserverBloc(30)
    const ligne = doc.position - 13.5
    const mot = etiquette.toUpperCase()
    doc.texteAbsolu(mot, MARGE_PDF + GOUTTIERE - doc.largeurTexte(mot, 7, "grasse"), ligne, {
      taille: 7,
      police: "grasse",
      couleur: MINERAL,
    })
    doc.texte(contenu, { taille: 9.5, couleur: ENCRE, interligne: 13.5, x: COLONNE, largeur })
    doc.espace(5)
  }

  /* Filet de rappel entre la gouttière et le texte : il relie sans enfermer. */
  doc.rectangle(MARGE_PDF + GOUTTIERE + 5, doc.position - 2, 1.4, haut - doc.position + 2, teinte)
}

/* -------------------------------------------------------------------------- */
/* Une section par appareil                                                    */
/* -------------------------------------------------------------------------- */
/*
  Ordinateur d'abord, mobile ensuite. Chaque version a sa capture et ses
  propres constats : mêler les deux obligeait le lecteur à vérifier, ligne à
  ligne, de quel écran on parlait.
*/
function sectionAppareil(doc: DocumentPdf, rapport: RapportPage, montres: number): Constat[] {
  const retenus = rapport.constats.slice(0, montres)

  titre(doc, `Sur ${APPAREIL[rapport.appareil].toLowerCase()}`, 120)
  chapeau(
    doc,
    rapport.constats.length === 0
      ? "Aucun point au-dessus du seuil sur cette version."
      : rapport.constats.length > montres
        ? `${rapport.constats.length} points relevés. Les ${montres} plus rentables sont détaillés ici.`
        : `${rapport.constats.length} ${rapport.constats.length > 1 ? "points relevés" : "point relevé"} sur cette version.`
  )

  capture(doc, rapport, retenus)
  retenus.forEach((c, i) => constat(doc, c, i + 1))
  return retenus
}

/* -------------------------------------------------------------------------- */
/* Récapitulatif                                                               */
/* -------------------------------------------------------------------------- */

function recapitulatif(doc: DocumentPdf, restants: Constat[]) {
  if (restants.length === 0) return

  titre(doc, "Tous les autres points relevés", 90)
  chapeau(doc, "Une ligne par point, du plus grave au moins grave. Le détail sur demande.")
  doc.espace(6)

  const surUneLigne = (texte: string, largeur: number) => {
    if (doc.largeurTexte(texte, 9) <= largeur) return texte
    let coupe = texte
    while (coupe.length > 4 && doc.largeurTexte(`${coupe}…`, 9) > largeur) coupe = coupe.slice(0, -1)
    return `${coupe.trimEnd()}…`
  }

  const INTERLIGNE = 13.5
  restants.forEach((c, i) => {
    doc.reserverBloc(22)
    const teinte = tonPriorite(c.priorite)
    /* La bande vise la ligne À VENIR : `texte` descend avant d'écrire. */
    const ligne = doc.position - INTERLIGNE
    if (i % 2 === 0) doc.rectangle(MARGE_PDF, ligne - 5, doc.largeurUtile, 18, IVOIRE)
    doc.rectangle(MARGE_PDF, ligne - 5, 2, 18, teinte)

    const etiquette = `${LIBELLE_PRIORITE[c.priorite]} · ${APPAREIL[c.appareil]}`
    const reserve = doc.largeurTexte(etiquette, 8, "grasse") + 24
    doc.texte(surUneLigne(c.constat, doc.largeurUtile - 12 - reserve), {
      taille: 9,
      couleur: ENCRE,
      interligne: INTERLIGNE,
      x: MARGE_PDF + 12,
      largeur: doc.largeurUtile,
    })
    doc.texteDroite(etiquette, { taille: 8, police: "grasse", couleur: teinte })
    doc.espace(5)
  })
}

/* -------------------------------------------------------------------------- */
/* Ce que l'analyse ne dit pas                                                 */
/* -------------------------------------------------------------------------- */

function limites(doc: DocumentPdf, base: RapportPage) {
  if (base.nonVerifies.length === 0) return
  titre(doc, "Ce que cette analyse ne dit pas", 80)
  chapeau(doc, "Une mesure automatique ne juge pas de tout. Ces points demandent un regard humain.")
  doc.espace(4)
  for (const point of base.nonVerifies.slice(0, 4)) {
    doc.reserverBloc(20)
    const lignes = doc.mesurerHauteur(point, 9, "normale", doc.largeurUtile - 24) / 13
    doc.rectangle(MARGE_PDF, doc.position - 13 * lignes - 1, 1.6, 13 * lignes, SABLE)
    doc.texte(point, {
      taille: 9,
      couleur: GRIS,
      interligne: 13,
      x: MARGE_PDF + 12,
      largeur: doc.largeurUtile - 24,
    })
    doc.espace(4)
  }
  doc.espace(8)
  doc.texteCentre(
    "Mesures relevées par l'API Google PageSpeed Insights, en laboratoire, sur une connexion simulée.",
    { taille: 8, couleur: GRIS, largeur: doc.largeurUtile - 60 }
  )
}

/* -------------------------------------------------------------------------- */
/* Quatrième de couverture : la proposition                                    */
/* -------------------------------------------------------------------------- */
/*
  La page qui doit vendre. Elle est composée, pas coulée : on mesure l'ensemble
  puis on le centre, pour qu'aucun blanc ne traîne sous le pavé de contact.
*/
function proposition(
  doc: DocumentPdf,
  base: RapportPage | null,
  perimetre: Perimetre,
  prenom: string
) {
  const suite = suiteProposee(base, perimetre)
  doc.nouvellePage()
  doc.rectangle(0, 0, PAGE_PDF.largeur, PAGE_PDF.hauteur, ENCRE)

  const largeurPhrase = doc.largeurUtile - 60
  const hauteurCarte = suite.formule ? 94 + suite.formule.inclus.length * 15 : 0
  const hauteurPrestations = suite.prestations.reduce(
    (t, pr) => t + 30 + doc.mesurerHauteur(pr.ligne, 9, "normale", doc.largeurUtile - 40),
    0
  )
  const hauteurTotale =
    40 +
    doc.mesurerHauteur(suite.titre, 20, "grasse", largeurPhrase) +
    14 +
    doc.mesurerHauteur(suite.phrase, 11, "normale", largeurPhrase) +
    (hauteurCarte ? hauteurCarte + 24 : 0) +
    (hauteurPrestations ? hauteurPrestations + 20 : 0) +
    doc.mesurerHauteur(suite.reperePrix, 8.5, "normale", largeurPhrase) +
    108

  doc.placer(Math.min(PAGE_PDF.hauteur - MARGE_PDF, PAGE_PDF.hauteur / 2 + hauteurTotale / 2))

  doc.texteCentre("LA SUITE", { taille: 8.5, police: "grasse", couleur: TERRACOTTA })
  doc.espace(12)
  doc.texteCentre(suite.titre, {
    taille: 20,
    police: "grasse",
    couleur: PAPIER,
    interligne: 25,
    largeur: largeurPhrase,
  })
  doc.espace(10)
  doc.texteCentre(suite.phrase, {
    taille: 11,
    couleur: PAPIER_TERNE,
    interligne: 16,
    largeur: largeurPhrase,
  })

  /*
    La carte tarifaire. Coins arrondis, bandeau d'en-tête terracotta, prix en
    grand, coches tracées au trait : c'est la seule chose de cette page qui
    doit arrêter l'œil, elle a donc droit au seul décor du document.
  */
  if (suite.formule) {
    const f = suite.formule
    doc.espace(26)
    const BANDEAU = 26
    const hauteur = BANDEAU + 52 + f.inclus.length * 15 + 16
    const largeurCarte = doc.largeurUtile - 76
    const x = MARGE_PDF + 38
    const haut = doc.position
    const bas = haut - hauteur

    doc.rectangleArrondi(x, bas, largeurCarte, hauteur, 7, PAPIER)
    doc.rectangleArrondi(x, haut - BANDEAU, largeurCarte, BANDEAU, 7, TERRACOTTA, {
      bg: false,
      bd: false,
    })

    const centre = MARGE_PDF + doc.largeurUtile / 2
    doc.texteAbsolu(
      f.nom.toUpperCase(),
      centre - doc.largeurTexte(f.nom.toUpperCase(), 8.5, "grasse") / 2,
      haut - 17,
      { taille: 8.5, police: "grasse", couleur: PAPIER }
    )
    doc.texteAbsolu(f.prix, centre - doc.largeurTexte(f.prix, 27, "grasse") / 2, haut - BANDEAU - 34, {
      taille: 27,
      police: "grasse",
      couleur: ENCRE,
    })
    doc.texteAbsolu(
      "tout compris, annoncé d'avance",
      centre - doc.largeurTexte("tout compris, annoncé d'avance", 8) / 2,
      haut - BANDEAU - 48,
      { taille: 8, couleur: GRIS }
    )

    /* Liste alignée sur un même bord gauche, l'ensemble centré dans la carte. */
    const largeurListe = Math.max(...f.inclus.map((l) => doc.largeurTexte(l, 9))) + 16
    const gaucheListe = centre - largeurListe / 2
    f.inclus.forEach((l, i) => {
      const y = haut - BANDEAU - 66 - i * 15
      doc.coche(gaucheListe, y, 7, TERRACOTTA)
      doc.texteAbsolu(l, gaucheListe + 16, y, { taille: 9, couleur: ENCRE })
    })

    doc.placer(bas - 12)
    doc.texteCentre(`${siteConfig.url.replace(/^https?:\/\//, "")}${f.lien}`, {
      taille: 8,
      couleur: PAPIER_TERNE,
    })
    doc.lienSurDerniereLigne(`${siteConfig.url}${f.lien}`, doc.largeurUtile)
  }

  /* Les prestations, sans cadre : un filet, un nom, une ligne. */
  if (suite.prestations.length > 0) {
    doc.espace(18)
    for (const pr of suite.prestations) {
      doc.espace(6)
      doc.texteCentre(pr.nom, { taille: 11, police: "grasse", couleur: PAPIER })
      doc.texteCentre(pr.ligne, {
        taille: 9,
        couleur: PAPIER_TERNE,
        interligne: 13,
        largeur: doc.largeurUtile - 60,
      })
    }
  }

  doc.espace(20)
  doc.texteCentre(suite.reperePrix, {
    taille: 8.5,
    couleur: PAPIER_TERNE,
    interligne: 12.5,
    largeur: largeurPhrase,
  })

  doc.espace(26)
  doc.rectangle(MARGE_PDF + doc.largeurUtile / 2 - 40, doc.position, 80, 1, ENCRE_CLAIRE)
  doc.espace(22)
  doc.texteCentre(
    prenom ? `${prenom}, parlons-en quand vous voulez.` : "Parlons-en quand vous voulez.",
    { taille: 14, police: "grasse", couleur: PAPIER }
  )
  doc.espace(10)
  doc.texteCentre(siteConfig.author.email, { taille: 13, police: "grasse", couleur: TERRACOTTA })
  doc.lienSurDerniereLigne(`mailto:${siteConfig.author.email}`, doc.largeurUtile)
  doc.espace(8)
  doc.texteCentre(siteConfig.url.replace(/^https?:\/\//, ""), { taille: 9.5, couleur: PAPIER_TERNE })
  doc.lienSurDerniereLigne(siteConfig.url, doc.largeurUtile)
}

/* -------------------------------------------------------------------------- */
/* Assemblage                                                                  */
/* -------------------------------------------------------------------------- */

export function construireRapport(infos: InfosRapport): Blob {
  const { url, prenom, perimetre, mobile, desktop } = infos
  /*
    L'ordinateur passe devant : c'est la version mise en avant, et sa note est
    celle qui figure en couverture. Le mobile suit, avec sa propre capture et
    ses propres constats.
  */
  const base = desktop ?? mobile
  const secondaire = desktop ? mobile : null
  const doc = new DocumentPdf()

  couverture(doc, infos, base)

  if (base) {
    laNote(doc, base, secondaire)

    /*
      Ordinateur d'abord, mobile ensuite : c'est l'ordre demandé, et il
      correspond à l'ordre de lecture d'un chef d'entreprise qui ouvre le
      rapport sur son écran.
    */
    const detailles = new Set<Constat>()
    for (const r of [base, secondaire].filter((r): r is RapportPage => Boolean(r))) {
      for (const c of sectionAppareil(doc, r, CONSTATS_PAR_APPAREIL)) detailles.add(c)
    }

    /* Ce qui n'a pas été détaillé, toutes versions confondues, du plus grave au moins. */
    const rang = { haute: 0, moyenne: 1, basse: 2 } as const
    const restants = [base, secondaire]
      .filter((r): r is RapportPage => Boolean(r))
      .flatMap((r) => r.constats)
      .filter((c) => !detailles.has(c))
      .sort((a, b) => rang[a.priorite] - rang[b.priorite])

    recapitulatif(doc, restants)
    limites(doc, base)
  }

  proposition(doc, base, perimetre, prenom)

  doc.pieds(
    `${siteConfig.name}  ·  ${siteConfig.author.email}  ·  audit de ${domaine(url)}`,
    [1, doc.numeroPage]
  )
  return new Blob([doc.versOctets() as unknown as BlobPart], { type: "application/pdf" })
}

/*
  Nom de fichier nominatif : la personne le retrouve dans son dossier de
  téléchargements par son propre prénom, pas par un domaine.
*/
export function telechargerRapport(blob: Blob, url: string, prenom = "") {
  const morceau = (prenom || domaine(url))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
  const nom = `audit-${morceau.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`
  const lien = document.createElement("a")
  lien.href = URL.createObjectURL(blob)
  lien.download = nom
  document.body.appendChild(lien)
  lien.click()
  document.body.removeChild(lien)
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000)
}
