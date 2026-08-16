/* ==========================================================================
   MOTEUR D'AUDIT
   ==========================================================================
   Le site est un export statique : aucun serveur ne peut analyser l'URL du
   visiteur. On s'appuie donc sur l'API PageSpeed Insights de Google, appelée
   directement depuis le navigateur — elle autorise le CORS.

   Deux conséquences assumées :

   · La clé API est publique (elle part dans le bundle). Elle doit être
     restreinte au domaine dans la Google Cloud Console — c'est la protection
     prévue pour ce cas. Sans clé, le quota anonyme partagé de Google est
     saturé en permanence et l'API répond 429.

   · L'analyse porte sur UNE page, celle dont l'URL est saisie. C'est dit
     explicitement au visiteur : on ne prétend pas auditer un site entier.
   ========================================================================== */

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

/** Injectée au build. Absente ⇒ l'interface bascule sur le formulaire seul. */
export const PAGESPEED_KEY = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY ?? ""

export type Strategy = "mobile" | "desktop"

export type CategoryScore = {
  id: "performance" | "seo" | "accessibility" | "best-practices"
  label: string
  /** 0 à 100, ou null si Lighthouse n'a pas pu conclure. */
  score: number | null
  /** Ce que ça veut dire pour l'activité du visiteur, pas pour un développeur. */
  meaning: string
}

export type VitalMetric = {
  id: string
  label: string
  value: string
  /** Interprétation Lighthouse : bon / à améliorer / insuffisant. */
  verdict: "good" | "average" | "poor" | "unknown"
  hint: string
}

export type AuditIssue = {
  id: string
  title: string
  /** La conséquence concrète, formulée pour un dirigeant de TPE. */
  impact: string
  severity: "critique" | "important" | "mineur"
}

/** Un critère mesurable de confort visuel, extrait de Lighthouse. */
export type VisualSignal = {
  id: string
  label: string
  /** 0 à 1. */
  score: number
  detail: string
}

export type AuditReport = {
  strategy: Strategy
  finalUrl: string
  categories: CategoryScore[]
  vitals: VitalMetric[]
  issues: AuditIssue[]
  /** Capture de la page telle que Google l'a vue, en data URI. */
  screenshot: string | null
  /** Pellicule du chargement : la page à intervalles réguliers. */
  filmstrip: { timing: number; data: string }[]
  /** Note de confort visuel, agrégée des signaux mesurables. */
  visual: { score: number | null; signals: VisualSignal[] }
  /**
   * Note pondérée par ce qui fait réellement perdre des clients à une petite
   * entreprise. Ce n'est PAS un score Google : la moyenne plate des quatre
   * catégories flatte (un 96 en « bonnes pratiques » masque un 51 en
   * performance). Les scores bruts restent affichés à côté.
   */
  overall: number
}

/*
  Pondération de la note globale. Assumée, et affichée au visiteur : la
  vitesse et le confort de lecture pèsent plus lourd que la propreté
  technique quand il s'agit de convertir un visiteur en client.
*/
const WEIGHTS = { performance: 0.4, visual: 0.3, seo: 0.2, "best-practices": 0.1 } as const

/* -------------------------------------------------------------------------- */
/* Dictionnaire des problèmes                                                  */
/* -------------------------------------------------------------------------- */
/*
  Lighthouse renvoie une centaine d'audits nommés pour des développeurs. On
  n'en retient qu'une sélection — ceux qu'un dirigeant peut comprendre et qui
  correspondent à une prestation réelle — et on les reformule en conséquence
  business plutôt qu'en cause technique.
*/

