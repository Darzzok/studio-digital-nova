/* ==========================================================================
   MOTEUR D'AUDIT
   ==========================================================================
   Source unique de vérité pour le web, le mail et le PDF.

   Deux principes, tenus partout dans ce fichier :

   1. On ne présente jamais une déduction comme une mesure. Chaque constat
      porte sa `nature` — mesuré, apprécié, ou non vérifié — et son niveau de
      confiance. Ce qui n'est pas observable depuis l'API est déclaré comme
      tel plutôt que deviné.

   2. Aucun abaissement artificiel. La note est la moyenne pondérée des
      dimensions réellement mesurées, renormalisée. Une dimension absente ne
      vaut pas zéro : elle sort du calcul et le rapport devient partiel.

   Limite assumée de l'architecture statique : pas de navigateur headless,
   donc pas d'accès au DOM ni au CSS des sites audités. Tout ce qui suit est
   dérivé de ce que Lighthouse expose via l'API PageSpeed.
   ========================================================================== */

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

export const PAGESPEED_KEY = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY ?? ""

export type Strategy = "mobile" | "desktop"

/* -------------------------------------------------------------------------- */
/* Dimensions et pondération                                                   */
/* -------------------------------------------------------------------------- */

export type DimensionId =
  | "apparence"
  | "parcours"
  | "performance"
  | "referencement"
  | "pratiques"

export const DIMENSIONS: Record<
  DimensionId,
  { libelle: string; poids: number; sens: string }
> = {
  apparence: {
    libelle: "Apparence et lisibilité",
    poids: 0.5,
    sens: "Ce qu'un visiteur voit et ressent : lisibilité des textes, stabilité de la page, netteté des images, confort au doigt.",
  },
  parcours: {
    libelle: "Parcours et contact",
    poids: 0.2,
    sens: "La facilité à comprendre où cliquer et à vous joindre.",
  },
  performance: {
    libelle: "Performance",
    poids: 0.15,
    sens: "La vitesse d'affichage réelle, mesurée en laboratoire.",
  },
  referencement: {
    libelle: "Référencement technique",
    poids: 0.1,
    sens: "Les bases que Google attend pour comprendre et classer la page.",
  },
  pratiques: {
    libelle: "Bonnes pratiques",
    poids: 0.05,
    sens: "Ce qui est publiquement observable : HTTPS, erreurs console, ressources en échec.",
  },
}

/* -------------------------------------------------------------------------- */
/* Constats                                                                    */
/* -------------------------------------------------------------------------- */

/** Zone repérée dans la page, en pixels CSS depuis le haut du document. */
/*
  Trois périmètres. Le visiteur choisit ce qu'il veut faire regarder, et tout
  s'y adapte : les catégories demandées à Google, les dimensions notées, les
  constats retenus, la pondération de la note et la recommandation finale.

  « Complet » conserve exactement la pondération d'origine. Les deux autres
  renormalisent sur leurs seules dimensions : retirer la performance ne doit
  pas faire tomber la note, juste sortir du calcul.
*/
export type Perimetre = "visuel" | "technique" | "complet"

export const PERIMETRES: Record<
  Perimetre,
  {
    libelle: string
    resume: string
    /** Ce que la personne y gagne, dit sans jargon. */
    promesse: string
    dimensions: DimensionId[]
    /** Catégories Lighthouse à demander. La performance fournit aussi la capture. */
    categories: string[]
  }
> = {
  visuel: {
    libelle: "Le visuel",
    resume: "Ce qu'un visiteur voit et comprend en arrivant",
    promesse:
      "Lisibilité des textes, netteté des images, stabilité de la page, clarté des liens et des boutons.",
    dimensions: ["apparence", "parcours"],
    categories: ["accessibility", "performance"],
  },
  technique: {
    libelle: "La technique",
    resume: "Ce que Google et le navigateur mesurent sous le capot",
    promesse:
      "Vitesse d'affichage, référencement technique, bonnes pratiques du web.",
    dimensions: ["performance", "referencement", "pratiques"],
    categories: ["performance", "seo", "best-practices"],
  },
  complet: {
    libelle: "Les deux",
    resume: "Le visuel et la technique, avec la pondération complète",
    promesse:
      "L'analyse entière : ce que voient vos visiteurs et ce que mesure Google, en une seule note.",
    dimensions: ["apparence", "parcours", "performance", "referencement", "pratiques"],
    categories: ["performance", "seo", "accessibility", "best-practices"],
  },
}

