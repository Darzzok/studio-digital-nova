"use client"

import { Fragment, cloneElement, isValidElement, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowLeft,
  Check,
  CirclePlus,
  ClipboardList,
  Clock,
  Crown,
  Gift,
  Globe,
  HeartHandshake,
  MessageSquare,
  Palette,
  Rocket,
  RotateCcw,
  Search,
  Send,
  Server,
  Sparkles,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Frieze } from "@/components/ui/frieze"
import { CHIP, CardIndex } from "@/components/ui/nova"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import { EASE_NOVA, useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------------ */
/* Contenu du configurateur — modifiable ici sans toucher à la logique.      */
/* ------------------------------------------------------------------------ */

const STEP_LABELS = ["Formule", "Besoins", "Coordonnées", "Projet"]

/*
  Une icône par étape plutôt qu'un rang chiffré : sur un rail de quatre
  pastilles, un pictogramme se reconnaît d'un coup d'œil là où « 3 » demande
  de recompter. Le rang reste annoncé aux lecteurs d'écran par `labelPrefix`.
*/
const STEP_ICONS = [Sparkles, ClipboardList, UserRound, MessageSquare]

const FRIEZE_STEPS = STEP_LABELS.map((label, i) => ({
  key: label,
  label,
  icon: STEP_ICONS[i],
}))

const PROGRESS_MESSAGES = [
  "Plus que 3 étapes avant votre proposition.",
  "Votre projet prend forme.",
  "Nous y sommes presque.",
  "Dernière étape avant le lancement.",
]

const STEP_CONTENT = [
  { title: "Choisissons la formule idéale.", subtitle: "Sélectionnez l'offre la plus adaptée à votre projet." },
  { title: "Définissons vos besoins.", subtitle: "Aidez-moi à mieux comprendre votre projet." },
  { title: "Faisons connaissance.", subtitle: "Quelques informations pour pouvoir vous recontacter." },
  { title: "Parlez-moi de votre projet.", subtitle: "Décrivez votre projet en quelques lignes." },
]

/*
  Portée et contenu repris tels quels de la grille publique affichée dans la
  section Tarifs. Une carte qui n'annonce qu'un nom et un prix ne permet pas
  de choisir : il faut savoir ce qu'on prend.
*/
const OFFERS = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: "690 €",
    scope: "One page",
    resume: "Une page optimisée, design personnalisé, livraison en 5 jours.",
    icon: Rocket,
    className: CHIP.mineral,
  },
  {
    id: "pro",
    name: "Pro",
    price: "990 €",
    scope: "Site vitrine",
    resume: "Jusqu'à 5 pages, optimisation SEO incluse, livraison en 10 jours.",
    icon: Sparkles,
    badge: "Le plus choisi",
    className: CHIP.terracotta,
  },
  {
    id: "premium",
    name: "Premium",
    /* Espaces insécables : « 1 200 € » restait coupé, le « 1 » seul sur sa ligne. */
    price: "À partir de 1 200 €",
    scope: "Sur mesure",
    resume: "Fonctionnalités sur mesure, accompagnement dédié, optimisation avancée.",
    icon: Crown,
    className: CHIP.ink,
  },
] as const

const NEEDS = [
  { id: "has-site", label: "Je possède déjà un site", icon: Globe, className: CHIP.ink },
  { id: "no-site", label: "Je n'ai pas encore de site", icon: CirclePlus, className: CHIP.mineral },
  { id: "logo", label: "J'ai besoin d'un logo", icon: Palette, className: CHIP.terracotta },
  { id: "hosting", label: "J'ai besoin d'un hébergement", icon: Server, className: CHIP.ochre },
  { id: "seo", label: "Je souhaite améliorer mon référencement", icon: Search, className: CHIP.ochre },
  { id: "support", label: "Je souhaite un accompagnement", icon: HeartHandshake, className: CHIP.sage },
] as const

const TRACKING_STEPS = [
  { label: "Projet reçu", icon: Check },
  { label: "Analyse de votre projet", icon: Search },
  { label: "Préparation de votre proposition", icon: ClipboardList },
  { label: "Réponse sous 24 h", icon: Send },
]