const ISSUE_LIBRARY: Record<string, { title: string; impact: string; severity: AuditIssue["severity"] }> = {
  viewport: {
    title: "Le site n'est pas adapté aux mobiles",
    impact:
      "Plus de la moitié de vos visiteurs arrivent depuis un téléphone. Google pénalise directement les sites non responsives.",
    severity: "critique",
  },
  "is-on-https": {
    title: "Le site n'est pas en HTTPS",
    impact:
      "Les navigateurs affichent « Non sécurisé » à côté de votre adresse. C'est le premier signal de méfiance pour un visiteur.",
    severity: "critique",
  },
  "server-response-time": {
    title: "Le serveur répond lentement",
    impact:
      "Avant même d'afficher quoi que ce soit, votre visiteur attend. C'est souvent le signe d'un hébergement sous-dimensionné.",
    severity: "critique",
  },
  "largest-contentful-paint-element": {
    title: "L'élément principal met du temps à s'afficher",
    impact:
      "Le premier grand visuel ou titre tarde à apparaître. Google mesure précisément ce délai et s'en sert pour classer votre site.",
    severity: "important",
  },
  "modern-image-formats": {
    title: "Les images sont dans un format dépassé",
    impact:
      "Converties en WebP ou AVIF, vos images pèseraient souvent trois fois moins, pour une qualité identique.",
    severity: "important",
  },
  "uses-optimized-images": {
    title: "Les images ne sont pas compressées",
    impact: "Chaque image trop lourde ralentit la page et consomme le forfait mobile de vos visiteurs.",
    severity: "important",
  },
  "uses-responsive-images": {
    title: "Les images sont servies trop grandes",
    impact:
      "Un téléphone télécharge des images prévues pour un grand écran. C'est du poids inutile sur la connexion la plus lente.",
    severity: "important",
  },
  "render-blocking-resources": {
    title: "Des fichiers bloquent l'affichage",
    impact:
      "Le navigateur doit tout télécharger avant de montrer la moindre ligne. La page reste blanche pendant ce temps.",
    severity: "important",
  },
  "unused-css-rules": {
    title: "Du code de style inutilisé est chargé",
    impact: "Votre visiteur télécharge des feuilles de style dont la page ne se sert jamais.",
    severity: "mineur",
  },
  "unused-javascript": {
    title: "Du code JavaScript inutilisé est chargé",
    impact:
      "Souvent le symptôme d'un thème ou d'extensions qui embarquent bien plus que nécessaire.",
    severity: "important",
  },
  "uses-text-compression": {
    title: "Les fichiers texte ne sont pas compressés",
    impact: "Une simple option d'hébergement diviserait leur poids par trois. Réglage rapide, gain immédiat.",
    severity: "mineur",
  },
  "total-byte-weight": {
    title: "La page est très lourde",
    impact: "En 4G ou dans une zone mal couverte, une page lourde fait fuir avant même de s'afficher.",
    severity: "important",
  },
  "document-title": {
    title: "Le titre de la page est absent ou mal formé",
    impact:
      "C'est la ligne bleue cliquable dans Google. Sans titre pertinent, vous perdez des clics même bien positionné.",
    severity: "critique",
  },
  "meta-description": {
    title: "La description pour Google est manquante",
    impact:
      "C'est le texte affiché sous votre titre dans les résultats. Absent, Google improvise — souvent mal.",
    severity: "important",
  },
  "http-status-code": {
    title: "La page renvoie un code d'erreur",
    impact: "Google ne peut pas l'indexer correctement. Elle risque de disparaître des résultats.",
    severity: "critique",
  },
  "is-crawlable": {
    title: "La page est bloquée à l'indexation",
    impact:
      "Une consigne empêche Google de référencer cette page. C'est souvent un oubli laissé après une mise en ligne.",
    severity: "critique",
  },
  "link-text": {
    title: "Des liens sans libellé explicite",
    impact:
      "Les « cliquez ici » n'apprennent rien à Google sur la page de destination, et compliquent la navigation au lecteur d'écran.",
    severity: "mineur",
  },
  "crawlable-anchors": {
    title: "Des liens que Google ne peut pas suivre",
    impact: "Certaines de vos pages risquent de rester invisibles faute de lien exploitable vers elles.",
    severity: "important",
  },
  "image-alt": {
    title: "Des images sans texte alternatif",
    impact:
      "Google ne comprend pas ce qu'elles montrent, et les personnes malvoyantes n'y ont pas accès. Vous perdez la recherche d'images.",
    severity: "important",
  },
  "color-contrast": {
    title: "Contrastes de couleur insuffisants",
    impact:
      "Certains textes sont difficiles à lire, en particulier au soleil sur un téléphone ou pour un visiteur presbyte.",
    severity: "important",
  },
  "heading-order": {
    title: "La hiérarchie des titres est incohérente",
    impact:
      "Google se sert de la structure des titres pour comprendre votre page. Désordonnée, elle brouille votre message.",
    severity: "mineur",
  },
  "html-has-lang": {
    title: "La langue de la page n'est pas déclarée",
    impact:
      "Les moteurs et les lecteurs d'écran doivent deviner. Un attribut manquant, corrigé en une ligne.",
    severity: "mineur",
  },
  label: {
    title: "Des champs de formulaire sans étiquette",
    impact: "Vos formulaires sont pénibles à remplir, en particulier au téléphone. Autant de demandes perdues.",
    severity: "important",
  },
  "errors-in-console": {
    title: "Des erreurs JavaScript en arrière-plan",
    impact:
      "Signe que quelque chose casse sans prévenir — parfois un formulaire ou un bouton qui ne répond plus.",
    severity: "important",
  },
  "target-size": {
    title: "Des zones cliquables trop petites",
    impact: "Au doigt, on rate le bouton. C'est une cause fréquente d'abandon sur mobile.",
    severity: "mineur",
  },
}