export type Zone = { top: number; left: number; width: number; height: number }

export type Constat = {
  id: string
  dimension: DimensionId
  /** URL réellement analysée. */
  page: string
  appareil: Strategy
  constat: string
  /** La mesure ou l'élément qui fonde le constat. */
  preuve: string
  consequence: string
  recommandation: string
  priorite: "haute" | "moyenne" | "basse"
  /**
   * `mesure` — valeur relevée par Lighthouse.
   * `appreciation` — lecture argumentée d'une mesure, pas la mesure elle-même.
   * `non_verifie` — point que cette analyse ne peut pas trancher.
   */
  nature: "mesure" | "appreciation" | "non_verifie"
  confiance: "elevee" | "moyenne" | "faible"
  /** Présente seulement si la position est fiable ET tombe dans la capture. */
  zone?: Zone
}

/*
  Dictionnaire des constats. La clé est l'identifiant d'audit Lighthouse.
  `seuil` : en dessous de ce score l'audit produit un constat.

  Les libellés sont écrits pour un dirigeant de TPE, jamais pour un
  développeur, et la conséquence reste prudente — « peut », « risque de » —
  parce qu'aucune de ces mesures ne prouve une perte de clients.
*/
type ModeleConstat = {
  dimension: DimensionId
  constat: string
  preuve: (details: DetailsAudit) => string
  consequence: string
  recommandation: string
  priorite: Constat["priorite"]
  nature: Constat["nature"]
  confiance: Constat["confiance"]
}

type DetailsAudit = {
  displayValue?: string
  score: number | null
  nbElements: number
}

const nb = (d: DetailsAudit, singulier: string, pluriel?: string) =>
  d.nbElements > 0
    ? `${d.nbElements} ${d.nbElements > 1 ? (pluriel ?? singulier + "s") : singulier}`
    : (d.displayValue ?? "relevé par la mesure")