const BENEFITS = [
  {
    icon: Clock,
    className: CHIP.ink,
    title: "Réponse sous 24h",
    description: (
      <>
        Je reviens vers vous rapidement, <strong className="font-semibold text-text">sans attente</strong>.
      </>
    ),
  },
  {
    icon: Gift,
    className: CHIP.terracotta,
    title: "Devis gratuit",
    description: (
      <>
        Une estimation claire, <strong className="font-semibold text-text">sans engagement</strong>.
      </>
    ),
  },
  {
    icon: Rocket,
    className: CHIP.mineral,
    title: "Site livré rapidement",
    description: (
      <>
        <strong className="font-semibold text-text">Des délais courts</strong>, annoncés dès le
        départ.
      </>
    ),
  },
]

const STORAGE_KEY = "sdn-configurator-v1"

const WEB3FORMS_ACCESS_KEY = "37757408-4a45-44eb-afc1-20d7ae50d224"
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit"

/* ------------------------------------------------------------------------ */
/* Types et helpers                                                         */
/* ------------------------------------------------------------------------ */

type OfferId = (typeof OFFERS)[number]["id"]
type NeedId = (typeof NEEDS)[number]["id"]

type ConfiguratorData = {
  offer: OfferId | null
  needs: NeedId[]
  name: string
  company: string
  email: string
  phone: string
  description: string
  timeline: string
}

const EMPTY_DATA: ConfiguratorData = {
  offer: null,
  needs: [],
  name: "",
  company: "",
  email: "",
  phone: "",
  description: "",
  timeline: "",
}

type PersistedState = ConfiguratorData & { step: number; maxStep: number }

function offerLabel(id: OfferId | null) {
  return OFFERS.find((o) => o.id === id)?.name ?? null
}

function needLabels(ids: NeedId[]) {
  return NEEDS.filter((n) => ids.includes(n.id)).map((n) => n.label)
}

/* ------------------------------------------------------------------------ */
/* Sous-composants                                                          */
/* ------------------------------------------------------------------------ */

function FormField({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 transition-transform duration-150 ease-nova focus-within:scale-[1.01]",
        className
      )}
    >
      <label htmlFor={htmlFor} className="text-eyebrow uppercase text-text-secondary">
        {label}
      </label>
      {/*
        Le message d'erreur est rattaché au champ : `aria-invalid` signale
        l'état, `aria-describedby` fait lire le motif. Sans ça, un lecteur
        d'écran annonce un champ valide alors qu'il est en erreur.
        `role="alert"` fait annoncer le message dès son apparition.
      */}
      {isValidElement<{ "aria-invalid"?: boolean; "aria-describedby"?: string }>(children)
        ? cloneElement(children, {
            "aria-invalid": error ? true : undefined,
            "aria-describedby": error ? `${htmlFor}-erreur` : undefined,
          })
        : children}
      {error && (
        <p id={`${htmlFor}-erreur`} role="alert" className="text-small text-error">
          {error}
        </p>
      )}
    </div>
  )
}