const CATEGORY_MEANING: Record<CategoryScore["id"], { label: string; meaning: string }> = {
  performance: {
    label: "Performance",
    meaning: "La vitesse d'affichage. C'est le premier facteur d'abandon avant même la lecture.",
  },
  seo: {
    label: "Référencement",
    meaning: "Les bases techniques que Google attend pour comprendre et classer votre page.",
  },
  accessibility: {
    label: "Accessibilité",
    meaning: "La lisibilité pour tous vos visiteurs, y compris au soleil, en grand âge ou en situation de handicap.",
  },
  "best-practices": {
    label: "Bonnes pratiques",
    meaning: "La sécurité et la propreté technique du site — ce qui inspire confiance ou non.",
  },
}

/* -------------------------------------------------------------------------- */
/* Confort visuel                                                              */
/* -------------------------------------------------------------------------- */
/*
  Lighthouse ne juge pas l'esthétique — aucune API ne le fait. Mais il mesure
  précisément ce qui rend une page désagréable à l'œil : le texte illisible,
  les couleurs trop pâles, la mise en page qui saute, les images déformées,
  les boutons qu'on rate au doigt. Agrégés, ces signaux disent honnêtement si
  un site est pénible à regarder.

  Le poids est réparti sur les seuls signaux réellement renvoyés : Lighthouse
  omet ceux qui ne s'appliquent pas à la page.
*/
const VISUAL_LIBRARY: Record<string, { label: string; weight: number; detail: string }> = {
  "cumulative-layout-shift": {
    label: "Stabilité de la mise en page",
    weight: 0.3,
    detail: "Les blocs qui se déplacent pendant le chargement — la cause des clics à côté.",
  },
  "color-contrast": {
    label: "Lisibilité des textes",
    weight: 0.25,
    detail: "Des couleurs trop proches rendent le texte pénible, surtout au soleil sur un téléphone.",
  },
  "target-size": {
    label: "Confort au doigt",
    weight: 0.15,
    detail: "Des boutons trop petits ou trop serrés, qu'on rate une fois sur deux.",
  },
  "unsized-images": {
    label: "Images sans dimensions",
    weight: 0.12,
    detail: "Le navigateur ignore la place à réserver : la page sursaute quand elles arrivent.",
  },
  "image-size-responsive": {
    label: "Netteté des images",
    weight: 0.1,
    detail: "Des images affichées plus grandes que leur définition réelle paraissent floues.",
  },
  "image-aspect-ratio": {
    label: "Proportions des images",
    weight: 0.08,
    detail: "Des visuels étirés ou écrasés par rapport à leurs proportions d'origine.",
  },
  "font-size": {
    label: "Taille du texte sur mobile",
    weight: 0.1,
    detail: "Un texte trop petit oblige à zoomer pour lire. Google le signale comme un défaut.",
  },
}

/* -------------------------------------------------------------------------- */
/* Extraction                                                                  */
/* -------------------------------------------------------------------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */

function verdictFromScore(score: number | null | undefined): VitalMetric["verdict"] {
  if (score === null || score === undefined) return "unknown"
  if (score >= 0.9) return "good"
  if (score >= 0.5) return "average"
  return "poor"
}

const VITALS: { id: string; label: string; hint: string }[] = [
  {
    id: "largest-contentful-paint",
    label: "Affichage du contenu principal",
    hint: "Le temps avant que l'élément le plus visible apparaisse. Google vise moins de 2,5 s.",
  },
  {
    id: "cumulative-layout-shift",
    label: "Stabilité visuelle",
    hint: "Mesure les éléments qui sautent pendant le chargement — la cause des clics à côté.",
  },
  {
    id: "total-blocking-time",
    label: "Réactivité",
    hint: "Le temps pendant lequel la page ne répond pas aux clics, même si elle paraît prête.",
  },
  {
    id: "first-contentful-paint",
    label: "Premier affichage",
    hint: "Le moment où le visiteur voit enfin autre chose qu'une page blanche.",
  },
]