export const MODELES: Record<string, ModeleConstat> = {
  "color-contrast": {
    dimension: "apparence",
    constat: "Des textes manquent de contraste avec leur fond",
    preuve: (d) => `${nb(d, "élément concerné", "éléments concernés")}`,
    consequence:
      "Ces textes deviennent difficiles à lire au soleil, sur un écran bon marché ou après cinquante ans.",
    recommandation:
      "Assombrir la couleur du texte ou éclaircir le fond jusqu'à atteindre un rapport de 4,5:1.",
    priorite: "haute",
    nature: "mesure",
    confiance: "elevee",
  },
  "font-size": {
    dimension: "apparence",
    constat: "Des textes sont trop petits sur mobile",
    preuve: (d) => d.displayValue ?? "relevé sur la version mobile",
    consequence: "Le visiteur doit zoomer pour lire, ce qui décourage la lecture.",
    recommandation: "Passer le texte courant à 16 px minimum sur mobile.",
    priorite: "haute",
    nature: "mesure",
    confiance: "elevee",
  },
  "unsized-images": {
    dimension: "apparence",
    constat: "Des images n'ont pas de dimensions déclarées",
    preuve: (d) => nb(d, "image concernée", "images concernées"),
    consequence:
      "La page saute pendant le chargement : on clique à côté de ce qu'on visait.",
    recommandation:
      "Déclarer largeur et hauteur sur chaque image pour que la place soit réservée d'avance.",
    priorite: "haute",
    nature: "mesure",
    confiance: "elevee",
  },
  "image-size-responsive": {
    dimension: "apparence",
    constat: "Des images sont affichées dans une définition insuffisante",
    preuve: (d) => nb(d, "image concernée", "images concernées"),
    consequence: "Les visuels paraissent flous, ce qui dégrade l'impression de sérieux.",
    recommandation: "Fournir une image au moins aussi large que la place qu'elle occupe.",
    priorite: "moyenne",
    nature: "mesure",
    confiance: "elevee",
  },
  "image-aspect-ratio": {
    dimension: "apparence",
    constat: "Des images sont déformées",
    preuve: (d) => nb(d, "image concernée", "images concernées"),
    consequence: "Une photo étirée se remarque immédiatement et fait amateur.",
    recommandation: "Respecter le rapport largeur/hauteur d'origine, ou recadrer proprement.",
    priorite: "haute",
    nature: "mesure",
    confiance: "elevee",
  },
  "target-size": {
    dimension: "apparence",
    constat: "Des zones cliquables sont trop petites pour un doigt",
    preuve: (d) => nb(d, "élément concerné", "éléments concernés"),
    consequence: "Sur mobile, on rate le bouton. C'est une cause fréquente d'abandon.",
    recommandation: "Porter chaque zone tactile à 44 × 44 px minimum.",
    priorite: "moyenne",
    nature: "mesure",
    confiance: "elevee",
  },
  "meta-viewport": {
    dimension: "apparence",
    constat: "Le zoom est bloqué sur mobile",
    preuve: () => "attribut user-scalable détecté",
    consequence: "Un visiteur qui a besoin d'agrandir ne peut pas. C'est bloquant pour lui.",
    recommandation: "Retirer la restriction de zoom dans la balise viewport.",
    priorite: "haute",
    nature: "mesure",
    confiance: "elevee",
  },
  "layout-shifts": {
    dimension: "apparence",
    constat: "La mise en page bouge pendant le chargement",
    preuve: (d) => nb(d, "déplacement relevé", "déplacements relevés"),
    consequence: "Le contenu se déplace sous les yeux du visiteur pendant qu'il lit.",
    recommandation:
      "Réserver la place des images, des bannières et des polices avant leur arrivée.",
    priorite: "haute",
    nature: "mesure",
    confiance: "elevee",
  },
  "link-name": {
    dimension: "parcours",
    constat: "Des liens n'ont pas de libellé compréhensible",
    preuve: (d) => nb(d, "lien concerné", "liens concernés"),
    consequence:
      "Ni Google ni un lecteur d'écran ne savent où ils mènent. Le visiteur non plus, parfois.",
    recommandation: "Donner à chaque lien un texte qui dit sa destination.",
    priorite: "moyenne",
    nature: "mesure",
    confiance: "elevee",
  },
  "button-name": {
    dimension: "parcours",
    constat: "Des boutons n'ont pas de nom accessible",
    preuve: (d) => nb(d, "bouton concerné", "boutons concernés"),
    consequence: "Un bouton sans nom est inutilisable au clavier et par lecteur d'écran.",
    recommandation: "Ajouter un libellé visible ou un aria-label explicite.",
    priorite: "moyenne",
    nature: "mesure",
    confiance: "elevee",
  },
  "crawlable-anchors": {
    dimension: "parcours",
    constat: "Des liens ne sont pas suivables par Google",
    preuve: (d) => nb(d, "lien concerné", "liens concernés"),
    consequence: "Les pages derrière ces liens risquent de ne jamais être indexées.",
    recommandation: "Utiliser de vrais liens avec une adresse, plutôt qu'un clic en JavaScript.",
    priorite: "moyenne",
    nature: "mesure",
    confiance: "elevee",
  },
  "image-alt": {
    dimension: "parcours",
    constat: "Des images n'ont pas de texte alternatif",
    preuve: (d) => nb(d, "image concernée", "images concernées"),
    consequence:
      "Google ne comprend pas ces visuels, et ils sont invisibles pour un lecteur d'écran.",
    recommandation: "Décrire chaque image utile en une courte phrase.",
    priorite: "moyenne",
    nature: "mesure",
    confiance: "elevee",
  },
  "document-title": {
    dimension: "referencement",
    constat: "Le titre de la page est absent ou mal formé",
    preuve: () => "balise title manquante ou vide",
    consequence: "C'est la ligne bleue affichée par Google. Sans elle, la page est mal présentée.",
    recommandation: "Écrire un titre unique de 50 à 60 caractères pour cette page.",
    priorite: "haute",
    nature: "mesure",
    confiance: "elevee",
  },
  "meta-description": {
    dimension: "referencement",
    constat: "La description pour Google est manquante",
    preuve: () => "balise meta description absente",
    consequence: "Google compose lui-même le résumé affiché, souvent maladroitement.",
    recommandation: "Écrire une description de 150 caractères par page.",
    priorite: "moyenne",
    nature: "mesure",
    confiance: "elevee",
  },
  "http-status-code": {
    dimension: "referencement",
    constat: "La page renvoie un code d'erreur",
    preuve: () => "statut HTTP non valide",
    consequence: "Google ne peut pas indexer cette page.",
    recommandation: "Corriger la réponse du serveur.",
    priorite: "haute",
    nature: "mesure",
    confiance: "elevee",
  },
  "is-crawlable": {
    dimension: "referencement",
    constat: "La page est bloquée à l'indexation",
    preuve: () => "directive noindex ou blocage robots détecté",
    consequence: "Elle n'apparaîtra jamais dans les résultats de recherche.",
    recommandation: "Retirer la directive de blocage si la page doit être visible.",
    priorite: "haute",
    nature: "mesure",
    confiance: "elevee",
  },
  "hreflang": {
    dimension: "referencement",
    constat: "Les déclarations de langue sont incorrectes",
    preuve: () => "hreflang mal formé",
    consequence: "Google peut servir la mauvaise version linguistique.",
    recommandation: "Corriger les codes de langue déclarés.",
    priorite: "basse",
    nature: "mesure",
    confiance: "moyenne",
  },
  "is-on-https": {
    dimension: "pratiques",
    constat: "Le site n'est pas entièrement en HTTPS",
    preuve: () => "ressources chargées en HTTP détectées",
    consequence: "Le navigateur affiche « Non sécurisé » à côté de votre adresse.",
    recommandation: "Servir toutes les ressources en HTTPS.",
    priorite: "haute",
    nature: "mesure",
    confiance: "elevee",
  },
  "errors-in-console": {
    dimension: "pratiques",
    constat: "Des erreurs JavaScript se produisent en arrière-plan",
    preuve: (d) => nb(d, "erreur relevée", "erreurs relevées"),
    consequence: "Une fonctionnalité peut être cassée sans que cela se voie.",
    recommandation: "Ouvrir la console du navigateur et corriger les erreurs signalées.",
    priorite: "moyenne",
    nature: "mesure",
    confiance: "elevee",
  },
}

