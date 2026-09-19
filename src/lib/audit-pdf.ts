/* ==========================================================================
   RAPPORT D'AUDIT AU FORMAT PDF
   ==========================================================================
   Même source que le web : le rapport produit par `lib/audit.ts`. Aucun score
   n'est recalculé, aucun constat reformulé — ce fichier met en page.

   Vrai document : texte sélectionnable, logo et captures intégrés, adresses
   cliquables, pages numérotées, blocs insécables. Ce n'est pas une capture de
   la page web exportée.

   Trois principes de mise en page, appris des versions précédentes :
   — tout bloc composite est réservé d'un seul tenant, donc rien ne se coupe
     ni ne se superpose entre deux pages ;
   — un titre vit à l'intérieur de son panneau, jamais posé au-dessus, faute
     de pouvoir mesurer exactement ce qui suit ;
   — on ne force une nouvelle page que pour la couverture. Le reste coule, ce
     qui supprime les demi-pages blanches.

   La charte est reprise telle quelle : encre #0B1726, ivoire #F7F4EE,
   terracotta #D96C4F, bleu minéral #49657A.
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

/* Charte, convertie une fois pour toutes en composantes 0-1. */
const ENCRE: Couleur = [0.043, 0.09, 0.149]
const ENCRE_CLAIRE: Couleur = [0.098, 0.153, 0.216]
const IVOIRE: Couleur = [0.969, 0.957, 0.933]
const PAPIER: Couleur = [0.988, 0.984, 0.973]
const PAPIER_TERNE: Couleur = [0.72, 0.75, 0.78]
const BLANC: Couleur = [1, 1, 1]
const TERRACOTTA: Couleur = [0.851, 0.424, 0.31]
const TERRACOTTA_PALE: Couleur = [0.976, 0.941, 0.925]
const MINERAL: Couleur = [0.286, 0.396, 0.478]
const GRIS: Couleur = [0.42, 0.46, 0.5]
const VERT: Couleur = [0.267, 0.384, 0.314]
const VERT_PALE: Couleur = [0.925, 0.945, 0.929]
const AMBRE: Couleur = [0.569, 0.388, 0.141]
const AMBRE_PALE: Couleur = [0.976, 0.953, 0.906]
const SABLE: Couleur = [0.902, 0.875, 0.824]

const ton = (note: number): Couleur => (note >= 75 ? VERT : note >= 45 ? AMBRE : TERRACOTTA)
const tonPale = (note: number): Couleur =>
  note >= 75 ? VERT_PALE : note >= 45 ? AMBRE_PALE : TERRACOTTA_PALE

const LIBELLE_PRIORITE = { haute: "Prioritaire", moyenne: "À corriger", basse: "À surveiller" }
const LIBELLE_NATURE = { mesure: "Mesuré", appreciation: "Apprécié", non_verifie: "Non vérifié" }
const APPAREIL: Record<Strategy, string> = { mobile: "Mobile", desktop: "Ordinateur" }

export type InfosRapport = {
  url: string
  prenom: string
  perimetre: Perimetre
  mobile: RapportPage | null
  desktop: RapportPage | null
}