/** La frise de progression — même composant que la section Processus. */
function ProgressFrieze({
  step,
  maxStep,
  onJump,
  reduce,
}: {
  step: number
  maxStep: number
  onJump: (index: number) => void
  reduce: boolean
}) {
  /*
    « Étape 1 sur 4 » vaut un quart, pas zéro : mesurée sur les intervalles,
    la barre restait vide à la première étape et donnait l'impression que rien
    n'avait commencé.
  */
  const avancement = Math.round(((step + 1) / STEP_LABELS.length) * 100)

  return (
    <div>
      {/*
        La frise repose sur un fond creusé et arrondi : posée à nu sur la carte,
        elle flottait au-dessus du formulaire sans lui appartenir. Le cadre en
        fait un bandeau de progression, et la barre fine du bas donne la mesure
        d'un coup d'œil.
      */}
      <div className="rounded-xl bg-surface-sunken p-4 sm:p-5">
        <Frieze
          id="configurateur"
          steps={FRIEZE_STEPS}
          activeIndex={step}
          reachableIndex={maxStep}
          onSelect={onJump}
          labelPrefix="Étape"
        />

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-ink"
            initial={false}
            animate={{ width: `${avancement}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.45, ease: EASE_NOVA }}
          />
        </div>

        {/* Sous 640 px, seule l'étape en cours est nommée : quatre intitulés n'y tiennent pas. */}
        <p className="mt-3 text-center text-eyebrow uppercase text-text sm:hidden">
          {STEP_LABELS[step]}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: 6 }}
          transition={{ duration: 0.3, ease: EASE_NOVA }}
          className="mt-5 text-center text-small text-text-secondary"
        >
          {/* Le rang chiffré d'abord : « où j'en suis » avant « ce qui reste ». */}
          <span className="font-heading text-text">
            Étape {step + 1} sur {STEP_LABELS.length}
          </span>{" "}
          — {PROGRESS_MESSAGES[step]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

function StepBlock({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <Heading variant="h3">{title}</Heading>
        <p className="mt-2 text-body text-text-secondary">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

/*
  Les cartes d'offre. Sur téléphone elles se lisent en ligne — pastille,
  intitulé, prix — parce qu'empilées en colonne elles occupaient chacune un
  tiers d'écran pour trois mots. À partir de 640 px elles reprennent leur
  disposition verticale, en trois colonnes.

  Le filet terracotta posé sur le bord haut de la carte choisie a disparu : la
  sélection se lit à la bordure encre, au fond teinté et à la pastille cochée,
  qui glisse d'une carte à l'autre.
*/
function StepOffer({
  value,
  onSelect,
  reduce,
}: {
  value: OfferId | null
  onSelect: (id: OfferId) => void
  reduce: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {OFFERS.map((offer) => {
        const selected = value === offer.id
        return (
          <button
            key={offer.id}
            type="button"
            onClick={() => onSelect(offer.id)}
            aria-pressed={selected}
            className="group block w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
          >
            <Card
              padding="none"
              interactive
              className={cn(
                "relative flex h-full items-center gap-4 p-4 text-left",
                "sm:flex-col sm:items-center sm:gap-3 sm:p-6 sm:pt-7 sm:text-center",
                selected ? "border-ink bg-secondary shadow-md" : "border-border"
              )}
            >
              {/* La bague de sélection glisse d'une carte à l'autre. */}
              {selected && !reduce && (
                <motion.span
                  layoutId="devis-offre-choisie"
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-xl border-2 border-ink"
                  transition={{ duration: 0.34, ease: EASE_NOVA }}
                />
              )}

              <span
                className={cn(
                  "relative flex size-11 shrink-0 items-center justify-center rounded-md transition-transform duration-300 ease-nova group-hover:-translate-y-0.5",
                  selected ? "border border-ink bg-ink text-paper" : offer.className
                )}
              >
                <Icon icon={offer.icon} className="size-5" />
              </span>

              {/*
                Le prix vit DANS le bloc de texte, et non dans une colonne à
                droite : « À partir de 1 200 € » ne rentrait pas à côté de
                « Premium » sur un écran de 375 px, et les deux se marchaient
                dessus. Ici, il passe simplement à la ligne.
              */}
              <div className="relative min-w-0 flex-1 sm:w-full sm:flex-none">
                {"badge" in offer && offer.badge && (
                  <span className="mb-1.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-ink">
                    <Icon icon={Sparkles} className="size-2.5" />
                    {offer.badge}
                  </span>
                )}
                <p className="font-heading text-h3 leading-none text-text">{offer.name}</p>
                <p className="mt-1.5 text-eyebrow uppercase text-text-muted">{offer.scope}</p>
                {/* Le détail n'a la place de respirer qu'à partir de 640 px. */}
                <p className="mt-2.5 hidden text-small text-text-secondary sm:block">{offer.resume}</p>
                <p className="mt-2 font-heading text-body text-text sm:mt-3">{offer.price}</p>
              </div>

              <div className="relative flex shrink-0 items-center sm:absolute sm:right-4 sm:top-4">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ease-nova",
                    selected
                      ? "border-ink bg-ink text-paper"
                      : "border-border-strong text-transparent group-hover:border-ink"
                  )}
                >
                  <AnimatePresence initial={false}>
                    {selected && (
                      <motion.span
                        key="coche"
                        initial={reduce ? false : { scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={reduce ? undefined : { scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 20 }}
                      >
                        <Icon icon={Check} className="size-3.5" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </div>
            </Card>
          </button>
        )
      })}
    </div>
  )
}

/*
  Les besoins : cases à cocher déguisées. Deux colonnes dès 640 px, une seule
  en dessous, et une zone tactile qui couvre toute la ligne.
*/
function StepNeeds({
  value,
  onToggle,
  reduce,
}: {
  value: NeedId[]
  onToggle: (id: NeedId) => void
  reduce: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {NEEDS.map((need) => {
        const selected = value.includes(need.id)
        return (
          <button
            key={need.id}
            type="button"
            onClick={() => onToggle(need.id)}
            aria-pressed={selected}
            className="group rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
          >
            <Card
              padding="none"
              interactive
              className={cn(
                "flex h-full items-center gap-3 p-4 text-left",
                selected ? "border-ink bg-secondary" : "border-border"
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md transition-transform duration-300 ease-nova group-hover:-translate-y-0.5",
                  selected ? "border border-ink bg-ink text-paper" : need.className
                )}
              >
                <Icon icon={need.icon} className="size-4" />
              </span>
              <p className="flex-1 text-small font-medium text-text">{need.label}</p>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ease-nova",
                  selected
                    ? "border-ink bg-ink text-paper"
                    : "border-border-strong group-hover:border-ink"
                )}
              >
                <AnimatePresence initial={false}>
                  {selected && (
                    <motion.span
                      key="coche"
                      initial={reduce ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={reduce ? undefined : { scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 20 }}
                    >
                      <Icon icon={Check} className="size-3" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </Card>
          </button>
        )
      })}
    </div>
  )
}

function SummaryContent({ data }: { data: ConfiguratorData }) {
  const rows = [
    { label: "Offre", value: offerLabel(data.offer) },
    { label: "Besoins", value: needLabels(data.needs).join(", ") || null },
    { label: "Nom", value: data.name || null },
    { label: "Email", value: data.email || null },
    { label: "Téléphone", value: data.phone || null },
    { label: "Délai", value: data.timeline || null },
  ].filter((row) => row.value)

  if (rows.length === 0) {
    return (
      <p className="text-small text-text-secondary">
        Vos réponses apparaîtront ici au fil de votre progression.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5">
          <span className="text-eyebrow uppercase text-text-muted">{row.label}</span>
          <span className="text-small font-medium text-text">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function ResumePrompt({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border border-border text-accent">
        <Icon icon={RotateCcw} className="size-5" />
      </span>
      <div>
        <Heading variant="h3">Reprendre votre projet ?</Heading>
        <p className="mt-2 text-body text-text-secondary">
          Nous avons trouvé une progression enregistrée. Voulez-vous continuer là où vous vous
          étiez arrêté ?
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Button type="button" variant="primary" className="flex-1" onClick={onResume}>
          Reprendre
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={onRestart}>
          Recommencer
        </Button>
      </div>
    </div>
  )
}

function Confirmation({ data, reduce }: { data: ConfiguratorData; reduce: boolean }) {
  const rows = [
    { label: "Offre choisie", value: offerLabel(data.offer) ?? "—" },
    { label: "Besoins sélectionnés", value: needLabels(data.needs).join(", ") || "—" },
    { label: "Nom", value: data.name || "—" },
    { label: "Email", value: data.email || "—" },
    { label: "Téléphone", value: data.phone || "—" },
    { label: "Délai souhaité", value: data.timeline || "—" },
  ]

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <motion.span
        initial={reduce ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        className="flex size-16 items-center justify-center rounded-full border border-border text-3xl"
        style={{ backgroundImage: "var(--gradient-ink)" }}
      >
        🎉
      </motion.span>

      <div>
        <Heading variant="h3">Votre projet est officiellement lancé !</Heading>
        <p className="mt-3 text-body text-text-secondary">
          Merci pour votre confiance. J&apos;ai bien reçu toutes les informations concernant votre
          projet. Je vais maintenant analyser votre demande afin de préparer une proposition
          entièrement adaptée à vos besoins. Vous recevrez une réponse personnalisée sous 24
          heures.
        </p>
      </div>

      <div className="w-full">
        <div className="flex items-center">
          {TRACKING_STEPS.map((item, index) => (
            <Fragment key={item.label}>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full border",
                  index === 0
                    ? "border-ink bg-ink text-paper"
                    : "border-border-strong bg-surface text-text-muted"
                )}
              >
                <Icon icon={item.icon} className="size-4" />
              </span>
              {index < TRACKING_STEPS.length - 1 && (
                <div className="mx-1.5 h-px flex-1 bg-border sm:mx-2" />
              )}
            </Fragment>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {TRACKING_STEPS.map((item) => (
            <span key={item.label} className="text-center text-[10px] uppercase leading-tight tracking-[0.12em] text-text-muted">
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full rounded-md border border-border bg-background p-5 text-left">
        <p className="mb-3 text-eyebrow uppercase text-text-muted">Récapitulatif</p>
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-small">
              <span className="text-text-secondary">{row.label}</span>
              <span className="font-medium text-text">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Link href="/" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            <Icon icon={ArrowLeft} className="size-4" />
            Retour à l&apos;accueil
          </Button>
        </Link>
        <Link href="/#services" className="flex-1">
          <Button type="button" variant="primary" className="w-full">
            Découvrir mes services
          </Button>
        </Link>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Section principale                                                       */
/* ------------------------------------------------------------------------ */

/** Relit le brouillon éventuel. Retourne `null` si rien d'exploitable. */
function readStoredDraft(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed.offer || parsed.needs?.length || parsed.name) return parsed
    return null
  } catch {
    // localStorage indisponible — on ignore silencieusement.
    return null
  }
}

function Contact() {
  const reduce = Boolean(useReducedMotion())
  const floatIn = useFloatIn()

  /*
    Savoir si l'on est côté navigateur, sans provoquer de rendu en cascade :
    `useSyncExternalStore` renvoie `false` au rendu serveur et `true` dès
    l'hydratation. C'est le remplaçant propre du `setState` dans un effet,
    que React 19 signale désormais comme une erreur.
  */
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  /* Brouillon éventuellement laissé lors d'une visite précédente. */
  const stored = useMemo(() => (hydrated ? readStoredDraft() : null), [hydrated])
  const [resumeDismissed, setResumeDismissed] = useState(false)
  const [savedPayload, setSavedPayload] = useState<PersistedState | null>(null)
  const draft = savedPayload ?? stored
  const showResume = Boolean(draft) && !resumeDismissed

  const [data, setData] = useState<ConfiguratorData>(EMPTY_DATA)
  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    if (!hydrated || submitted || showResume) return
    try {
      const payload: PersistedState = { ...data, step, maxStep }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // localStorage indisponible — on ignore silencieusement.
    }
  }, [data, step, maxStep, hydrated, submitted, showResume])

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
    setMaxStep((m) => Math.max(m, next))
  }

  function selectOffer(id: OfferId) {
    setData((d) => ({ ...d, offer: id }))
    window.setTimeout(() => goTo(1), 300)
  }

  function toggleNeed(id: NeedId) {
    setData((d) => ({
      ...d,
      needs: d.needs.includes(id) ? d.needs.filter((n) => n !== id) : [...d.needs, id],
    }))
  }

  function validateContact() {
    const next: Record<string, string> = {}
    if (data.name.trim().length < 2) next.name = "Merci d'indiquer votre nom."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email = "Adresse email invalide."
    if (data.phone.trim() !== "" && !/^[+\d][\d\s.-]{7,19}$/.test(data.phone.trim())) {
      next.phone = "Numéro de téléphone invalide."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function validateProject() {
    const next: Record<string, string> = {}
    if (data.description.trim().length < 10) next.description = "Décrivez votre projet en quelques mots."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleContinueContact() {
    if (validateContact()) goTo(3)
  }

  async function handleSubmitProject() {
    if (!validateProject()) return
    setSending(true)
    setSendError(null)

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: "Nouvelle demande de devis — Studio Digital Nova",
          from_name: data.name,
          name: data.name,
          email: data.email,
          phone: data.phone || "Non renseigné",
          company: data.company || "Non renseignée",
          offer: offerLabel(data.offer) ?? "Non renseignée",
          needs: needLabels(data.needs).join(", ") || "Aucun",
          timeline: data.timeline || "Non renseigné",
          message: data.description,
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message ?? "Échec de l'envoi.")

      setSubmitted(true)
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // localStorage indisponible — on ignore silencieusement.
      }
    } catch {
      setSendError(
        "Une erreur est survenue lors de l'envoi. Merci de réessayer, ou contactez-moi directement à contact@studiodigitalnova.fr."
      )
    } finally {
      setSending(false)
    }
  }

  function handleResume() {
    if (!draft) return
    const { step: savedStep, maxStep: savedMax, ...rest } = draft
    setData(rest)
    setStep(savedStep ?? 0)
    setMaxStep(savedMax ?? savedStep ?? 0)
    setResumeDismissed(true)
  }

  function handleRestart() {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage indisponible — on ignore silencieusement.
    }
    setSavedPayload(null)
    setResumeDismissed(true)
  }

  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: reduce ? 0 : dir >= 0 ? 24 : -24 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: reduce ? 0 : dir >= 0 ? -24 : 24 }),
  }

  return (
    <Section id="contact" className="scroll-mt-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
        <motion.div
          className="mb-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -40, scale: 0.85 })}
        >
          <Badge variant="outline">
            <Icon icon={MessageSquare} className="size-3.5 text-accent" />
            Contact
          </Badge>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.12, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h2">🚀 Construisons votre projet</Heading>
        </motion.div>

        <motion.p
          className="measure mt-6 text-lead text-text-secondary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.22, { y: 40 })}
        >
          Répondez à quelques questions et recevez une proposition personnalisée sous 24 heures.
        </motion.p>
      </div>

      <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={floatIn(0.1, { x: -160, rotate: -4 }, { damping: 30, mass: 4 })}
        >
          {/* Formulaire : les libellés de champ restent alignés à gauche. */}
          <Card className="text-left">
            <AnimatePresence mode="wait" initial={false}>
              {showResume ? (
                <motion.div
                  key="resume"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_NOVA }}
                >
                  <ResumePrompt onResume={handleResume} onRestart={handleRestart} />
                </motion.div>
              ) : submitted ? (
                <motion.div
                  key="confirmation"
                  initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: EASE_NOVA }}
                >
                  <Confirmation data={data} reduce={reduce} />
                </motion.div>
              ) : (
                <motion.div
                  key="wizard"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_NOVA }}
                >
                  <ProgressFrieze step={step} maxStep={maxStep} onJump={goTo} reduce={reduce} />

                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => goTo(step - 1)}
                      className="mt-6 flex items-center gap-1.5 text-eyebrow uppercase text-text-muted transition-colors duration-200 ease-nova hover:text-accent-strong"
                    >
                      <Icon icon={ArrowLeft} className="size-3.5" />
                      Retour
                    </button>
                  )}

                  <div className="relative mt-6">
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                      <motion.div
                        key={step}
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: EASE_NOVA }}
                      >
                        {step === 0 && (
                          <StepBlock title={STEP_CONTENT[0].title} subtitle={STEP_CONTENT[0].subtitle}>
                            <StepOffer value={data.offer} onSelect={selectOffer} reduce={reduce} />
                          </StepBlock>
                        )}

                        {step === 1 && (
                          <StepBlock title={STEP_CONTENT[1].title} subtitle={STEP_CONTENT[1].subtitle}>
                            <StepNeeds value={data.needs} onToggle={toggleNeed} reduce={reduce} />
                            <AnimatePresence>
                              {data.needs.length > 0 && (
                                <motion.div
                                  initial={reduce ? false : { opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={reduce ? undefined : { opacity: 0, y: 10 }}
                                  transition={{ duration: 0.25, ease: EASE_NOVA }}
                                  className="mt-6"
                                >
                                  <Button type="button" variant="primary" className="w-full" onClick={() => goTo(2)}>
                                    Continuer
                                  </Button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </StepBlock>
                        )}

                        {step === 2 && (
                          <StepBlock title={STEP_CONTENT[2].title} subtitle={STEP_CONTENT[2].subtitle}>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                              <FormField label="Nom" htmlFor="config-name" error={errors.name}>
                                <Input
                                  id="config-name"
                                  placeholder="Votre nom"
                                  value={data.name}
                                  onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                                />
                              </FormField>
                              <FormField label="Entreprise" htmlFor="config-company">
                                <Input
                                  id="config-company"
                                  placeholder="Nom de votre entreprise"
                                  value={data.company}
                                  onChange={(e) => setData((d) => ({ ...d, company: e.target.value }))}
                                />
                              </FormField>
                              <FormField label="Email" htmlFor="config-email" error={errors.email}>
                                <Input
                                  id="config-email"
                                  type="email"
                                  placeholder="vous@exemple.com"
                                  value={data.email}
                                  onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                                />
                              </FormField>
                              <FormField label="Téléphone" htmlFor="config-phone" error={errors.phone}>
                                <Input
                                  id="config-phone"
                                  type="tel"
                                  placeholder="06 12 34 56 78"
                                  value={data.phone}
                                  onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
                                />
                              </FormField>
                            </div>
                            <p className="mt-3 text-small text-text-secondary">
                              Vos informations restent strictement confidentielles et ne seront
                              jamais partagées.
                            </p>
                            <Button
                              type="button"
                              variant="primary"
                              className="mt-6 w-full"
                              onClick={handleContinueContact}
                            >
                              Continuer
                            </Button>
                          </StepBlock>
                        )}

                        {step === 3 && (
                          <StepBlock title={STEP_CONTENT[3].title} subtitle={STEP_CONTENT[3].subtitle}>
                            <div className="flex flex-col gap-5">
                              <FormField label="Votre projet" htmlFor="config-description" error={errors.description}>
                                <textarea
                                  id="config-description"
                                  rows={5}
                                  placeholder="Décrivez votre projet en quelques lignes..."
                                  value={data.description}
                                  onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
                                  className="w-full min-w-0 rounded-lg border border-input bg-surface px-4 py-3 text-body text-text placeholder:text-text-muted transition-[border-color,box-shadow] duration-200 ease-nova outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/30"
                                />
                              </FormField>
                              <FormField label="Délai souhaité (facultatif)" htmlFor="config-timeline">
                                <Input
                                  id="config-timeline"
                                  placeholder="Ex. dans le mois, pas d'urgence particulière..."
                                  value={data.timeline}
                                  onChange={(e) => setData((d) => ({ ...d, timeline: e.target.value }))}
                                />
                              </FormField>

                              <div className="lg:hidden">
                                <Card tone="ivory" padding="sm">
                                  <p className="mb-3 text-eyebrow uppercase text-text-muted">Récapitulatif</p>
                                  <SummaryContent data={data} />
                                </Card>
                              </div>

                              <Button
                                type="button"
                                variant="primary"
                                className="w-full"
                                onClick={handleSubmitProject}
                                disabled={sending}
                              >
                                {sending ? "Envoi en cours..." : "🚀 Lancer mon projet"}
                              </Button>
                              {sendError && <p className="text-small text-error">{sendError}</p>}
                            </div>
                          </StepBlock>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        <div className="flex flex-col gap-6">
          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(0.25 + index * 0.1, { y: 90 }, { damping: 30, mass: 4 })}
            >
              <Card
                tone="ivory"
                padding="sm"
                className="group flex flex-col transition-colors duration-500 ease-nova hover:border-border-strong"
              >
                <div className="flex items-center gap-4">
                  <CardIndex value={String(index + 1).padStart(2, "0")} className="flex-1" />
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md group-hover:-translate-y-0.5",
                      benefit.className
                    )}
                  >
                    <Icon icon={benefit.icon} className="size-4" />
                  </span>
                </div>
                <p className="mt-5 text-eyebrow uppercase text-text">{benefit.title}</p>
                <p className="mt-2 text-small text-text-secondary">{benefit.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

export { Contact }