/* -------------------------------------------------------------------------- */
/* Notation                                                                    */
/* -------------------------------------------------------------------------- */
/*
  Les jeux d'audits qui alimentent chaque note sont DISJOINTS de la catégorie
  Performance de Lighthouse. Sans cela, un même défaut — un saut de mise en
  page, par exemple — serait compté deux fois : une fois dans « apparence »,
  une fois dans « performance ». Le brief l'interdit explicitement.

  Conséquence : `layout-shifts` produit bien un constat visible dans
  « apparence », mais ne pèse pas sur sa note. Un constat n'est pas une
  pénalité.
*/
const AUDITS_APPARENCE = [
  "color-contrast",
  "font-size",
  "unsized-images",
  "image-size-responsive",
  "image-aspect-ratio",
  "target-size",
  "meta-viewport",
] as const

const AUDITS_PARCOURS = ["link-name", "button-name", "crawlable-anchors", "image-alt"] as const

/** Moyenne des audits réellement présents. `null` si aucun n'est disponible. */
function moyenneAudits(audits: Record<string, AuditBrut>, cles: readonly string[]): number | null {
  const notes = cles
    .map((c) => audits?.[c]?.score)
    .filter((s): s is number => typeof s === "number")
  if (notes.length === 0) return null
  return Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 100)
}

export type NoteDimension = {
  id: DimensionId
  libelle: string
  poids: number
  sens: string
  /** `null` = non mesurable sur cette page. Ne compte pas comme zéro. */
  note: number | null
}

/* -------------------------------------------------------------------------- */
/* Rapport                                                                     */
/* -------------------------------------------------------------------------- */

export type Vital = {
  id: string
  libelle: string
  valeur: string
  aide: string
  verdict: "bon" | "moyen" | "faible" | "inconnu"
}

export type Capture = {
  /** Data URI JPEG. */
  data: string
  /** Dimensions de l'image en pixels. */
  largeur: number
  hauteur: number
  /** Largeur de la fenêtre émulée, pour convertir les zones en coordonnées image. */
  largeurPage: number
}

export type RapportPage = {
  url: string
  appareil: Strategy
  /** Ce qui a été demandé : le rapport ne contient rien d'autre. */
  perimetre: Perimetre
  capture: Capture | null
  pellicule: { instant: number; data: string }[]
  dimensions: NoteDimension[]
  constats: Constat[]
  vitals: Vital[]
  /** Points que cette analyse ne peut pas trancher — affichés comme tels. */
  nonVerifies: string[]
  /**
   * Moyenne pondérée des dimensions mesurées, renormalisée sur leur poids
   * cumulé. `null` quand « apparence » manque : sans elle, la moitié de la
   * pondération est absente et une note globale serait trompeuse.
   */
  note: number | null
  /** Vrai si au moins une dimension n'a pas pu être mesurée. */
  partiel: boolean
}