function parseReport(payload: any, strategy: Strategy): AuditReport {
  const lh = payload?.lighthouseResult
  if (!lh) throw new Error("Réponse inattendue de Google.")

  const categories: CategoryScore[] = (
    ["performance", "seo", "accessibility", "best-practices"] as const
  ).map((id) => {
    const raw = lh.categories?.[id]?.score
    return {
      id,
      label: CATEGORY_MEANING[id].label,
      score: typeof raw === "number" ? Math.round(raw * 100) : null,
      meaning: CATEGORY_MEANING[id].meaning,
    }
  })

  const vitals: VitalMetric[] = VITALS.map(({ id, label, hint }) => {
    const audit = lh.audits?.[id]
    return {
      id,
      label,
      value: audit?.displayValue ?? "—",
      verdict: verdictFromScore(audit?.score),
      hint,
    }
  }).filter((metric) => metric.value !== "—")

  /*
    On ne retient que les audits réellement en échec (score < 0,9) et présents
    dans notre dictionnaire. Les critiques d'abord, puis les importants.
  */
  const rank = { critique: 0, important: 1, mineur: 2 } as const
  const issues: AuditIssue[] = Object.entries(ISSUE_LIBRARY)
    .filter(([id]) => {
      const audit = lh.audits?.[id]
      if (!audit) return false
      if (audit.scoreDisplayMode === "notApplicable" || audit.scoreDisplayMode === "informative") return false
      return typeof audit.score === "number" && audit.score < 0.9
    })
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => rank[a.severity] - rank[b.severity])

  /* ---- Confort visuel ---------------------------------------------------- */
  const signals: VisualSignal[] = []
  let visualSum = 0
  let visualWeight = 0
  for (const [id, entry] of Object.entries(VISUAL_LIBRARY)) {
    const audit = lh.audits?.[id]
    if (!audit || typeof audit.score !== "number") continue
    if (audit.scoreDisplayMode === "notApplicable") continue
    signals.push({ id, label: entry.label, score: audit.score, detail: entry.detail })
    visualSum += audit.score * entry.weight
    visualWeight += entry.weight
  }
  // Les signaux les plus dégradés en premier : c'est ce qu'on veut montrer.
  signals.sort((a, b) => a.score - b.score)
  const visualScore = visualWeight > 0 ? Math.round((visualSum / visualWeight) * 100) : null

  /* ---- Captures ----------------------------------------------------------- */
  const screenshot: string | null = lh.audits?.["final-screenshot"]?.details?.data ?? null

  const rawFilm: { timing?: number; data?: string }[] =
    lh.audits?.["screenshot-thumbnails"]?.details?.items ?? []
  /*
    Lighthouse renvoie huit vignettes. On en garde cinq réparties sur toute la
    séquence : assez pour voir la page se construire, sans alourdir l'écran.
  */
  const keep = 5
  const filmstrip = rawFilm
    .filter((f): f is { timing: number; data: string } => Boolean(f?.data))
    .filter((_, index, all) =>
      all.length <= keep ? true : index % Math.ceil(all.length / keep) === 0
    )
    .slice(0, keep)

  /* ---- Note pondérée ------------------------------------------------------ */
  const byId = Object.fromEntries(categories.map((c) => [c.id, c.score]))
  const parts: [number | null, number][] = [
    [byId.performance ?? null, WEIGHTS.performance],
    [visualScore, WEIGHTS.visual],
    [byId.seo ?? null, WEIGHTS.seo],
    [byId["best-practices"] ?? null, WEIGHTS["best-practices"]],
  ]
  const present = parts.filter(([value]) => value !== null) as [number, number][]
  const totalWeight = present.reduce((sum, [, w]) => sum + w, 0)
  const overall = totalWeight
    ? Math.round(present.reduce((sum, [v, w]) => sum + v * w, 0) / totalWeight)
    : 0

  return {
    strategy,
    finalUrl: lh.finalUrl ?? lh.requestedUrl ?? "",
    categories,
    vitals,
    issues,
    screenshot,
    filmstrip,
    visual: { score: visualScore, signals },
    overall,
  }
}

/* -------------------------------------------------------------------------- */
/* Appel                                                                       */
/* -------------------------------------------------------------------------- */

/** Complète une saisie du type « monsite.fr » en URL absolue valide. */
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

export async function runAudit(url: string, strategy: Strategy, signal?: AbortSignal): Promise<AuditReport> {
  const params = new URLSearchParams({ url, strategy })
  for (const category of ["performance", "seo", "accessibility", "best-practices"]) {
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

  return parseReport(await response.json(), strategy)
}