/** Domaine seul : un titre de document se lit mieux sans le protocole. */
function domaine(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/* -------------------------------------------------------------------------- */
/* Briques de mise en page                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Titre de section : filet terracotta, surtitre, puis un peu d'air.
 * `hauteurSuivante` réserve la place du premier bloc qui suit, pour qu'un
 * titre ne reste jamais seul en bas de page.
 */
function titreSection(doc: DocumentPdf, texte: string, hauteurSuivante = 80) {
  doc.reserverBloc(hauteurSuivante + 40)
  doc.espace(20)
  doc.rectangle(MARGE_PDF, doc.position - 2, 26, 2, TERRACOTTA)
  doc.espace(12)
  doc.texte(texte.toUpperCase(), { taille: 8.5, police: "grasse", couleur: MINERAL })
  doc.espace(6)
}

/* -------------------------------------------------------------------------- */
/* Couverture                                                                  */
/* -------------------------------------------------------------------------- */
/*
  Page pleine encre, tout centré. Le prénom passe avant l'adresse du site :
  c'est un document remis à quelqu'un, pas la fiche technique d'un domaine.
*/
function couverture(doc: DocumentPdf, infos: InfosRapport, base: RapportPage | null) {
  doc.rectangle(0, 0, PAGE_PDF.largeur, PAGE_PDF.hauteur, ENCRE)

  doc.espace(22)
  doc.imageJpegCentree(LOGO_PDF_JPEG, 124, LOGO_PDF_RATIO)

  doc.espace(26)
  doc.texteCentre("RAPPORT D'AUDIT", { taille: 8.5, police: "grasse", couleur: TERRACOTTA })

  doc.espace(12)
  doc.texteCentre(
    infos.prenom ? `Préparé pour ${infos.prenom}` : "Votre rapport d'audit",
    { taille: 25, police: "grasse", couleur: PAPIER, interligne: 30 }
  )

  doc.espace(8)
  doc.texteCentre(domaine(infos.url), { taille: 12, couleur: PAPIER_TERNE })

  doc.espace(4)
  doc.texteCentre(
    `${PERIMETRES[infos.perimetre].libelle} — ${PERIMETRES[infos.perimetre].resume}`,
    { taille: 9, couleur: PAPIER_TERNE }
  )

  /* La note, en grand. C'est ce qu'on regarde en premier. */
  doc.espace(18)
  doc.anneau(base?.note ?? null, base?.note != null ? ton(base.note) : GRIS, {
    rayon: 58,
    epaisseur: 10,
    piste: ENCRE_CLAIRE,
    texte: PAPIER,
    legende: base?.note == null ? "Bilan partiel" : "Note globale",
  })

  /*
    Le verdict et les chiffres clés tiennent la moitié basse de la couverture.
    Sans eux, la page se vidait entre l'anneau et le pavé de contact : un grand
    blanc au milieu d'un document censé donner envie de lire la suite.
  */
  if (base) {
    const verdict =
      base.note === null
        ? "Bilan partiel : une dimension majeure n'a pas pu être mesurée."
        : base.note >= 75
          ? "Votre site tient la route. Les points relevés sont des réglages fins."
          : base.note >= 45
            ? "Votre site fonctionne, mais plusieurs points gênent la lecture ou la navigation."
            : "Plusieurs défauts mesurés se cumulent. Ce sont les plus rentables à corriger."

    doc.espace(20)
    doc.texteCentre(verdict, {
      taille: 11,
      couleur: PAPIER,
      interligne: 16,
      largeur: doc.largeurUtile - 80,
    })

    const prioritaires = base.constats.filter((c) => c.priorite === "haute").length
    const appareils = [infos.mobile, infos.desktop].filter(Boolean).length
    const chiffres: [string, string][] = [
      [String(base.constats.length), base.constats.length > 1 ? "constats" : "constat"],
      [String(prioritaires), prioritaires > 1 ? "prioritaires" : "prioritaire"],
      [appareils === 2 ? "2" : "1", appareils === 2 ? "appareils" : "appareil"],
    ]

    doc.espace(26)
    const colonne = doc.largeurUtile / 3
    const ligne = doc.position
    chiffres.forEach(([valeur, libelle], i) => {
      const centre = MARGE_PDF + colonne * i + colonne / 2
      doc.texteAbsolu(valeur, centre - doc.largeurTexte(valeur, 20, "grasse") / 2, ligne - 6, {
        taille: 20,
        police: "grasse",
        couleur: TERRACOTTA,
      })
      const bas = libelle.toUpperCase()
      doc.texteAbsolu(bas, centre - doc.largeurTexte(bas, 7.5, "grasse") / 2, ligne - 22, {
        taille: 7.5,
        police: "grasse",
        couleur: PAPIER_TERNE,
      })
    })
    doc.espace(40)
  }

  doc.espace(14)
  doc.texteCentre(
    new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    { taille: 9, couleur: PAPIER_TERNE }
  )

  /*
    Les coordonnées dès la couverture, et non reléguées en dernière page : le
    document circule, il doit dire tout de suite à qui répondre. Le pied
    numéroté est retiré de cette page — il venait se poser par-dessus.
  */
  const basPave = MARGE_PDF + 14
  doc.rectangle(MARGE_PDF, basPave + 46, PAGE_PDF.largeur - MARGE_PDF * 2, 1, ENCRE_CLAIRE)
  const largeurUtile = PAGE_PDF.largeur - MARGE_PDF * 2
  const ligneContact = `${siteConfig.name}    ·    ${siteConfig.author.email}    ·    ${siteConfig.url.replace(/^https?:\/\//, "")}`
  doc.texteAbsolu(
    ligneContact,
    MARGE_PDF + (largeurUtile - doc.largeurTexte(ligneContact, 9.5, "grasse")) / 2,
    basPave + 26,
    { taille: 9.5, police: "grasse", couleur: PAPIER }
  )
  const sous = "Devis gratuit sous 24 heures, sans engagement"
  doc.texteAbsolu(
    sous,
    MARGE_PDF + (largeurUtile - doc.largeurTexte(sous, 8.5)) / 2,
    basPave + 10,
    { taille: 8.5, couleur: PAPIER_TERNE }
  )

  doc.nouvellePage()
}

/* -------------------------------------------------------------------------- */
/* Résumé                                                                      */
/* -------------------------------------------------------------------------- */
/*
  Une page pour comprendre sans lire le détail : le verdict en une phrase, les
  notes en barres, et les trois points à retenir.
*/
function resume(doc: DocumentPdf, base: RapportPage, prenom: string) {
  const verdict =
    base.note === null
      ? "L'analyse est partielle : une dimension majeure n'a pas pu être mesurée sur cette page. Les constats ci-dessous restent valables."
      : base.note >= 75
        ? "Votre site tient la route. Les points relevés sont des réglages fins, pas des corrections urgentes."
        : base.note >= 45
          ? "Votre site fonctionne, mais plusieurs points mesurés gênent la lecture ou la navigation."
          : "Plusieurs défauts mesurés se cumulent sur cette page. Ce sont les plus rentables à corriger en premier."

  titreSection(doc, "En un coup d'œil", 150)

  const hauteurVerdict = doc.mesurerHauteur(verdict, 11.5, "normale", doc.largeurUtile - 32)
  const fermer = doc.panneau(hauteurVerdict + 4, IVOIRE, { filetGauche: TERRACOTTA })
  doc.texte(verdict, { taille: 11.5, couleur: ENCRE, interligne: 16 })
  fermer()

  /* Les notes, en barres : on voit d'un regard où ça coince. */
  doc.espace(14)
  const total = base.dimensions.reduce((s, d) => s + d.poids, 0)
  for (const d of base.dimensions) {
    doc.ligneNote(d.libelle, d.note, d.note === null ? GRIS : ton(d.note), {
      appoint: `${Math.round((d.poids / total) * 100)} % de la note — ${d.sens}`,
      encre: ENCRE,
    })
    doc.espace(10)
  }

  /* Les trois priorités, résumées à une ligne chacune. */
  const priorites = base.constats.filter((c) => c.priorite === "haute").slice(0, 3)
  if (priorites.length > 0) {
    titreSection(doc, priorites.length === 1 ? "Le point à traiter" : "Les points à traiter", 80)
    priorites.forEach((c, i) => {
      const hauteur = doc.mesurerHauteur(c.constat, 10.5, "grasse", doc.largeurUtile - 60) + 16
      const fin = doc.panneau(hauteur, PAPIER, { marge: 12 })
      /*
        `texte` descend d'un interligne avant d'écrire : le numéro doit viser
        cette ligne-là, sinon il flotte au-dessus du titre.
      */
      doc.numero(i + 1, MARGE_PDF + 12, doc.position - 10.5 * 1.45 - 2.5, TERRACOTTA, BLANC)
      doc.texte(c.constat, { taille: 10.5, police: "grasse", couleur: ENCRE, x: MARGE_PDF + 32 })
      doc.texte(c.preuve, { taille: 9, couleur: GRIS, x: MARGE_PDF + 32 })
      fin()
      doc.espace(4)
    })
  }

  if (prenom) {
    doc.espace(12)
    doc.texte(
      `${prenom}, le détail de chaque point suit, avec ce qu'il faut corriger.`,
      { taille: 9.5, couleur: MINERAL }
    )
  }
}

/* -------------------------------------------------------------------------- */
/* Capture annotée                                                             */
/* -------------------------------------------------------------------------- */

function capture(doc: DocumentPdf, rapport: RapportPage) {
  if (!rapport.capture) return
  const situes = rapport.constats.filter((c) => c.zone)

  titreSection(doc, `Votre page en ${APPAREIL[rapport.appareil].toLowerCase()}`, 240)

  const ratio = rapport.capture.largeur / rapport.capture.hauteur
  /*
    Mesuré : une capture mobile à 170 pt occupait 340 pt de haut et ne laissait
    la place qu'à un seul constat sous elle. À 140 pt, deux tiennent.
  */
  const largeurVoulue = rapport.appareil === "mobile" ? 140 : 300
  const pose = doc.imageJpegCentree(rapport.capture.data, largeurVoulue, ratio)

  if (pose && situes.length > 0) {
    /* Les repères sont en pixels de capture : on les ramène à l'échelle posée. */
    const k = pose.largeur / rapport.capture.largeur
    situes.forEach((c, i) => {
      const z = c.zone!
      const x = pose.x + z.left * k
      const haut = pose.y + pose.hauteur - z.top * k
      const h = Math.max(6, z.height * k)
      doc.cadre(x, haut - h, Math.max(6, z.width * k), h, TERRACOTTA)
      doc.numero(i + 1, x, haut - h - 12, TERRACOTTA, BLANC)
    })
  }

  doc.espace(10)
  doc.texteCentre(
    situes.length > 0
      ? `${situes.length} ${situes.length > 1 ? "repères situés" : "repère situé"} sur la partie visible de votre page.`
      : "Capture réelle de votre page. Les constats ci-après ne portent pas sur une zone repérable.",
    { taille: 8.5, couleur: GRIS }
  )
}

/* -------------------------------------------------------------------------- */
/* Détail des constats                                                         */
/* -------------------------------------------------------------------------- */

function panneauConstat(doc: DocumentPdf, c: Constat, rang: number) {
  const largeur = doc.largeurUtile - 40
  const hauteur =
    18 +
    doc.mesurerHauteur(c.constat, 11.5, "grasse", largeur) +
    14 +
    doc.mesurerHauteur(c.preuve, 9.5, "normale", largeur) +
    14 +
    doc.mesurerHauteur(c.consequence, 9.5, "normale", largeur) +
    14 +
    doc.mesurerHauteur(c.recommandation, 9.5, "normale", largeur) +
    30

  const fin = doc.panneau(hauteur, PAPIER, { filetGauche: ton(c.priorite === "haute" ? 20 : c.priorite === "moyenne" ? 60 : 90), marge: 14 })

  /*
    La pastille d'abord : c'est elle qui descend le curseur d'une ligne. Le
    numéro se pose ensuite sur la ligne obtenue, sinon il flottait treize
    points au-dessus.
  */
  const chip = LIBELLE_PRIORITE[c.priorite]
  const teinte = ton(c.priorite === "haute" ? 20 : c.priorite === "moyenne" ? 60 : 90)
  doc.pastille(chip.toUpperCase(), tonPale(c.priorite === "haute" ? 20 : c.priorite === "moyenne" ? 60 : 90), teinte, MARGE_PDF + 34)
  doc.numero(rang, MARGE_PDF + 14, doc.position - 3, ENCRE, PAPIER)
  doc.espace(12)

  doc.texte(c.constat, { taille: 11.5, police: "grasse", couleur: ENCRE })
  doc.espace(8)

  for (const [etiquette, contenu] of [
    ["Ce qui a été relevé", c.preuve],
    ["Conséquence possible", c.consequence],
    ["Ce qu'il faut faire", c.recommandation],
  ] as const) {
    doc.texte(etiquette.toUpperCase(), { taille: 7.5, police: "grasse", couleur: MINERAL })
    doc.texte(contenu, { taille: 9.5, couleur: ENCRE, interligne: 13.5 })
    doc.espace(6)
  }

  doc.espace(2)
  doc.texte(
    `${LIBELLE_NATURE[c.nature]} · confiance ${c.confiance} · ${APPAREIL[c.appareil]}${c.zone ? " · situé sur la capture" : ""}`,
    { taille: 7.5, couleur: GRIS }
  )
  fin()
  doc.espace(6)
}

/* -------------------------------------------------------------------------- */
/* Ce qui va bien, et ce qui n'a pas pu être jugé                              */
/* -------------------------------------------------------------------------- */

function pointsPositifs(doc: DocumentPdf, base: RapportPage) {
  const bons = base.dimensions.filter((d) => d.note !== null && d.note >= 90)
  if (bons.length === 0) return

  const hauteur = 16 + bons.length * 16
  titreSection(doc, "Ce qui va bien", hauteur + 30)
  const fin = doc.panneau(hauteur, VERT_PALE, { marge: 14 })
  doc.texte("À conserver tel quel.", { taille: 9.5, couleur: VERT })
  doc.espace(4)
  for (const d of bons) {
    doc.texte(d.libelle, { taille: 9.5, police: "grasse", couleur: ENCRE })
    doc.texteDroite(`${d.note}/100`, { taille: 9.5, police: "grasse", couleur: VERT })
  }
  fin()
}

function vitals(doc: DocumentPdf, base: RapportPage) {
  if (base.vitals.length === 0) return
  titreSection(doc, "Temps ressentis par vos visiteurs", 40 + base.vitals.length * 30)
  for (const v of base.vitals) {
    doc.reserverBloc(34)
    doc.texte(v.libelle, { taille: 9.5, police: "grasse", couleur: ENCRE })
    doc.texteDroite(v.valeur, {
      taille: 9.5,
      police: "grasse",
      couleur: v.verdict === "bon" ? VERT : v.verdict === "moyen" ? AMBRE : TERRACOTTA,
    })
    doc.texte(v.aide, { taille: 8.5, couleur: GRIS })
    doc.espace(6)
  }
}

/*
  Récapitulatif : tous les constats en une ligne chacun, avec leur priorité.
  Deux usages — retrouver un point sans relire le détail, et donner à qui
  exécutera les corrections une liste à cocher.
*/
function recapitulatif(doc: DocumentPdf, rapports: RapportPage[]) {
  const tout = rapports.flatMap((r) => r.constats)
  if (tout.length === 0) return

  titreSection(doc, "Récapitulatif", 60 + tout.length * 17)
  doc.texte("Tous les points relevés, du plus grave au moins grave.", {
    taille: 9,
    couleur: GRIS,
  })
  doc.espace(10)

  const rang = { haute: 0, moyenne: 1, basse: 2 } as const
  const ordonnes = [...tout].sort((a, b) => rang[a.priorite] - rang[b.priorite])

  /*
    Une ligne par constat, vraiment une : un intitulé qui reviendrait à la
    ligne déborderait de sa bande et viendrait se poser sur la suivante.
  */
  const surUneLigne = (texte: string, largeur: number) => {
    if (doc.largeurTexte(texte, 9) <= largeur) return texte
    let coupe = texte
    while (coupe.length > 4 && doc.largeurTexte(`${coupe}…`, 9) > largeur) {
      coupe = coupe.slice(0, -1)
    }
    return `${coupe.trimEnd()}…`
  }

  const INTERLIGNE = 13.5
  ordonnes.forEach((c, i) => {
    doc.reserverBloc(22)
    const teinte = ton(c.priorite === "haute" ? 20 : c.priorite === "moyenne" ? 60 : 90)
    /*
      La bande doit couvrir la ligne à VENIR : `texte` descend d'abord le
      curseur d'un interligne, puis écrit. Peinte à la position courante, elle
      se retrouvait décalée d'une ligne vers le haut et les rangs se
      chevauchaient.
    */
    const ligne = doc.position - INTERLIGNE
    if (i % 2 === 0) doc.rectangle(MARGE_PDF, ligne - 5, doc.largeurUtile, 18, PAPIER)
    doc.rectangle(MARGE_PDF, ligne - 5, 2.5, 18, teinte)

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

/*
  Comment ce rapport a été fait. Le dire évite la question, et cadre ce que
  les chiffres valent : des mesures de laboratoire, pas une visite réelle.
*/
function methode(doc: DocumentPdf, base: RapportPage) {
  const lignes = [
    "Les mesures viennent de l'API Google PageSpeed Insights, le même moteur que Lighthouse. Elles sont relevées en laboratoire, sur une connexion simulée : elles décrivent la page, pas la connexion de chacun de vos visiteurs.",
    `La note globale est une moyenne pondérée des seules dimensions mesurées, renormalisée sur leur poids cumulé : ${base.dimensions
      .map((d) => `${d.libelle.toLowerCase()} ${Math.round((d.poids / base.dimensions.reduce((s, x) => s + x.poids, 0)) * 100)} %`)
      .join(", ")}. Une dimension non mesurable sort du calcul au lieu de compter zéro.`,
    "Chaque constat porte sa nature : « mesuré » quand un outil l'a compté, « apprécié » quand il s'agit d'un seuil de lecture. Rien n'est extrapolé au-delà.",
  ]
  /*
    Texte au fil, et non panneau : un bloc insécable de cette taille ne trouvait
    plus sa place en fin de document et partait seul sur une page à moitié
    vide. Ces paragraphes, eux, se répartissent.
  */
  titreSection(doc, "Comment ce rapport a été fait", 60)
  for (const l of lignes) {
    doc.texte(l, { taille: 9, couleur: GRIS, interligne: 13.5 })
    doc.espace(8)
  }
}

/*
  Au fil, sans panneau : la liste se répartit entre deux pages si besoin. En
  bloc insécable, elle sautait une page entière et laissait la précédente à
  moitié vide.
*/
function nonVerifies(doc: DocumentPdf, base: RapportPage) {
  if (base.nonVerifies.length === 0) return
  titreSection(doc, "Ce que cette analyse ne dit pas", 70)
  doc.texte("Une mesure automatique ne juge pas de tout. Ces points demandent un regard humain.", {
    taille: 9,
    couleur: MINERAL,
  })
  doc.espace(6)
  for (const point of base.nonVerifies) {
    doc.reserverBloc(20)
    /* Même précaution que pour le récapitulatif : le filet vise la ligne à venir. */
    const lignes = doc.mesurerHauteur(point, 9, "normale", doc.largeurUtile - 24) / 13
    doc.rectangle(MARGE_PDF, doc.position - 13 * lignes - 1, 2.5, 13 * lignes, SABLE)
    doc.texte(point, {
      taille: 9,
      couleur: ENCRE,
      interligne: 13,
      x: MARGE_PDF + 12,
      largeur: doc.largeurUtile - 24,
    })
    doc.espace(4)
  }
}

/* -------------------------------------------------------------------------- */
/* La suite : ce que je propose, et comment me joindre                         */
/* -------------------------------------------------------------------------- */

function quatriemeDeCouverture(
  doc: DocumentPdf,
  base: RapportPage | null,
  perimetre: Perimetre,
  prenom: string
) {
  const suite = suiteProposee(base, perimetre)
  doc.nouvellePage()
  doc.rectangle(0, 0, PAGE_PDF.largeur, PAGE_PDF.hauteur, ENCRE)

  /*
    Page composée, et non coulée : on mesure l'ensemble puis on le centre. Une
    dernière page à moitié vide donne l'impression d'un document qui s'arrête
    faute de contenu, pas d'un document qui conclut.
  */
  const largeurTexte = doc.largeurUtile - 60
  const hauteurPhrase = doc.mesurerHauteur(suite.phrase, 11.5, "normale", largeurTexte)
  const hauteurCartes = suite.prestations.reduce(
    (total, pr) =>
      total +
      36 +
      doc.mesurerHauteur(pr.ligne, 9.5, "normale", doc.largeurUtile - 56) +
      (pr.prix ? 14 : 0),
    0
  )
  const hauteurTotale = 30 + hauteurPhrase + 22 + hauteurCartes + 30 + 92

  doc.placer(PAGE_PDF.hauteur / 2 + hauteurTotale / 2)

  doc.texteCentre(suite.titre.toUpperCase(), {
    taille: 8.5,
    police: "grasse",
    couleur: TERRACOTTA,
  })
  doc.espace(10)
  doc.texteCentre(suite.phrase, {
    taille: 11.5,
    couleur: PAPIER,
    interligne: 17,
    largeur: largeurTexte,
  })

  doc.espace(22)
  for (const pr of suite.prestations) {
    const hauteur = 24 + doc.mesurerHauteur(pr.ligne, 9.5, "normale", doc.largeurUtile - 56) + (pr.prix ? 14 : 0)
    const haut = doc.position
    doc.rectangle(MARGE_PDF, haut - hauteur - 20, doc.largeurUtile, hauteur + 20, ENCRE_CLAIRE)
    doc.espace(18)
    const gardeMarge = MARGE_PDF + 18
    doc.texte(pr.nom, { taille: 11.5, police: "grasse", couleur: PAPIER, x: gardeMarge, largeur: doc.largeurUtile - 56 })
    if (pr.prix) {
      doc.texteAbsolu(
        pr.prix,
        MARGE_PDF + doc.largeurUtile - 18 - doc.largeurTexte(pr.prix, 9.5, "grasse"),
        doc.position,
        { taille: 9.5, police: "grasse", couleur: TERRACOTTA }
      )
    }
    doc.texte(pr.ligne, {
      taille: 9.5,
      couleur: PAPIER_TERNE,
      interligne: 13.5,
      x: gardeMarge,
      largeur: doc.largeurUtile - 56,
    })
    const lien = `${siteConfig.url}${pr.lien}`
    const affiche = lien.replace(/^https?:\/\//, "")
    doc.texte(affiche, { taille: 8.5, couleur: TERRACOTTA, x: gardeMarge, largeur: doc.largeurUtile - 56 })
    doc.lienSurDerniereLigne(lien, doc.largeurTexte(affiche, 8.5))
    doc.espace(20)
  }

  /* Le pavé de contact, au centre, en grand : c'est la seule action attendue. */
  doc.espace(30)
  doc.texteCentre(
    prenom ? `${prenom}, parlons-en quand vous voulez.` : "Parlons-en quand vous voulez.",
    { taille: 14, police: "grasse", couleur: PAPIER }
  )
  doc.espace(10)
  doc.texteCentre(siteConfig.author.email, { taille: 13, police: "grasse", couleur: TERRACOTTA })
  doc.lienSurDerniereLigne(`mailto:${siteConfig.author.email}`, doc.largeurUtile)
  doc.espace(8)
  doc.texteCentre("Devis gratuit sous 24 heures, sans engagement.", {
    taille: 9.5,
    couleur: PAPIER_TERNE,
  })
  doc.espace(4)
  doc.texteCentre(siteConfig.url.replace(/^https?:\/\//, ""), { taille: 9.5, couleur: PAPIER_TERNE })
  doc.lienSurDerniereLigne(siteConfig.url, doc.largeurUtile)
}

/* -------------------------------------------------------------------------- */
/* Assemblage                                                                  */
/* -------------------------------------------------------------------------- */

export function construireRapport(infos: InfosRapport): Blob {
  const { url, prenom, perimetre, mobile, desktop } = infos
  const base = mobile ?? desktop
  const doc = new DocumentPdf()

  couverture(doc, infos, base)

  if (base) {
    resume(doc, base, prenom)

    /*
      Les points forts et les temps mesurés remontent juste après la synthèse :
      ils comblent le bas de cette page, qui restait blanc, et l'ordre de
      lecture y gagne — on sait ce qui va bien avant d'entrer dans le détail.
    */
    pointsPositifs(doc, base)
    vitals(doc, base)
    /*
      La méthode se lit avant le détail, pas après : on sait alors ce que
      valent les chiffres qu'on s'apprête à parcourir. Elle comble au passage
      la fin de cette page, là où elle laissait une page au quart remplie en
      queue de document.
    */
    methode(doc, base)

    for (const rapport of [mobile, desktop].filter((r): r is RapportPage => Boolean(r))) {
      capture(doc, rapport)
      if (rapport.constats.length > 0) {
        titreSection(
          doc,
          `Le détail — version ${APPAREIL[rapport.appareil].toLowerCase()}`,
          140
        )
        rapport.constats.forEach((c, i) => panneauConstat(doc, c, i + 1))
      } else {
        titreSection(doc, `Version ${APPAREIL[rapport.appareil].toLowerCase()}`, 40)
        doc.texte("Aucun constat au-dessus du seuil sur cette version.", {
          taille: 10,
          couleur: GRIS,
        })
      }
    }

    /*
      Ordre dicté par la pagination : le seul bloc insécable qui reste passe en
      premier, puis viennent deux sections qui se répartissent librement d'une
      page à l'autre. Placées après lui, elles comblent ce qu'il laisse — au
      lieu de partir seules sur une page au quart remplie.
    */
    nonVerifies(doc, base)
    recapitulatif(doc, [mobile, desktop].filter((r): r is RapportPage => Boolean(r)))
  }

  quatriemeDeCouverture(doc, base, perimetre, prenom)

  /* Couverture et quatrième sont des aplats sombres : pas de pied gris dessus. */
  doc.paginer(`${siteConfig.name}  ·  audit de ${domaine(url)}`, [1, doc.numeroPage])
  return new Blob([doc.versOctets() as unknown as BlobPart], { type: "application/pdf" })
}

/*
  Nom de fichier nominatif : la personne le retrouve dans son dossier de
  téléchargements par son propre prénom, pas par un domaine.
*/
export function telechargerRapport(blob: Blob, url: string, prenom = "") {
  const morceau = (prenom || domaine(url)).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  const nom = `audit-${morceau.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`
  const lien = document.createElement("a")
  lien.href = URL.createObjectURL(blob)
  lien.download = nom
  document.body.appendChild(lien)
  lien.click()
  document.body.removeChild(lien)
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000)
}