const VITALS_SUIVIS: { id: string; libelle: string; aide: string }[] = [
  {
    id: "largest-contentful-paint",
    libelle: "Affichage du contenu principal",
    aide: "Au-delà de 2,5 s, le visiteur perçoit une lenteur.",
  },
  {
    id: "cumulative-layout-shift",
    libelle: "Stabilité de la mise en page",
    aide: "Au-delà de 0,1, la page bouge visiblement pendant le chargement.",
  },
  {
    id: "total-blocking-time",
    libelle: "Réactivité au premier clic",
    aide: "Au-delà de 200 ms, l'interface paraît figée.",
  },
  {
    id: "first-contentful-paint",
    libelle: "Premier élément affiché",
    aide: "Le moment où l'écran cesse d'être blanc.",
  },
]

function verdictDepuis(score: number | null | undefined): Vital["verdict"] {
  if (typeof score !== "number") return "inconnu"
  if (score >= 0.9) return "bon"
  if (score >= 0.5) return "moyen"
  return "faible"
}

/*
  Points que l'analyse automatique ne peut pas trancher. Ils sont listés tels
  quels dans le rapport, sous « non vérifié » : mieux vaut dire qu'on ne sait
  pas que laisser croire qu'on a regardé.
*/
const NON_VERIFIES = [
  "La clarté de votre offre : sait-on en dix secondes ce que vous vendez et à qui ?",
  "La pertinence de vos textes pour vos clients réels.",
  "La facilité à vous joindre depuis n'importe quelle page.",
  "La qualité de vos photos et leur cohérence entre elles.",
  "Le contenu situé au-delà du premier écran, non capturé par l'analyse.",
  "Ce que font vos concurrents, et ce qui vous en distingue.",
]

/** Convertit un rectangle de page en coordonnées de la capture, si c'est fiable. */
function zoneDansCapture(rect: RectBrut | undefined, capture: Capture | null): Zone | undefined {
  if (!capture || !rect) return undefined
  const { top, left, width, height } = rect
  if (
    typeof top !== "number" ||
    typeof left !== "number" ||
    typeof width !== "number" ||
    typeof height !== "number"
  ) {
    return undefined
  }
  if (width <= 0 || height <= 0) return undefined

  /*
    La capture ne montre que la première fenêtre. Un élément situé plus bas
    n'y figure pas : on renvoie le constat sans repère plutôt que de dessiner
    un rectangle au hasard.
  */
  const echelle = capture.largeur / capture.largeurPage
  const hauteurVisible = capture.hauteur / echelle
  if (top >= hauteurVisible) return undefined
  if (left >= capture.largeurPage) return undefined

  return {
    top: Math.max(0, top * echelle),
    left: Math.max(0, left * echelle),
    width: Math.min(width * echelle, capture.largeur),
    height: Math.min(height * echelle, capture.hauteur - top * echelle),
  }
}

/* -------------------------------------------------------------------------- */
/* Lecture de la réponse PageSpeed                                             */
/* -------------------------------------------------------------------------- */
/*
  La réponse de l'API est vaste et faiblement typée. On ne décrit que ce qu'on
  lit réellement : le reste est ignoré sans risque.
*/
type RectBrut = { top?: number; left?: number; width?: number; height?: number }
type ItemAudit = { node?: { boundingRect?: RectBrut } }
type AuditBrut = {
  score?: number | null
  displayValue?: string
  details?: { items?: ItemAudit[]; data?: string }
}
type ChargePSI = {
  lighthouseResult?: {
    audits?: Record<string, AuditBrut>
    categories?: Record<string, { score?: number | null }>
    finalDisplayedUrl?: string
    finalUrl?: string
    requestedUrl?: string
    configSettings?: { screenEmulation?: { width?: number } }
  }
}

