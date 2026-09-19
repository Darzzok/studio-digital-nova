"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion"
import {
  Accessibility,
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  Download,
  Gauge,
  Home,
  Link2,
  Lock,
  Mail,
  Monitor,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { CardIndex, CHIP, DrawRule, NovaMark } from "@/components/ui/nova"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"
import {
  AuditError,
  BAREME,
  CATEGORY_MEANING,
  PAGESPEED_KEY,
  normalizeUrl,
  runAudit,
  type AuditReport,
  type Strategy,
} from "@/lib/audit"
import { EASE_NOVA, useFloatIn } from "@/lib/motion"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"

import { QUESTIONS_AUDIT } from "./questions"

const WEB3FORMS_ACCESS_KEY = "37757408-4a45-44eb-afc1-20d7ae50d224"
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit"

/*
  Les cinq dimensions annoncées avant l'audit. Quatre viennent directement du
  moteur (CATEGORY_MEANING) ; la cinquième est le confort visuel, que le moteur
  calcule aussi. Rien n'est inventé ici — c'est exactement ce qui sera mesuré.
*/
/*
  Le confort visuel ouvre la liste et occupe toute la largeur : il pèse la
  moitié de la note, autant que ça se voie. Les quatre autres suivent en 2 × 2,
  ce qui évite la case vide que laissait une grille de trois colonnes.

  `poids` reprend WEIGHTS (lib/audit.ts). L'accessibilité est mesurée et
  affichée mais n'entre pas dans la note globale : c'est dit tel quel.
*/
const DIMENSION_PHARE = {
  id: "visual",
  label: "Confort visuel",
  meaning:
    "Lisibilité, stabilité de la mise en page, netteté des images, confort au doigt. C'est ce qu'un visiteur juge avant d'avoir lu une seule ligne — et c'est la moitié de la note.",
  icon: Eye,
  poids: "50 % de la note",
} as const

const DIMENSIONS = [
  { id: "performance", ...CATEGORY_MEANING.performance, chip: CHIP.terracotta, icon: Gauge, poids: "25 %" },
  { id: "seo", ...CATEGORY_MEANING.seo, chip: CHIP.mineral, icon: Search, poids: "15 %" },
  {
    id: "best-practices",
    ...CATEGORY_MEANING["best-practices"],
    chip: CHIP.ochre,
    icon: ShieldCheck,
    poids: "10 %",
  },
  {
    id: "accessibility",
    ...CATEGORY_MEANING.accessibility,
    chip: CHIP.sage,
    icon: Accessibility,
    poids: "mesurée à part",
  },
] as const

/* Les trois étapes du parcours, telles qu'elles se déroulent réellement. */
const ETAPES = [
  {
    titre: "Vous collez votre adresse",
    texte:
      "Pas de compte, pas d'extension, rien à installer. L'analyse part directement de votre navigateur.",
    chip: CHIP.ink,
    icon: Link2,
  },
  {
    titre: "Je mesure sur mobile et sur ordinateur",
    texte:
      "Deux analyses en parallèle via l'API Google PageSpeed Insights, la même que pagespeed.web.dev. Comptez trente secondes.",
    chip: CHIP.mineral,
    icon: Gauge,
  },
  {
    titre: "Vous recevez la note et le rapport",
    texte:
      "La note et le point le plus grave s'affichent tout de suite. Le rapport complet et son PDF se débloquent avec vos coordonnées.",
    chip: CHIP.terracotta,
    icon: Download,
  },
] as const

/* Doit rester synchrone avec WEIGHTS dans lib/audit.ts. */
const PONDERATION = [
  { label: "Confort visuel — ce que voit et ressent votre visiteur", poids: 50 },
  { label: "Vitesse d'affichage", poids: 25 },
  { label: "Bases du référencement", poids: 15 },
  { label: "Bonnes pratiques et sécurité", poids: 10 },
] as const

/*
  Quatre défauts pris tels quels dans le dictionnaire du moteur
  (ISSUE_LIBRARY) : ce sont réellement des points détectés par l'analyse, pas
  une liste d'arguments commerciaux.
*/
const DEFAUTS_COURANTS = [
  {
    titre: "Des images trop lourdes",
    effet:
      "Format dépassé, compression absente, dimensions bien supérieures à l'affichage réel. C'est le premier poste de lenteur sur un site vitrine.",
    remede: "Conversion en WebP, compression et dimensionnement au pixel près.",
  },
  {
    titre: "Une mise en page qui bouge au chargement",
    effet:
      "Le contenu saute pendant que la page se construit. Le visiteur clique à côté, et repart agacé sans savoir pourquoi.",
    remede: "Réservation des espaces à l'avance, pour que rien ne se déplace.",
  },
  {
    titre: "Des contrastes insuffisants",
    effet:
      "Du gris clair sur blanc : élégant sur votre écran, illisible au soleil ou pour un œil de plus de cinquante ans.",
    remede: "Un système de couleurs vérifié au ratio de contraste, sur chaque texte.",
  },
  {
    titre: "Un titre et une description absents",
    effet:
      "C'est la ligne que Google affiche dans ses résultats. Sans elle, votre page est présentée n'importe comment — ou pas du tout.",
    remede: "Un titre et une description écrits page par page, sous les limites d'affichage.",
  },
] as const


type TrackState = "pending" | "running" | "done" | "failed"

const TRACKS: { id: Strategy; label: string; icon: typeof Smartphone }[] = [
  { id: "mobile", label: "Mobile", icon: Smartphone },
  { id: "desktop", label: "Ordinateur", icon: Monitor },
]

/* L'analyse dure 20 à 40 s. On raconte ce qui se passe plutôt que de faire attendre. */
const PROGRESS_STEPS = [
  "Connexion à votre site…",
  "Mesure du temps de chargement…",
  "Analyse des bases de référencement…",
  "Vérification de l'accessibilité…",
  "Contrôle de la sécurité et des bonnes pratiques…",
  "Rédaction du bilan…",
]

/* -------------------------------------------------------------------------- */
/* Affichage d'un score                                                        */
/* -------------------------------------------------------------------------- */

function scoreTone(score: number | null) {
  if (score === null) return { text: "text-text-muted", stroke: "var(--color-border-strong)" }
  if (score >= 90) return { text: "text-success", stroke: "var(--color-success)" }
  if (score >= 50) return { text: "text-warning", stroke: "var(--color-warning)" }
  return { text: "text-error", stroke: "var(--color-error)" }
}

/** Anneau de score en SVG — le tracé se dessine à l'arrivée du résultat. */
function ScoreRing({
  score,
  size = "md",
  reduce,
}: {
  score: number | null
  size?: "md" | "lg"
  reduce: boolean
}) {
  const tone = scoreTone(score)
  const large = size === "lg"

  return (
    <div className={cn("relative flex shrink-0 items-center justify-center", large ? "size-40" : "size-16")}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-border)" strokeWidth={large ? 2 : 2.5} />
        <motion.circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={tone.stroke}
          strokeWidth={large ? 2 : 2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: (score ?? 0) / 100 }}
          transition={reduce ? { duration: 0 } : { duration: 1.1, ease: EASE_NOVA }}
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span className={cn("font-heading tabular-nums", large ? "text-display" : "text-h3", tone.text)}>
          {score ?? "—"}
        </span>
        {large && (
          <span className="mt-1 text-eyebrow uppercase text-on-ink-soft">/ 100</span>
        )}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Résultats                                                                   */
/* -------------------------------------------------------------------------- */

const VERDICT_TONE = {
  good: "text-success",
  average: "text-warning",
  poor: "text-error",
  unknown: "text-text-muted",
} as const

const SEVERITY_CHIP = {
  critique: CHIP.terracotta,
  important: CHIP.ochre,
  mineur: CHIP.mineral,
} as const

/* -------------------------------------------------------------------------- */
/* Sommaire ancré                                                              */
/* -------------------------------------------------------------------------- */
/*
  Le rapport complet est long. Un sommaire collant permet de sauter d'une
  partie à l'autre sans remonter, et de garder en vue la note pendant qu'on
  lit le détail.
*/
type Ancre = { id: string; label: string }

function SommaireRapport({ note, ancres }: { note: number; ancres: Ancre[] }) {
  const [actif, setActif] = useState<string>("bilan")

  useEffect(() => {
    const cibles = ancres
      .map((a) => document.getElementById(a.id))
      .filter((n): n is HTMLElement => Boolean(n))
    if (cibles.length === 0) return
    const observateur = new IntersectionObserver(
      (entrees) => {
        const visible = entrees
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActif(visible.target.id)
      },
      { rootMargin: "-96px 0px -60% 0px" }
    )
    cibles.forEach((c) => observateur.observe(c))
    return () => observateur.disconnect()
  }, [ancres])

  const ton = scoreTone(note)

  return (
    <nav
      aria-label="Sommaire du rapport"
      className="sticky top-[72px] z-20 -mx-4 mb-1 border-y border-border bg-surface/92 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-lg sm:border"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "shrink-0 rounded-md border border-border px-2.5 py-1 font-heading text-small tabular-nums",
            ton.text
          )}
        >
          {note}
        </span>
        <ul className="flex flex-1 gap-1 overflow-x-auto text-left [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ancres.map((ancre) => {
            return (
              <li key={ancre.id}>
                <a
                  href={`#${ancre.id}`}
                  aria-current={actif === ancre.id ? "true" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-md px-3 py-1.5 text-small transition-colors duration-200 ease-nova",
                    actif === ancre.id
                      ? "bg-ink text-paper"
                      : "text-text-secondary hover:text-accent-strong"
                  )}
                >
                  {ancre.label}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/* Rapport                                                                     */
/* -------------------------------------------------------------------------- */

function ReportView({
  report,
  other,
  strategy,
  onStrategy,
  reduce,
  deverrouille,
  gate,
}: {
  report: AuditReport
  other: AuditReport | null
  strategy: Strategy
  onStrategy: (s: Strategy) => void
  reduce: boolean
  /** Tant que c'est faux, seul l'aperçu est montré. */
  deverrouille: boolean
  /** Le formulaire qui débloque le rapport, injecté par la page. */
  gate: React.ReactNode
}) {
  const verdict =
    report.overall >= 75
      ? "Votre site tient la route. Quelques réglages fins suffiraient à le rendre irréprochable."
      : report.overall >= 45
        ? "Votre site fonctionne, mais il laisse passer des visiteurs. Les points ci-dessous sont les plus rentables à corriger."
        : "Votre site perd des visiteurs avant même d'être lu. Les corrections ci-dessous changeraient nettement la donne."

  const dimensions = [
    ...(report.visual.score !== null
      ? [
          {
            id: "visual" as const,
            label: "Confort visuel",
            score: report.visual.score,
            meaning:
              "Lisibilité, stabilité de la mise en page, netteté des images, confort au doigt.",
          },
        ]
      : []),
    ...report.categories.map((c) => ({
      id: c.id,
      label: c.label,
      score: c.score,
      meaning: CATEGORY_MEANING[c.id]?.meaning ?? "",
    })),
  ]

  /* En aperçu : la dimension qui pèse le plus, et rien d'autre. */
  const dimensionsVisibles = deverrouille ? dimensions : dimensions.slice(0, 1)
  const pireProbleme = report.issues[0] ?? null
  const restants = Math.max(0, report.issues.length - 1)

  /*
    Le sommaire ne liste que les parties effectivement présentes : une pellicule
    absente ou des mesures de terrain manquantes ne doivent pas produire un
    lien qui ne mène nulle part.
  */
  const ancres = useMemo<Ancre[]>(
    () =>
      [
        { id: "bilan", label: "Bilan" },
        { id: "dimensions", label: "Notes" },
        report.filmstrip.length > 1 ? { id: "chargement", label: "Chargement" } : null,
        report.visual.signals.length > 0 ? { id: "visuel", label: "Confort visuel" } : null,
        report.vitals.length > 0 ? { id: "ressenti", label: "Ressenti" } : null,
        { id: "corriger", label: "À corriger" },
        { id: "bareme", label: "Barème" },
      ].filter((a): a is Ancre => a !== null),
    [report.filmstrip.length, report.visual.signals.length, report.vitals.length]
  )

  return (
    <div className="flex flex-col gap-6">
      {deverrouille && <SommaireRapport note={report.overall} ancres={ancres} />}

      {/* Bilan général */}
      <Card id="bilan" tone="ink" padding="md" className="grain-ink relative scroll-mt-32 overflow-hidden lg:p-9">
        <div className="relative flex items-center justify-center gap-3">
          <Badge variant="ink">Bilan général</Badge>
          <NovaMark aria-hidden className="size-2.5 text-accent" />
        </div>

        <div className="relative mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          {/*
            La capture que Google a réellement prise. C'est l'élément le plus
            parlant du rapport : le visiteur voit son propre site tel qu'il
            apparaît sur un téléphone, avant tout commentaire.
          */}
          {report.screenshot && (
            <figure className="mx-auto shrink-0 lg:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.screenshot}
                alt={`Aperçu de ${report.finalUrl} tel que Google l'a affiché`}
                className="w-40 rounded-md border border-border-ink bg-white sm:w-48"
              />
              <figcaption className="mt-3 text-eyebrow uppercase text-on-ink-soft">
                Votre site sur mobile
              </figcaption>
            </figure>
          )}

          <div className="flex min-w-0 flex-1 flex-col items-center gap-7 sm:flex-row sm:gap-9">
            <div className="flex flex-col items-center gap-3">
              <ScoreRing score={report.overall} size="lg" reduce={reduce} />
              <span className="text-eyebrow uppercase text-on-ink-soft">Diagnostic</span>
            </div>
            <div className="min-w-0">
              <p className="text-eyebrow uppercase text-on-ink-soft">Page analysée</p>
              <p className="mt-2 break-all font-heading text-h3 text-on-ink">{report.finalUrl}</p>
              <p className="mt-4 text-lead text-on-ink-soft">{verdict}</p>
            </div>
          </div>
        </div>

        {/*
          La méthode est affichée en clair, et la mesure brute avec. Le
          visiteur peut recouper sur pagespeed.web.dev à tout moment : autant
          lui donner lui-même l'écart et son explication.
        */}
        <div className="relative mt-7 border-t border-border-ink pt-5">
          <p className="text-small text-on-ink-soft">
            Mesure brute pondérée :{" "}
            <strong className="font-semibold tabular-nums text-on-ink">
              {report.overallRaw}/100
            </strong>
            . La note retenue applique ensuite mon{" "}
            <a
              href="#bareme"
              className="font-semibold text-accent underline underline-offset-4 hover:text-on-ink"
            >
              barème d&apos;exigence
            </a>
            , plus sévère que la courbe de Google. Pondération : confort visuel 50 %, vitesse 25 %,
            référencement 15 %, bonnes pratiques 10 %.
          </p>
        </div>

        {other && (
          <div className="relative mt-8 flex items-center justify-center gap-3 border-t border-border-ink pt-6">
            <span className="text-eyebrow uppercase text-on-ink-soft">Appareil</span>
            <div className="flex gap-2">
              {(["mobile", "desktop"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStrategy(s)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-1.5 text-eyebrow uppercase outline-none transition-colors duration-200 ease-nova focus-visible:ring-3 focus-visible:ring-ring/35",
                    strategy === s
                      ? "border-accent bg-accent text-ink"
                      : "border-border-ink text-on-ink-soft hover:border-accent"
                  )}
                >
                  <Icon icon={s === "mobile" ? Smartphone : Monitor} className="size-3.5" />
                  {s === "mobile" ? "Mobile" : "Ordinateur"}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Les notes détaillées, confort visuel en tête */}
      <div id="dimensions" className="grid scroll-mt-32 grid-cols-1 gap-5 sm:grid-cols-2">
        {dimensionsVisibles.map((dimension) => (
          <Card key={dimension.id} tone="ivory" padding="md" className="group flex gap-5 text-left">
            <ScoreRing score={dimension.score} reduce={reduce} />
            <div className="min-w-0">
              <h3 className="font-heading text-h3 text-text">{dimension.label}</h3>
              <p className="mt-2 text-small text-text-secondary">{dimension.meaning}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Aperçu : un seul problème montré, le reste derrière le formulaire   */}
      {/* ------------------------------------------------------------------ */}
      {!deverrouille && (
        <>
          {pireProbleme && (
            <Card padding="md" accent="left">
              <p className="text-eyebrow uppercase text-accent-strong">Le point le plus grave</p>
              <DrawRule className="mt-4" />
              <h3 className="mt-6 font-heading text-h3 text-text">{pireProbleme.title}</h3>
              <p className="mt-2 text-small text-text-secondary">{pireProbleme.impact}</p>
            </Card>
          )}

          {/*
            Ce qui reste est annoncé en nombres réels, pris sur le rapport
            déjà calculé. Rien n'est gonflé : si le site est propre, le
            décompte le dit.
          */}
          <Card tone="ivory" padding="md">
            <span className="mx-auto flex size-11 items-center justify-center rounded-md border border-border-strong text-text-secondary">
              <Icon icon={Lock} className="size-5" />
            </span>
            <h3 className="mt-5 font-heading text-h2 text-text">La suite du rapport</h3>
            <p className="measure mx-auto mt-3 text-body text-text-secondary">
              L&apos;analyse est déjà faite et elle est complète. Voici ce qui reste à afficher :
            </p>
            <ul className="card-list mt-7 flex flex-col gap-3">
              {[
                restants > 0
                  ? `${restants} autre${restants > 1 ? "s" : ""} point${restants > 1 ? "s" : ""} à corriger, classé${restants > 1 ? "s" : ""} par gravité`
                  : null,
                dimensions.length > 1
                  ? `Les ${dimensions.length - 1} autres notes détaillées`
                  : null,
                report.visual.signals.length > 0
                  ? `Le détail du confort visuel, signal par signal (${report.visual.signals.length})`
                  : null,
                report.vitals.length > 0 ? "Les temps ressentis par vos visiteurs" : null,
                report.filmstrip.length > 1
                  ? "La pellicule du chargement, image par image"
                  : null,
                "Le rapport complet en PDF, à garder ou à transmettre",
              ]
                .filter((x): x is string => Boolean(x))
                .map((ligne) => (
                  <li key={ligne} className="flex items-baseline gap-3 text-small text-text-secondary">
                    <Icon icon={Check} className="size-3 shrink-0 translate-y-0.5 text-accent" />
                    {ligne}
                  </li>
                ))}
            </ul>
          </Card>

          {gate}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Rapport complet                                                     */}
      {/* ------------------------------------------------------------------ */}
      {deverrouille && (
        <>
          {/* Pellicule du chargement */}
          {report.filmstrip.length > 1 && (
            <Card id="chargement" padding="md" className="scroll-mt-32">
              <p className="text-eyebrow uppercase text-text-muted">
                Ce que voit votre visiteur pendant le chargement
              </p>
              <DrawRule className="mt-4" />
              <ol className="mt-6 flex gap-3 overflow-x-auto pb-1 [justify-content:safe_center]">
                {report.filmstrip.map((frame) => (
                  <li key={frame.timing} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frame.data}
                      alt=""
                      className="w-20 rounded-sm border border-border bg-white sm:w-24"
                    />
                    <p className="mt-2 text-center font-heading text-small tabular-nums text-text-muted">
                      {(frame.timing / 1000).toFixed(1)} s
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-small text-text-secondary">
                Chaque vignette est votre page à cet instant précis. Un écran resté blanc,
                c&apos;est un visiteur qui attend — et souvent, qui repart.
              </p>
            </Card>
          )}

          {/* Détail du confort visuel */}
          {report.visual.signals.length > 0 && (
            <Card id="visuel" padding="md" className="scroll-mt-32">
              <p className="text-eyebrow uppercase text-text-muted">Le détail du confort visuel</p>
              <DrawRule className="mt-4" />
              <ul className="card-list mt-6 flex flex-col divide-y divide-border">
                {report.visual.signals.map((signal, index) => {
                  const pct = Math.round(signal.score * 100)
                  const tone = scoreTone(pct)
                  return (
                    <li
                      key={signal.id}
                      className={cn("flex items-start gap-4 py-4", index === 0 && "pt-0")}
                    >
                      <span
                        className={cn("mt-0.5 shrink-0 font-heading text-body tabular-nums", tone.text)}
                      >
                        {pct}
                      </span>
                      <div className="min-w-0">
                        <p className="text-small font-medium text-text">{signal.label}</p>
                        <p className="mt-1 text-small text-text-muted">{signal.detail}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}

          {/* Mesures de terrain */}
          {report.vitals.length > 0 && (
            <Card id="ressenti" padding="md" className="scroll-mt-32">
              <p className="text-eyebrow uppercase text-text-muted">Ce que ressent votre visiteur</p>
              <DrawRule className="mt-4" />
              <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {report.vitals.map((vital) => (
                  <div key={vital.id}>
                    <dt className="flex items-baseline justify-between gap-3">
                      <span className="text-small font-medium text-text">{vital.label}</span>
                      <span
                        className={cn("font-heading text-body tabular-nums", VERDICT_TONE[vital.verdict])}
                      >
                        {vital.value}
                      </span>
                    </dt>
                    <dd className="mt-1.5 text-small text-text-muted">{vital.hint}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {/*
            Les mêmes problèmes que renvoie le moteur, mais rangés par gravité :
            ce qui coûte cher d'abord. Rien n'est ajouté ni reformulé — seul
            l'ordre et la hiérarchie visuelle changent. Les « bons points » sont
            déduits des catégories déjà notées 90 ou plus.
          */}
          <div id="corriger" className="flex scroll-mt-32 flex-col gap-5">
            {report.issues.length > 0 ? (
              <>
                {(
                  [
                    { key: "critique", titre: "Priorité élevée", accent: true },
                    { key: "important", titre: "À améliorer", accent: false },
                    { key: "mineur", titre: "Détails", accent: false },
                  ] as const
                ).map((groupe) => {
                  const lot = report.issues.filter((issue) => issue.severity === groupe.key)
                  if (lot.length === 0) return null
                  return (
                    <Card
                      key={groupe.key}
                      padding="md"
                      className={cn(groupe.accent && "border-l border-l-accent")}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <p className="text-eyebrow uppercase text-text">
                          {groupe.titre}
                          <span className="ml-2 font-heading tabular-nums text-text-muted">
                            {lot.length}
                          </span>
                        </p>
                        {groupe.accent && <Icon icon={CircleAlert} className="size-4 text-accent" />}
                      </div>
                      <DrawRule className="mt-4" />
                      <ul className="card-list mt-6 flex flex-col divide-y divide-border">
                        {lot.map((issue, index) => (
                          <li key={issue.id} className={cn("flex gap-4 py-5", index === 0 && "pt-0")}>
                            <span
                              aria-hidden
                              className="mt-1 font-heading text-small tabular-nums text-text-muted"
                            >
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="font-heading text-h3 text-text">{issue.title}</h3>
                                <span
                                  className={cn(
                                    "rounded-sm px-2 py-0.5 text-eyebrow uppercase",
                                    SEVERITY_CHIP[issue.severity]
                                  )}
                                >
                                  {issue.severity}
                                </span>
                              </div>
                              <p className="mt-2 text-small text-text-secondary">{issue.impact}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )
                })}
              </>
            ) : (
              <Card padding="md" className="flex items-center gap-4 text-left">
                <span
                  className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", CHIP.sage)}
                >
                  <Icon icon={ShieldCheck} className="size-4" />
                </span>
                <p className="text-small text-text-secondary">
                  Aucun défaut majeur détecté sur cette page parmi les points que je contrôle.
                  C&apos;est rare — et bon signe.
                </p>
              </Card>
            )}

            {/* Bons points — déduits des catégories déjà notées par le moteur. */}
            {report.categories.filter((c) => (c.score ?? 0) >= 90).length > 0 && (
              <Card tone="ivory" padding="md">
                <p className="text-eyebrow uppercase text-text">Ce qui va bien</p>
                <DrawRule className="mt-4" />
                <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3">
                  {report.categories
                    .filter((c) => (c.score ?? 0) >= 90)
                    .map((c) => (
                      <li key={c.id} className="flex items-center gap-2.5 text-small text-text">
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full",
                            CHIP.sage
                          )}
                        >
                          <Icon icon={Check} className="size-3" />
                        </span>
                        {c.label}
                        <span className="font-heading tabular-nums text-text-muted">{c.score}</span>
                      </li>
                    ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Le barème, en clair, à la fin du rapport. */}
          <Card id="bareme" tone="ivory" padding="md" className="scroll-mt-32">
            <p className="text-eyebrow uppercase text-text-muted">Comment cette note est calculée</p>
            <DrawRule className="mt-4" />
            <p className="measure mx-auto mt-6 text-small text-text-secondary">
              La mesure vient de l&apos;API Google PageSpeed Insights, la même que
              pagespeed.web.dev. Google note avec une courbe indulgente ; j&apos;applique ensuite le
              barème que j&apos;exige d&apos;un site que je livre. La fonction est croissante : un
              meilleur site obtient toujours une meilleure note.
            </p>
            <ul className="card-list mt-7 flex flex-col gap-2">
              {[...BAREME].reverse().map((palier) => (
                <li
                  key={palier.brut}
                  className="flex items-baseline gap-6 text-small tabular-nums text-text-secondary"
                >
                  <span className="w-28 shrink-0">Mesure {palier.brut}</span>
                  <Icon icon={ArrowRight} className="size-3 shrink-0 text-accent" />
                  <span className="font-heading text-text">note {palier.note}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <p className="text-small text-text-muted">
        Cette analyse porte sur la page dont vous avez saisi l&apos;adresse, mesurée par Google
        PageSpeed Insights. Un audit complet couvre l&apos;ensemble des pages, le contenu, la
        structure du site et la concurrence.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Formulaire — il débloque le rapport et déclenche le PDF                     */
/* -------------------------------------------------------------------------- */

function LeadForm({
  url,
  mobile,
  desktop,
  onDeverrouille,
}: {
  url: string
  mobile: AuditReport | null
  desktop: AuditReport | null
  onDeverrouille: () => void
}) {
  const [prenom, setPrenom] = useState("")
  const [email, setEmail] = useState("")
  const [telephone, setTelephone] = useState("")
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const report = mobile ?? desktop

  /** Construit le PDF et le remet au visiteur. Isolé pour être rejouable. */
  const produirePdf = useCallback(
    async (nom: string) => {
      const { construireRapport, telechargerRapport } = await import("@/lib/audit-pdf")
      const blob = construireRapport({ url, prenom: nom, mobile, desktop })
      telechargerRapport(blob, url)
    },
    [url, mobile, desktop]
  )

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setErreur("Merci d'indiquer une adresse email valide.")
      return
    }
    /* Assez souple pour accepter les formats courants, sans bloquer personne. */
    if (telephone.replace(/\D/g, "").length < 9) {
      setErreur("Merci d'indiquer un numéro de téléphone valide.")
      return
    }
    setEnvoi(true)
    setErreur(null)

    /*
      La fiche reprend le rapport tel quel : note, mesure brute, notes par
      dimension et liste intégrale des points relevés. Rien n'est résumé ni
      réinterprété.
    */
    const fiche = [
      `Site analysé : ${url}`,
      `Prénom : ${prenom || "non renseigné"}`,
      `Email : ${email}`,
      `Téléphone : ${telephone}`,
      "",
      resumerRapport(mobile, "MOBILE"),
      "",
      resumerRapport(desktop, "ORDINATEUR"),
    ].join("\n")

    const transmis = await transmettreReleve({
      subject: `FICHE CLIENT — ${url}`,
      from_name: prenom || email,
      name: prenom || "Non renseigné",
      email,
      telephone,
      site: url,
      message: fiche,
    })

    if (!transmis) {
      /*
        L'envoi de la fiche a échoué, mais l'analyse, elle, est déjà faite. On
        ne prend pas le visiteur en otage d'un problème réseau qui n'est pas le
        sien : le rapport s'ouvre quand même.
      */
      setErreur(
        "Votre fiche n'a pas pu m'être transmise, mais votre rapport est bien débloqué. " +
          "Écrivez-moi à contact@studiodigitalnova.fr si vous voulez que je le commente."
      )
    }

    try {
      await produirePdf(prenom)
    } catch {
      setErreur(
        "Le PDF n'a pas pu être généré sur cet appareil. Le rapport complet reste consultable ci-dessous."
      )
    }

    setEnvoi(false)
    onDeverrouille()
  }

  if (!report) return null

  return (
    <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden lg:p-9">
      <div className="relative flex items-center justify-center gap-3">
        <Badge variant="ink">Rapport complet</Badge>
        <NovaMark aria-hidden className="size-2.5 text-accent" />
      </div>

      <h3 className="relative mt-7 font-heading text-h2 text-on-ink">
        Débloquez le rapport et son PDF
      </h3>
      <p className="relative mx-auto mt-4 max-w-xl text-lead text-on-ink-soft">
        Le reste de l&apos;analyse s&apos;affiche immédiatement et le PDF se télécharge dans la
        foulée. Je le lis de mon côté et je reviens vers vous sous 24 heures, sans engagement.
      </p>

      <form onSubmit={submit} className="relative mt-8 flex flex-col gap-4 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="audit-prenom" className="text-eyebrow uppercase text-on-ink-soft">
              Prénom
            </label>
            <Input
              id="audit-prenom"
              autoComplete="given-name"
              placeholder="Votre prénom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className="border-border-ink bg-white/5 text-on-ink placeholder:text-on-ink-soft"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="audit-email" className="text-eyebrow uppercase text-on-ink-soft">
              Email
            </label>
            <Input
              id="audit-email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={erreur ? true : undefined}
              aria-describedby={erreur ? "audit-erreur" : undefined}
              className="border-border-ink bg-white/5 text-on-ink placeholder:text-on-ink-soft"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="audit-telephone" className="text-eyebrow uppercase text-on-ink-soft">
              Téléphone
            </label>
            <Input
              id="audit-telephone"
              type="tel"
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="border-border-ink bg-white/5 text-on-ink placeholder:text-on-ink-soft"
            />
          </div>
        </div>

        {erreur && (
          <p id="audit-erreur" role="alert" className="text-small text-accent">
            {erreur}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={envoi}
          className="mt-2 w-full bg-paper text-ink hover:bg-accent hover:text-ink sm:mx-auto sm:w-fit"
        >
          {envoi ? "Préparation du rapport…" : "Voir le rapport complet et recevoir le PDF"}
          <Icon icon={ArrowRight} />
        </Button>

        <p className="text-small text-on-ink-soft">
          Vos coordonnées me servent uniquement à vous recontacter au sujet de cette analyse.
          Aucune inscription, aucune revente, aucune relance automatique.
        </p>
      </form>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Après le rapport — renvoi du PDF, partage, page d'accueil                   */
/* -------------------------------------------------------------------------- */

function AprèsRapport({
  url,
  accueil,
  onAnalyserAccueil,
  mobile,
  desktop,
}: {
  url: string
  /** Adresse de la page d'accueil du même site, si la page analysée n'en est pas une. */
  accueil: string | null
  onAnalyserAccueil: () => void
  mobile: AuditReport | null
  desktop: AuditReport | null
}) {
  const [copie, setCopie] = useState(false)
  const [pdf, setPdf] = useState<"pret" | "encours">("pret")

  async function retelecharger() {
    setPdf("encours")
    try {
      const { construireRapport, telechargerRapport } = await import("@/lib/audit-pdf")
      telechargerRapport(construireRapport({ url, prenom: "", mobile, desktop }), url)
    } finally {
      setPdf("pret")
    }
  }

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopie(true)
      setTimeout(() => setCopie(false), 2500)
    } catch {
      /* Presse-papiers refusé : le lien reste dans la barre d'adresse. */
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      <Card padding="md">
        <p className="text-eyebrow uppercase text-text-muted">Garder ce rapport</p>
        <DrawRule className="mt-4" />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" variant="primary" onClick={retelecharger} disabled={pdf === "encours"}>
            <Icon icon={Download} />
            {pdf === "encours" ? "Génération…" : "Télécharger le PDF"}
          </Button>
          <Button type="button" variant="outline" onClick={copierLien}>
            <Icon icon={copie ? Check : Link2} />
            {copie ? "Lien copié" : "Copier le lien de l'analyse"}
          </Button>
        </div>
        <p className="measure mx-auto mt-5 text-small text-text-secondary">
          Le lien relance la même analyse à l&apos;ouverture. Pratique pour l&apos;envoyer à votre
          développeur, votre associé ou votre agence actuelle.
        </p>
      </Card>

      {/*
        Une page interne ne dit pas ce que vaut la vitrine. Quand l'adresse
        analysée n'est pas l'accueil, on propose de le mesurer aussi.
      */}
      {accueil && (
        <Card tone="ivory" padding="md">
          <span className="mx-auto flex size-11 items-center justify-center rounded-md border border-border-strong text-text-secondary">
            <Icon icon={Home} className="size-5" />
          </span>
          <h3 className="mt-5 font-heading text-h3 text-text">
            Et votre page d&apos;accueil ?
          </h3>
          <p className="measure mx-auto mt-3 text-small text-text-secondary">
            Vous avez analysé une page interne. C&apos;est l&apos;accueil qui reçoit le plus de
            visiteurs et qui décide de la première impression : il mérite sa propre mesure.
          </p>
          <div className="mt-6">
            <Button type="button" variant="outline" onClick={onAnalyserAccueil}>
              Analyser {accueil.replace(/^https?:\/\//, "")}
              <Icon icon={ArrowRight} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Envoi des relevés                                                           */
/* -------------------------------------------------------------------------- */

/** Résumé texte d'un rapport, repris tel quel du moteur. */
function resumerRapport(r: AuditReport | null, appareil: string): string {
  if (!r) return `${appareil} — analyse non aboutie.`
  return (
    `${appareil} — note ${r.overall}/100 (mesure brute ${r.overallRaw}/100) | ` +
    `confort visuel ${r.visual.score ?? "?"} ; ` +
    r.categories.map((c) => `${c.label} ${c.score ?? "?"}`).join(" ; ") +
    (r.issues.length
      ? `\n  Points relevés (${r.issues.length}) : ` +
        r.issues.map((i) => `[${i.severity}] ${i.title}`).join(" ; ")
      : "\n  Aucun point majeur relevé.")
  )
}

/**
 * Transmet un relevé à contact@studiodigitalnova.fr via Web3Forms.
 * Renvoie `true` si l'envoi a abouti. Ne lève jamais : un échec réseau ne
 * doit pas interrompre le parcours du visiteur.
 */
async function transmettreReleve(champs: Record<string, string>): Promise<boolean> {
  try {
    const reponse = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: WEB3FORMS_ACCESS_KEY, ...champs }),
    })
    const resultat = await reponse.json()
    return Boolean(resultat?.success)
  } catch {
    return false
  }
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

type Phase = "idle" | "running" | "done" | "error"

function AuditContent() {
  const reduce = Boolean(useReducedMotion())
  const floatIn = useFloatIn()

  const [input, setInput] = useState("")
  const [auditedUrl, setAuditedUrl] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [reports, setReports] = useState<Partial<Record<Strategy, AuditReport>>>({})
  const [strategy, setStrategy] = useState<Strategy>("mobile")
  const [focused, setFocused] = useState(false)
  /*
    Analyses déjà obtenues pendant la visite. Relancer la même adresse ne
    rappelle pas l'API : le résultat s'affiche instantanément. Cela évite de
    consommer le quota pour rien, et supprime l'attente quand quelqu'un
    revient sur une adresse qu'il vient de tester.
  */
  const cache = useRef(new Map<string, Partial<Record<Strategy, AuditReport>>>())
  /*
    État RÉEL de chaque analyse. PageSpeed n'émet aucun signal d'avancement
    pendant qu'il travaille : les deux seuls événements observables sont la
    fin de la requête mobile et celle de la requête ordinateur. Ce sont donc
    les seuls états que l'on affiche comme certains — la barre de progression,
    elle, est annoncée comme une estimation.
  */
  const [tracks, setTracks] = useState<Record<Strategy, TrackState>>({
    mobile: "pending",
    desktop: "pending",
  })
  const [error, setError] = useState<string | null>(null)
  /*
    Le rapport complet n'apparaît qu'une fois les coordonnées laissées. Il se
    reverrouille à chaque nouvelle adresse : une analyse, une fiche.
  */
  const [deverrouille, setDeverrouille] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const available = Boolean(PAGESPEED_KEY)

  /*
    Le cadran suit la progression via une MotionValue ressortée : le tracé
    avance en continu au lieu de sauter à chaque tick de l'estimation.
  */
  const progressMV = useMotionValue(0)
  const smoothProgress = useSpring(progressMV, { stiffness: 55, damping: 20, mass: 0.6 })
  useEffect(() => {
    progressMV.set(progress / 100)
  }, [progress, progressMV])

  /* Progression estimée : l'API ne renvoie rien pendant qu'elle travaille. */
  useEffect(() => {
    if (phase !== "running") return
    const id = setInterval(() => {
      // Plancher réel : chaque analyse terminée vaut 45 points acquis.
      const settled = Object.values(tracks).filter((t) => t === "done" || t === "failed").length
      const floor = settled * 45
      setProgress((p) => Math.max(floor, p >= 92 ? p : p + (92 - p) * 0.045))
      setStepIndex((i) => Math.min(PROGRESS_STEPS.length - 1, i + (Math.random() > 0.7 ? 1 : 0)))
    }, 400)
    return () => clearInterval(id)
  }, [phase, tracks])

  useEffect(() => () => abortRef.current?.abort(), [])

  const start = useCallback(
    async (event?: React.FormEvent, adresseImposee?: string) => {
      event?.preventDefault()
      const url = normalizeUrl(adresseImposee ?? input)
      if (adresseImposee) setInput(adresseImposee)
      if (!url) {
        setError("Cette adresse ne semble pas valide. Exemple : monentreprise.fr")
        setPhase("error")
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setAuditedUrl(url)
      /* Nouvelle adresse : le rapport se reverrouille. */
      setDeverrouille(false)

      /*
        L'adresse est reportée dans l'URL de la page. Le visiteur peut la
        copier et l'envoyer à son développeur ou à son associé : l'analyse
        se relance à l'ouverture, sur la même adresse.
      */
      if (typeof window !== "undefined") {
        const partage = new URL(window.location.href)
        partage.searchParams.set("url", url)
        window.history.replaceState(null, "", partage.toString())
      }

      const dejaVu = cache.current.get(url)
      if (dejaVu) {
        setReports(dejaVu)
        setStrategy(dejaVu.mobile ? "mobile" : "desktop")
        setTracks({
          mobile: dejaVu.mobile ? "done" : "failed",
          desktop: dejaVu.desktop ? "done" : "failed",
        })
        setProgress(100)
        setError(null)
        setPhase("done")
        return
      }

      setReports({})
      setProgress(4)
      setStepIndex(0)
      setError(null)
      setTracks({ mobile: "running", desktop: "running" })
      setPhase("running")

      /*
        Les deux appareils en parallèle. Chaque requête bascule sa propre
        piste dès qu'elle aboutit — c'est la seule progression réellement
        mesurable, et elle n'est pas simulée.
      */
      const track = (device: Strategy) =>
        runAudit(url, device, controller.signal).then(
          (report) => {
            setTracks((current) => ({ ...current, [device]: "done" }))
            return report
          },
          (cause) => {
            setTracks((current) => ({ ...current, [device]: "failed" }))
            throw cause
          }
        )

      const [mobile, desktop] = await Promise.allSettled([track("mobile"), track("desktop")])

      if (controller.signal.aborted) return

      const next: Partial<Record<Strategy, AuditReport>> = {}
      if (mobile.status === "fulfilled") next.mobile = mobile.value
      if (desktop.status === "fulfilled") next.desktop = desktop.value

      if (!next.mobile && !next.desktop) {
        const reason = mobile.status === "rejected" ? mobile.reason : null
        setError(
          reason instanceof AuditError
            ? reason.message
            : "L'analyse n'a pas abouti. Vérifiez l'adresse, ou demandez-moi l'audit détaillé."
        )
        setPhase("error")
        return
      }

      cache.current.set(url, next)
      setReports(next)
      setStrategy(next.mobile ? "mobile" : "desktop")
      setProgress(100)
      setPhase("done")

      /*
        Tout audit abouti est signalé, même si le visiteur ne laisse jamais ses
        coordonnées : savoir quelles entreprises testent leur site a de la
        valeur en soi. L'envoi part en arrière-plan et n'affecte rien à
        l'écran. Le cache empêche le doublon si la même adresse est relancée.
      */
      void transmettreReleve({
        subject: `Audit lancé — ${url}`,
        from_name: "Audit automatique",
        name: "Visiteur anonyme",
        email: siteConfig.author.email,
        site: url,
        message:
          `Un visiteur vient d'analyser ${url}. Aucune coordonnée laissée à ce stade.\n\n` +
          `${resumerRapport(next.mobile ?? null, "MOBILE")}\n\n` +
          `${resumerRapport(next.desktop ?? null, "ORDINATEUR")}`,
      })
    },
    [input]
  )

  function reset() {
    abortRef.current?.abort()
    setTracks({ mobile: "pending", desktop: "pending" })
    setPhase("idle")
    setReports({})
    setError(null)
    setProgress(0)
    setDeverrouille(false)
    if (typeof window !== "undefined") {
      const propre = new URL(window.location.href)
      propre.searchParams.delete("url")
      window.history.replaceState(null, "", propre.toString())
    }
  }

  /*
    Lien partagé : `?url=` relance l'analyse à l'ouverture. Une seule fois,
    et uniquement si la clé est disponible.
  */
  const dejaLance = useRef(false)
  useEffect(() => {
    if (dejaLance.current || !available) return
    const partagee = new URLSearchParams(window.location.search).get("url")
    if (!partagee) return
    dejaLance.current = true
    /*
      Différé d'un tick : lancer l'analyse dans le corps de l'effet
      déclencherait une cascade de rendus au montage. Ici, le premier rendu
      est peint avant que l'analyse ne démarre.
    */
    const id = setTimeout(() => void start(undefined, partagee), 0)
    return () => clearTimeout(id)
  }, [available, start])

  /* Proposition d'analyser aussi la page d'accueil, quand ce n'en est pas une. */
  const accueilDuSite = (() => {
    try {
      const u = new URL(auditedUrl)
      if (u.pathname === "/" && !u.search) return null
      return `${u.origin}/`
    } catch {
      return null
    }
  })()

  const analyserAccueil = useCallback(() => {
    if (accueilDuSite) void start(undefined, accueilDuSite)
  }, [accueilDuSite, start])

  const current = reports[strategy] ?? reports.mobile ?? reports.desktop ?? null
  const hasBoth = Boolean(reports.mobile && reports.desktop)

  return (
    <>
      <PageHero
        eyebrow="Audit gratuit"
        icon={Gauge}
        title={
          <>
            Votre site vous fait-il perdre des{" "}
            <span className="whitespace-nowrap text-[1.15em] italic leading-[0] text-accent">
              clients
            </span>{" "}
            ?
          </>
        }
        lead={
          <>
            Entrez l&apos;adresse de votre site. En moins d&apos;une minute, vous saurez ce que
            Google mesure vraiment : la vitesse, le référencement, l&apos;accessibilité et la
            sécurité.{" "}
            <strong className="font-semibold text-text">Gratuit, sans inscription.</strong>
          </>
        }
        aside={
          <div className="mx-auto flex max-w-3xl flex-col items-center">
          <motion.form
            onSubmit={start}
            className="mt-10 w-full max-w-2xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.32, { y: 30 })}
          >
            <div
              className={cn(
                "relative rounded-xl border bg-surface p-2 shadow-sm",
                "transition-[border-color,box-shadow] duration-500 ease-nova",
                // Halo au focus : indicateur clavier explicite, pas seulement
                // un changement de teinte de bordure.
                focused ? "border-accent/60 shadow-md ring-3 ring-ring/25" : "border-border"
              )}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Icon
                    icon={Search}
                    className={cn(
                      "pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 transition-colors duration-300 ease-nova",
                      focused ? "text-accent" : "text-text-muted"
                    )}
                  />
                  <Input
                    type="text"
                    inputMode="url"
                    aria-label="Adresse de votre site"
                    placeholder="monentreprise.fr"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    disabled={phase === "running"}
                    aria-invalid={phase === "error" ? true : undefined}
                    aria-describedby={phase === "error" ? "audit-url-erreur" : undefined}
                    className="h-13 border-transparent bg-transparent pl-11 text-lead shadow-none focus-visible:border-transparent focus-visible:ring-0"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={phase === "running" || !available}
                  className="h-13 shrink-0"
                >
                  {phase === "running" ? "Analyse en cours…" : "Analyser mon site"}
                  {phase !== "running" && <Icon icon={ArrowRight} />}
                </Button>
              </div>

              {/* Filet qui se trace au focus — le seul mouvement de l'écran. */}
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-x-3 -bottom-px h-px overflow-visible"
                viewBox="0 0 100 1"
                preserveAspectRatio="none"
              >
                <motion.line
                  x1="0"
                  y1="0.5"
                  x2="100"
                  y2="0.5"
                  stroke="var(--color-accent)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  initial={false}
                  animate={{ pathLength: focused ? 1 : 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE_NOVA }}
                />
              </svg>
            </div>

            {/*
              Loyauté : l'adresse saisie m'est transmise, même si le visiteur
              ne laisse pas ses coordonnées. Autant l'écrire sous le champ
              plutôt que de le cacher dans la politique de confidentialité.
            */}
            <p className="mt-4 text-small text-text-muted">
              L&apos;adresse analysée m&apos;est transmise pour que je puisse suivre les demandes.
              Aucune autre donnée n&apos;est collectée tant que vous ne remplissez pas le
              formulaire.
            </p>
          </motion.form>

          {!available && (
            <p className="mt-4 max-w-xl text-small text-text-muted">
              L&apos;analyse automatique est momentanément indisponible. Laissez-moi votre adresse
              plus bas : je lance l&apos;audit de mon côté et vous l&apos;envoie sous 24 h.
            </p>
          )}
          </div>
        }
      />

      {/*
        Ce que l'audit examine — annoncé avant de lancer, pour que le visiteur
        sache ce qu'il va obtenir. Les cinq dimensions sont celles du moteur.
        Le bloc s'efface dès qu'une analyse démarre : il a fait son travail.
      */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            key="dimensions"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: EASE_NOVA }}
          >
            <Section className="bg-surface" spacing="default">
              <div className="mx-auto max-w-5xl">
                <p className="text-center text-eyebrow uppercase text-text-muted">
                  Ce que j&apos;examine
                </p>
                <Heading variant="h2" className="mt-4 text-center">
                  Cinq dimensions, une seule qui décide
                </Heading>

                <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* La dimension dominante, sur toute la largeur. */}
                  <motion.div
                    className="sm:col-span-2"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.25 }}
                    variants={floatIn(0, { y: 40 }, { damping: 26, mass: 2 })}
                  >
                    <Card
                      tone="ink"
                      padding="md"
                      className="grain-ink group relative overflow-hidden lg:p-9"
                    >
                      <div className="relative flex items-center justify-center gap-3">
                        <span className="flex size-11 items-center justify-center rounded-md border border-border-ink text-accent transition-transform duration-500 ease-nova group-hover:-translate-y-0.5">
                          <Icon icon={DIMENSION_PHARE.icon} className="size-5" />
                        </span>
                      </div>
                      <p className="relative mt-5 text-eyebrow uppercase text-accent">
                        {DIMENSION_PHARE.poids}
                      </p>
                      <h2 className="relative mt-3 font-heading text-h2 text-on-ink">
                        {DIMENSION_PHARE.label}
                      </h2>
                      <p className="measure relative mx-auto mt-4 text-body text-on-ink-soft">
                        {DIMENSION_PHARE.meaning}
                      </p>
                    </Card>
                  </motion.div>

                  {DIMENSIONS.map((dimension, index) => (
                    <motion.div
                      key={dimension.id}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.3 }}
                      variants={floatIn(0.08 + index * 0.07, { y: 40 }, { damping: 26, mass: 2 })}
                    >
                      <Card
                        tone="ivory"
                        padding="md"
                        className="group flex h-full flex-col transition-colors duration-500 ease-nova hover:border-border-strong"
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex-1 text-left text-eyebrow uppercase text-text-muted">
                            {dimension.poids}
                          </span>
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-md group-hover:-translate-y-0.5",
                              dimension.chip
                            )}
                          >
                            <Icon icon={dimension.icon} className="size-4" />
                          </span>
                        </div>
                        <h2 className="mt-5 font-heading text-h3 text-text">{dimension.label}</h2>
                        <p className="mt-2 text-small text-text-secondary">{dimension.meaning}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Déroulé de l'analyse, résultat ou erreur */}
      <Section className="bg-surface" spacing="default">
        <div className="mx-auto max-w-3xl">
          {/*
            Pas de `mode="wait"` ici : il attendrait la fin de l'animation de
            sortie avant de monter l'écran suivant. Or l'analyse dure une
            trentaine de secondes — le visiteur change souvent d'onglet, et un
            onglet en arrière-plan suspend `requestAnimationFrame`. L'animation
            de sortie ne se terminerait jamais et l'écran resterait bloqué sur
            « analyse en cours ». Les écrans se croisent donc directement.
          */}
          <AnimatePresence>
            {phase === "running" && (
              <motion.div
                key="running"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_NOVA }}
              >
                <Card
                  tone="ink"
                  padding="md"
                  role="status"
                  aria-live="polite"
                  className="grain-ink relative overflow-hidden lg:p-9"
                >
                  <div className="relative flex items-center justify-center gap-3">
                    <Badge variant="ink">Analyse en cours</Badge>
                    <NovaMark aria-hidden className="size-2.5 text-accent" />
                  </div>

                  <div className="relative mt-8 flex flex-col gap-9 sm:flex-row sm:items-center sm:gap-10">
                    {/* Cadran de progression — estimation, annoncée comme telle. */}
                    <div className="relative flex size-32 shrink-0 items-center justify-center">
                      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="var(--color-border-ink)"
                          strokeWidth={1.5}
                        />
                        <motion.circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          style={{ pathLength: smoothProgress }}
                        />
                      </svg>
                      <span className="absolute font-heading text-h2 tabular-nums text-on-ink">
                        {Math.round(progress)}
                        <span className="text-h3 text-on-ink-soft">%</span>
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-eyebrow uppercase text-on-ink-soft">Analyse de {auditedUrl}</p>

                      <AnimatePresence mode="popLayout">
                        <motion.p
                          key={stepIndex}
                          className="mt-3 font-heading text-h3 text-on-ink"
                          initial={reduce ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduce ? undefined : { opacity: 0, y: -6 }}
                          transition={{ duration: 0.25, ease: EASE_NOVA }}
                        >
                          {PROGRESS_STEPS[stepIndex]}
                        </motion.p>
                      </AnimatePresence>

                      {/*
                        Les deux seuls états certains : chaque appareil bascule
                        quand sa requête aboutit réellement.
                      */}
                      <ul className="card-list mt-7 flex flex-col gap-3">
                        {TRACKS.map((item) => {
                          const state = tracks[item.id]
                          return (
                            <li key={item.id} className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-500 ease-nova",
                                  state === "done" && "border-accent bg-accent text-ink",
                                  state === "failed" && "border-error text-error",
                                  state === "running" && "border-accent/50 text-accent",
                                  state === "pending" && "border-border-ink text-on-ink-soft"
                                )}
                              >
                                {state === "done" ? (
                                  <Icon icon={Check} className="size-3" />
                                ) : state === "failed" ? (
                                  <Icon icon={CircleAlert} className="size-3" />
                                ) : state === "running" && !reduce ? (
                                  <motion.span
                                    className="size-1.5 rounded-full bg-accent"
                                    animate={{ opacity: [1, 0.25, 1] }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: EASE_NOVA }}
                                  />
                                ) : (
                                  <span className="size-1.5 rounded-full bg-current opacity-40" />
                                )}
                              </span>
                              <span
                                className={cn(
                                  "flex items-center gap-2 text-small transition-colors duration-500 ease-nova",
                                  state === "pending" ? "text-on-ink-soft" : "text-on-ink"
                                )}
                              >
                                <Icon icon={item.icon} className="size-3.5" />
                                {item.label}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>

                  <p className="relative mt-8 border-t border-border-ink pt-5 text-small text-on-ink-soft">
                    Google charge réellement votre page sur un appareil de test. Comptez une
                    trentaine de secondes — c&apos;est le prix d&apos;une mesure honnête.
                  </p>
                </Card>
              </motion.div>
            )}

            {phase === "error" && (
              <motion.div
                key="error"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_NOVA }}
              >
                <Card padding="md" className="flex flex-col items-start gap-5 text-left sm:flex-row">
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", CHIP.terracotta)}>
                    <Icon icon={CircleAlert} className="size-4" />
                  </span>
                  <div className="flex-1">
                    <h2 className="font-heading text-h3 text-text">L&apos;analyse n&apos;a pas abouti</h2>
                    <p id="audit-url-erreur" role="alert" className="mt-2 text-small text-text-secondary">
                      {error}
                    </p>
                    <Button type="button" variant="outline" onClick={reset} className="mt-5 h-11">
                      <Icon icon={RotateCcw} />
                      Réessayer
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {phase === "done" && current && (
              <motion.div
                key="done"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_NOVA }}
              >
                <ReportView
                  report={current}
                  other={hasBoth ? (reports[strategy === "mobile" ? "desktop" : "mobile"] ?? null) : null}
                  strategy={strategy}
                  onStrategy={setStrategy}
                  reduce={reduce}
                  deverrouille={deverrouille}
                  gate={
                    <LeadForm
                      url={auditedUrl}
                      mobile={reports.mobile ?? null}
                      desktop={reports.desktop ?? null}
                      onDeverrouille={() => setDeverrouille(true)}
                    />
                  }
                />

                {deverrouille && (
                  <AprèsRapport
                    url={auditedUrl}
                    accueil={accueilDuSite}
                    onAnalyserAccueil={analyserAccueil}
                    mobile={reports.mobile ?? null}
                    desktop={reports.desktop ?? null}
                  />
                )}

                <div className="mt-6 flex justify-center">
                  <Button type="button" variant="outline" onClick={reset} className="h-11">
                    <Icon icon={RotateCcw} />
                    Analyser une autre adresse
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Section>

      {/* Comment ça marche */}
      <Section spacing="default">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-eyebrow uppercase text-text-muted">Comment ça marche</p>
          <Heading variant="h2" className="mt-4 text-center">
            Trois minutes, trois étapes
          </Heading>
          <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-5 md:grid-cols-3">
            {ETAPES.map((etape, index) => (
              <motion.div
                key={etape.titre}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={floatIn(index * 0.08, { y: 40 }, { damping: 26, mass: 2 })}
              >
                <Card tone="ivory" padding="md" className="group flex h-full flex-col">
                  <CardIndex value={String(index + 1).padStart(2, "0")} />
                  <span
                    className={cn(
                      "mx-auto mt-6 flex size-11 items-center justify-center rounded-md",
                      etape.chip
                    )}
                  >
                    <Icon icon={etape.icon} className="size-5" />
                  </span>
                  <h3 className="mt-5 font-heading text-h3 text-text">{etape.titre}</h3>
                  <p className="mt-3 text-small text-text-secondary">{etape.texte}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Le barème, annoncé avant même l'analyse */}
      <Section className="bg-surface" spacing="default">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-eyebrow uppercase text-text-muted">Ma notation</p>
          <Heading variant="h2" className="mt-4 text-center">
            Pourquoi ma note est plus basse que celle de Google
          </Heading>
          <p className="measure mx-auto mt-6 text-center text-lead text-text-secondary">
            Parce que Google note la conformité technique, et moi{" "}
            <strong className="font-semibold text-text">un site livrable</strong>. La mesure est la
            même — c&apos;est l&apos;exigence qui change. Le barème est public, le voici.
          </p>

          <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card padding="md">
              <p className="text-eyebrow uppercase text-text-muted">La pondération</p>
              <DrawRule className="mt-4" />
              <ul className="card-list mt-6 flex flex-col gap-3">
                {PONDERATION.map((part) => (
                  <li key={part.label} className="flex items-baseline gap-3 text-small text-text-secondary">
                    <span className="w-10 shrink-0 text-right font-heading tabular-nums text-accent-strong">
                      {part.poids} %
                    </span>
                    {part.label}
                  </li>
                ))}
              </ul>
              <p className="measure mx-auto mt-6 text-small text-text-muted">
                Le confort visuel domine parce que c&apos;est ce qui décide un visiteur avant
                qu&apos;il ait lu une ligne.
              </p>
            </Card>

            <Card padding="md">
              <p className="text-eyebrow uppercase text-text-muted">Le barème</p>
              <DrawRule className="mt-4" />
              <ul className="card-list mt-6 flex flex-col gap-2">
                {[...BAREME].reverse().map((palier) => (
                  <li
                    key={palier.brut}
                    className="flex items-baseline gap-4 text-small tabular-nums text-text-secondary"
                  >
                    <span className="w-24 shrink-0">Mesure {palier.brut}</span>
                    <Icon icon={ArrowRight} className="size-3 shrink-0 text-accent" />
                    <span className="font-heading text-text">note {palier.note}</span>
                  </li>
                ))}
              </ul>
              <p className="measure mx-auto mt-6 text-small text-text-muted">
                Croissant : un meilleur site obtient toujours une meilleure note. Vous pouvez
                recouper la mesure brute sur pagespeed.web.dev.
              </p>
            </Card>
          </div>
        </div>
      </Section>

      {/* Ce que je retrouve le plus souvent */}
      <Section spacing="default">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-eyebrow uppercase text-text-muted">Sur le terrain</p>
          <Heading variant="h2" className="mt-4 text-center">
            Ce que je retrouve le plus souvent
          </Heading>
          <p className="measure mx-auto mt-6 text-center text-lead text-text-secondary">
            Quatre défauts reviennent presque systématiquement sur les sites de TPE. Chacun est
            détecté par l&apos;analyse ci-dessus.
          </p>
          <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-5 sm:grid-cols-2">
            {DEFAUTS_COURANTS.map((defaut, index) => (
              <motion.div
                key={defaut.titre}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={floatIn(index * 0.06, { y: 40 }, { damping: 26, mass: 2 })}
              >
                <Card padding="md" className="flex h-full flex-col">
                  <CardIndex value={String(index + 1).padStart(2, "0")} />
                  <h3 className="mt-5 font-heading text-h3 text-text">{defaut.titre}</h3>
                  <p className="mt-3 text-small text-text-secondary">{defaut.effet}</p>
                  <DrawRule className="mt-6" />
                  <p className="mt-5 text-small text-text">
                    <span className="text-eyebrow uppercase text-accent-strong">Ce que je fais</span>
                    <br />
                    <span className="text-text-secondary">{defaut.remede}</span>
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Ce que l'outil ne fait pas */}
      <Section className="bg-surface" spacing="default">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-eyebrow uppercase text-text-muted">Les limites</p>
          <Heading variant="h2" className="mt-4 text-center">
            Ce que l&apos;outil mesure, et ce qu&apos;il ne verra jamais
          </Heading>
          <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card tone="ivory" padding="md" className="flex h-full flex-col">
              <span className={cn("mx-auto flex size-11 items-center justify-center rounded-md", CHIP.sage)}>
                <Icon icon={Check} className="size-5" />
              </span>
              <h3 className="mt-5 font-heading text-h3 text-text">L&apos;analyse automatique</h3>
              <p className="mt-3 text-small text-text-secondary">
                Gratuite, immédiate, sur une page.
              </p>
              <DrawRule className="mt-6" />
              <ul className="card-list mt-6 flex flex-col gap-3">
                {[
                  "Vitesse réelle de chargement",
                  "Confort visuel mesurable",
                  "Bases techniques du référencement",
                  "Accessibilité et bonnes pratiques",
                  "Rapport PDF à conserver",
                ].map((point) => (
                  <li key={point} className="flex items-baseline gap-3 text-small text-text-secondary">
                    <Icon icon={Check} className="size-3 shrink-0 translate-y-0.5 text-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            </Card>

            <Card tone="ink" padding="md" className="grain-ink relative flex h-full flex-col overflow-hidden">
              <span className="relative mx-auto flex size-11 items-center justify-center rounded-md border border-border-ink text-accent">
                <Icon icon={Eye} className="size-5" />
              </span>
              <h3 className="relative mt-5 font-heading text-h3 text-on-ink">
                Ce que la machine ne voit pas
              </h3>
              <p className="relative mt-3 text-small text-on-ink-soft">
                Aucun outil ne mesure ces points-là. Il faut les lire soi-même.
              </p>
              <DrawRule className="relative mt-6" tone="ink" />
              <ul className="card-list relative mt-6 flex flex-col gap-3">
                {[
                  "Si votre offre se comprend en dix secondes",
                  "Si vos textes parlent à vos clients",
                  "Si le parcours mène vraiment à vous contacter",
                  "Ce que font vos concurrents, et mieux",
                  "L'ensemble de vos pages, pas une seule",
                ].map((point) => (
                  <li key={point} className="flex items-baseline gap-3 text-small text-on-ink-soft">
                    <Icon icon={ArrowRight} className="size-3 shrink-0 translate-y-0.5 text-accent" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="relative mt-8">
                <Link href="/#contact" className="group/cta">
                  <Button variant="primary" className="bg-paper text-ink hover:bg-accent hover:text-ink">
                    Demander un regard humain
                    <Icon
                      icon={ArrowRight}
                      className="transition-transform duration-200 ease-nova group-hover/cta:translate-x-0.5"
                    />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* Questions sur l'audit */}
      <Section spacing="default">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-eyebrow uppercase text-text-muted">Questions fréquentes</p>
          <Heading variant="h2" className="mt-4 text-center">
            Ce qu&apos;on me demande avant de lancer l&apos;analyse
          </Heading>
          <div className="mt-[var(--section-gap)] flex flex-col gap-3">
            {QUESTIONS_AUDIT.map((item, index) => (
              <motion.div
                key={item.question}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={floatIn(index * 0.05, { y: 30 }, { damping: 26, mass: 2 })}
              >
                <Card padding="md">
                  <h3 className="font-heading text-h3 text-text">{item.question}</h3>
                  <p className="measure mx-auto mt-3 text-body text-text-secondary">{item.reponse}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Ce que ça dit de mon travail */}
      <Section className="bg-surface" spacing="default">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Heading variant="h2">Et si on repartait sur des bases saines ?</Heading>
          <p className="measure mt-6 text-lead text-text-secondary">
            Les points que cet outil relève, je les traite tous les jours : vitesse, référencement
            technique, lisibilité, mobile. Que ce soit pour{" "}
            <strong className="font-semibold text-text">corriger l&apos;existant</strong> ou pour{" "}
            <strong className="font-semibold text-text">repartir de zéro</strong>, on en parle sans
            engagement.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link href="/#tarifs" className="group">
              <Button variant="outline">
                Voir les tarifs
                <Icon
                  icon={ArrowRight}
                  className="transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
                />
              </Button>
            </Link>
            <Link href="/#contact" className="group">
              <Button variant="primary">
                <Icon icon={Mail} />
                Parlons de votre projet
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}

export { AuditContent }