function dimensionsJPEG(data: string): { largeur: number; hauteur: number } | null {
  try {
    const b64 = data.split(",", 2)[1]
    const bin = atob(b64)
    for (let i = 2; i < bin.length; ) {
      if (bin.charCodeAt(i) !== 0xff) {
        i++
        continue
      }
      const marqueur = bin.charCodeAt(i + 1)
      if (marqueur >= 0xc0 && marqueur <= 0xc2) {
        const hauteur = (bin.charCodeAt(i + 5) << 8) | bin.charCodeAt(i + 6)
        const largeur = (bin.charCodeAt(i + 7) << 8) | bin.charCodeAt(i + 8)
        return { largeur, hauteur }
      }
      i += 2 + ((bin.charCodeAt(i + 2) << 8) | bin.charCodeAt(i + 3))
    }
  } catch {
    /* capture illisible : on s'en passe */
  }
  return null
}

function lireRapport(
  charge: ChargePSI,
  appareil: Strategy,
  urlDemandee: string,
  perimetre: Perimetre
): RapportPage {
  const lh = charge?.lighthouseResult ?? {}
  const audits: Record<string, AuditBrut> = lh.audits ?? {}
  const categories = lh.categories ?? {}
  const url: string = lh.finalDisplayedUrl ?? lh.finalUrl ?? lh.requestedUrl ?? urlDemandee

  /* ---- Capture ---------------------------------------------------------- */
  const brute: string | null = audits["final-screenshot"]?.details?.data ?? null
  const dims = brute ? dimensionsJPEG(brute) : null
  const largeurPage: number =
    lh.configSettings?.screenEmulation?.width ?? (appareil === "mobile" ? 412 : 1350)
  const capture: Capture | null =
    brute && dims ? { data: brute, largeur: dims.largeur, hauteur: dims.hauteur, largeurPage } : null

  /* ---- Pellicule -------------------------------------------------------- */
  const vignettes = ((audits["screenshot-thumbnails"]?.details as { items?: { timing?: number; data?: string }[] } | undefined)?.items ?? [])
  const garder = 5
  const pellicule = vignettes
    .filter((v): v is { timing: number; data: string } => Boolean(v?.data))
    .filter((_, i, tout) => (tout.length <= garder ? true : i % Math.ceil(tout.length / garder) === 0))
    .slice(0, garder)
    .map((v) => ({ instant: v.timing, data: v.data }))

  /* ---- Constats --------------------------------------------------------- */
  const retenues = PERIMETRES[perimetre].dimensions
  const constats: Constat[] = []
  for (const [cle, modele] of Object.entries(MODELES)) {
    /* Hors périmètre : la personne n'a pas demandé ce regard-là. */
    if (!retenues.includes(modele.dimension)) continue
    const audit = audits[cle]
    if (!audit) continue
    const score = audit.score
    /* `null` = non applicable à cette page. Ce n'est pas un défaut. */
    if (score === null || score === undefined || score >= 0.9) continue

    const items: ItemAudit[] = audit.details?.items ?? []
    const details: DetailsAudit = {
      displayValue: audit.displayValue,
      score,
      nbElements: items.length,
    }

    /* Position : uniquement si un élément porte une géométrie exploitable. */
    const premier = items.find((it) => it?.node?.boundingRect)
    const zone = zoneDansCapture(premier?.node?.boundingRect, capture)

    constats.push({
      id: cle,
      dimension: modele.dimension,
      page: url,
      appareil,
      constat: modele.constat,
      preuve: modele.preuve(details),
      consequence: modele.consequence,
      recommandation: modele.recommandation,
      priorite: modele.priorite,
      nature: modele.nature,
      confiance: modele.confiance,
      ...(zone ? { zone } : {}),
    })
  }

  const rang = { haute: 0, moyenne: 1, basse: 2 } as const
  constats.sort((a, b) => rang[a.priorite] - rang[b.priorite])

  /* ---- Notes par dimension ---------------------------------------------- */
  const brutes: Record<DimensionId, number | null> = {
    apparence: moyenneAudits(audits, AUDITS_APPARENCE),
    parcours: moyenneAudits(audits, AUDITS_PARCOURS),
    performance:
      typeof categories.performance?.score === "number"
        ? Math.round(categories.performance.score * 100)
        : null,
    referencement:
      typeof categories.seo?.score === "number" ? Math.round(categories.seo.score * 100) : null,
    pratiques:
      typeof categories["best-practices"]?.score === "number"
        ? Math.round(categories["best-practices"].score * 100)
        : null,
  }

  const dimensions: NoteDimension[] = retenues.map((id) => ({
    id,
    libelle: DIMENSIONS[id].libelle,
    poids: DIMENSIONS[id].poids,
    sens: DIMENSIONS[id].sens,
    note: brutes[id],
  }))

  /*
    Note globale : moyenne pondérée des seules dimensions du périmètre qui ont
    pu être mesurées, ramenée à leur poids cumulé. En « complet », c'est la
    pondération d'origine à l'identique ; sur un périmètre restreint, les poids
    se renormalisent entre eux — sortir la performance ne doit pas faire tomber
    la note, seulement sortir du calcul.

    Une dimension majeure absente empêche toute note : la moitié du barème
    manquerait, et le chiffre serait trompeur.
  */
  const majeure = retenues[0]
  const mesurees = dimensions.filter((d) => d.note !== null)
  const poidsCumule = mesurees.reduce((s, d) => s + d.poids, 0)
  const note =
    brutes[majeure] === null || poidsCumule === 0
      ? null
      : Math.round(mesurees.reduce((s, d) => s + (d.note as number) * d.poids, 0) / poidsCumule)

  /* ---- Ressenti --------------------------------------------------------- */
  const vitals: Vital[] = VITALS_SUIVIS.filter((v) => audits[v.id]).map((v) => ({
    id: v.id,
    libelle: v.libelle,
    valeur: audits[v.id].displayValue ?? "—",
    aide: v.aide,
    verdict: verdictDepuis(audits[v.id].score),
  }))

  const nonVerifies = [...NON_VERIFIES]
  if (!capture) {
    nonVerifies.unshift("L'aspect visuel de la page : aucune capture n'a pu être obtenue.")
  }

  return {
    url,
    appareil,
    perimetre,
    capture,
    pellicule,
    dimensions,
    constats,
    vitals,
    nonVerifies,
    note,
    partiel: mesurees.length < dimensions.length,
  }
}

/* -------------------------------------------------------------------------- */
/* Appel                                                                       */
/* -------------------------------------------------------------------------- */

export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    // Un hôte sans point ne peut pas être un domaine public.
    if (!url.hostname.includes(".")) return null
    return url.toString()
  } catch {
    return null
  }
}

export class AuditError extends Error {
  constructor(
    message: string,
    /** Vrai si réessayer plus tard peut aider (quota, indisponibilité). */
    readonly retryable: boolean
  ) {
    super(message)
  }
}

export async function runAudit(
  url: string,
  strategy: Strategy,
  signal?: AbortSignal,
  perimetre: Perimetre = "complet"
): Promise<RapportPage> {
  const params = new URLSearchParams({ url, strategy })
  /*
    Seules les catégories utiles au périmètre sont demandées. La performance
    figure partout : c'est elle qui fournit la capture d'écran et la géométrie
    des éléments, dont le regard visuel a besoin.
  */
  for (const category of PERIMETRES[perimetre].categories) {
    params.append("category", category)
  }
  if (PAGESPEED_KEY) params.set("key", PAGESPEED_KEY)

  let response: Response
  try {
    response = await fetch(`${PSI_ENDPOINT}?${params}`, { signal })
  } catch {
    throw new AuditError("Impossible de joindre le service d'analyse de Google.", true)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const reason: string = body?.error?.message ?? ""

    if (response.status === 429) {
      throw new AuditError(
        "Le service d'analyse est momentanément saturé. Réessayez dans quelques minutes — ou demandez l'audit détaillé, je le lance de mon côté.",
        true
      )
    }
    /*
      403 = la clé refuse l'appel (restriction de domaine mal réglée, clé
      révoquée, API désactivée). Ce n'est pas la faute du visiteur : on ne lui
      demande donc pas de vérifier son adresse, on l'oriente vers le formulaire.
    */
    if (response.status === 403 || /PERMISSION_DENIED|API_KEY/i.test(reason)) {
      throw new AuditError(
        "L'analyse automatique n'est pas disponible depuis cette page. Laissez-moi votre adresse juste en dessous : je lance l'audit de mon côté et vous l'envoie sous 24 h.",
        false
      )
    }
    if (/Unable to process request|FAILED_DOCUMENT_REQUEST|DNS|ERRORED_DOCUMENT_REQUEST/i.test(reason)) {
      throw new AuditError(
        "Google n'a pas réussi à charger cette adresse. Vérifiez qu'elle est correcte et accessible publiquement.",
        false
      )
    }
    throw new AuditError("L'analyse n'a pas abouti pour cette adresse.", true)
  }

  return lireRapport(await response.json(), strategy, url, perimetre)
}
