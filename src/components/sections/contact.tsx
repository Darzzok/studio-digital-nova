"use client"

import { Fragment, useEffect, useState } from "react"
import type { ReactNode } from "react"
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
  SendHorizontal,
  Server,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import { EASE_NOVA } from "@/lib/motion"
import { cn } from "@/lib/utils"

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }
type FloatOptions = { stiffness?: number; damping?: number; mass?: number; opacityDuration?: number }

function floatIn(delay: number, from: FloatFrom, options?: FloatOptions) {
  const { stiffness = 110, damping = 15, mass = 1, opacityDuration = 0.4 } = options ?? {}
  return {
    hidden: {
      opacity: 0,
      x: from.x ?? 0,
      y: from.y ?? 0,
      rotate: from.rotate ?? 0,
      scale: from.scale ?? 1,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness,
        damping,
        mass,
        delay,
        opacity: { duration: opacityDuration, delay },
      },
    },
  }
}

/* ------------------------------------------------------------------------ */
/* Contenu du configurateur — modifiable ici sans toucher à la logique.      */
/* ------------------------------------------------------------------------ */

const STEP_LABELS = ["Formule", "Besoins", "Coordonnées", "Projet"]

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

const OFFERS = [
  { id: "essentiel", name: "Essentiel", price: "À partir de 690 €", icon: Rocket },
  { id: "pro", name: "Pro", price: "À partir de 990 €", icon: Sparkles, badge: "Le plus choisi" },
  { id: "premium", name: "Premium", price: "À partir de 1 200 €", icon: Crown },
] as const

const NEEDS = [
  { id: "has-site", label: "Je possède déjà un site", icon: Globe },
  { id: "no-site", label: "Je n'ai pas encore de site", icon: CirclePlus },
  { id: "logo", label: "J'ai besoin d'un logo", icon: Palette },
  { id: "hosting", label: "J'ai besoin d'un hébergement", icon: Server },
  { id: "seo", label: "Je souhaite améliorer mon référencement", icon: Search },
  { id: "support", label: "Je souhaite un accompagnement", icon: HeartHandshake },
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
    className: "bg-primary/10 text-primary",
    title: "Réponse sous 24h",
    description: (
      <>
        Je reviens vers vous rapidement, <strong className="font-semibold text-text">sans attente</strong>.
      </>
    ),
  },
  {
    icon: Gift,
    className: "bg-accent-purple/15 text-accent-purple",
    title: "Devis gratuit",
    description: (
      <>
        Une estimation claire, <strong className="font-semibold text-text">sans engagement</strong>.
      </>
    ),
  },
  {
    icon: Rocket,
    className: "bg-accent-green/15 text-accent-green",
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
      <label htmlFor={htmlFor} className="text-small font-medium text-text">
        {label}
      </label>
      {children}
      {error && <p className="text-small text-error">{error}</p>}
    </div>
  )
}

/** Illustration vectorielle — un message qui part, dans le langage du Hero. */
function ContactIllustration({ reduce }: { reduce: boolean }) {
  return (
    <Card className="relative flex h-48 items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <motion.div
        className="relative flex size-20 items-center justify-center rounded-full shadow-sm"
        style={{ backgroundImage: "linear-gradient(135deg, var(--color-primary), var(--color-accent-purple))" }}
        animate={reduce ? { scale: 1 } : { scale: [1, 1.06, 1] }}
        transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, ease: EASE_NOVA }}
      >
        <Icon icon={SendHorizontal} className="size-9 text-primary-foreground" />
      </motion.div>

      <motion.span
        className="absolute left-8 top-9 size-3 rounded-full bg-accent-green/60"
        animate={reduce ? { y: 0 } : { y: [0, -8, 0] }}
        transition={reduce ? undefined : { duration: 2.6, repeat: Infinity, ease: EASE_NOVA }}
      />
      <motion.span
        className="absolute right-10 top-14 size-2 rounded-full bg-warning/60"
        animate={reduce ? { y: 0 } : { y: [0, 6, 0] }}
        transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, delay: 0.3, ease: EASE_NOVA }}
      />
      <motion.span
        className="absolute bottom-10 right-16 size-2.5 rounded-full bg-primary/50"
        animate={reduce ? { y: 0 } : { y: [0, -6, 0] }}
        transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, delay: 0.6, ease: EASE_NOVA }}
      />
    </Card>
  )
}

/** La frise de progression — même langage visuel que la section Processus. */
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
  return (
    <div>
      <div className="flex items-center">
        {STEP_LABELS.map((label, index) => {
          const completed = index < step
          const active = index === step
          const clickable = index <= maxStep && index !== step

          return (
            <Fragment key={label}>
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onJump(index)}
                  aria-current={active ? "step" : undefined}
                  aria-label={`Étape ${index + 1} : ${label}`}
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-heading text-small font-bold transition-colors duration-200 ease-nova sm:size-11",
                    completed && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary bg-surface text-primary shadow-sm",
                    !completed && !active && "border-border bg-surface text-text-secondary",
                    clickable && "cursor-pointer hover:-translate-y-0.5",
                    !clickable && !active && "cursor-not-allowed opacity-60"
                  )}
                >
                  {completed ? <Icon icon={Check} className="size-4" /> : index + 1}
                </button>
                <span
                  className={cn(
                    "hidden text-[11px] sm:block sm:text-small",
                    active ? "font-semibold text-text" : "text-text-secondary"
                  )}
                >
                  {label}
                </span>
              </div>

              {index < STEP_LABELS.length - 1 && (
                <div className="relative mx-1.5 mt-5 h-0.5 flex-1 self-start rounded-full bg-border sm:mx-2">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    initial={false}
                    animate={{ width: index < step ? "100%" : "0%" }}
                    transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_NOVA }}
                  />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: 6 }}
          transition={{ duration: 0.3, ease: EASE_NOVA }}
          className="mt-4 text-center text-small font-medium text-primary"
        >
          {PROGRESS_MESSAGES[step]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

function StepBlock({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading variant="h3">{title}</Heading>
        <p className="mt-2 text-body text-text-secondary">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function StepOffer({ value, onSelect }: { value: OfferId | null; onSelect: (id: OfferId) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {OFFERS.map((offer) => {
        const selected = value === offer.id
        return (
          <div key={offer.id} className="relative">
            {"badge" in offer && offer.badge && (
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                <Badge variant="primary" className="gap-1.5 shadow-sm">
                  <Icon icon={Sparkles} className="size-3" />
                  {offer.badge}
                </Badge>
              </div>
            )}
            <button type="button" onClick={() => onSelect(offer.id)} className="block w-full text-left">
              <Card
                className={cn(
                  "relative flex flex-col items-center gap-3 overflow-hidden p-6 text-center transition-[border-color,box-shadow,transform] duration-200 ease-nova",
                  selected ? "scale-[1.02] border-primary shadow-lg" : "hover:border-primary/40"
                )}
              >
                {selected && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-x-6 -top-16 h-32 rounded-full bg-primary/20 blur-3xl"
                  />
                )}
                <span
                  className={cn(
                    "relative flex size-11 shrink-0 items-center justify-center rounded-xl",
                    selected ? "bg-primary text-primary-foreground shadow-sm" : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon icon={offer.icon} className="size-5" />
                </span>
                <p className="relative text-h3 font-heading font-semibold text-text">{offer.name}</p>
                <p className="relative whitespace-nowrap text-body font-semibold text-text">{offer.price}</p>
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 18 }}
                      className="relative flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Icon icon={Check} className="size-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Card>
            </button>
          </div>
        )
      })}
    </div>
  )
}

function StepNeeds({ value, onToggle }: { value: NeedId[]; onToggle: (id: NeedId) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {NEEDS.map((need) => {
        const selected = value.includes(need.id)
        return (
          <button key={need.id} type="button" onClick={() => onToggle(need.id)} className="text-left">
            <Card
              className={cn(
                "flex items-center gap-3 p-4 transition-[border-color,box-shadow,background-color] duration-200 ease-nova",
                selected ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40"
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                )}
              >
                <Icon icon={need.icon} className="size-4" />
              </span>
              <p className="flex-1 text-small font-medium text-text">{need.label}</p>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                )}
              >
                {selected && <Icon icon={Check} className="size-3" />}
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
          <span className="text-small font-medium text-text-secondary">{row.label}</span>
          <span className="text-small font-semibold text-text">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function ResumePrompt({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
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
        className="flex size-16 items-center justify-center rounded-full text-3xl shadow-sm"
        style={{ backgroundImage: "linear-gradient(135deg, var(--color-primary), var(--color-accent-purple))" }}
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
                  "flex size-10 shrink-0 items-center justify-center rounded-full border-2",
                  index === 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-text-secondary"
                )}
              >
                <Icon icon={item.icon} className="size-4" />
              </span>
              {index < TRACKING_STEPS.length - 1 && (
                <div className="mx-1.5 h-0.5 flex-1 rounded-full bg-border sm:mx-2" />
              )}
            </Fragment>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {TRACKING_STEPS.map((item) => (
            <span key={item.label} className="text-center text-[10px] leading-tight text-text-secondary sm:text-small">
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full rounded-2xl bg-background p-5 text-left">
        <p className="mb-3 text-small font-semibold text-text">Récapitulatif</p>
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
        <a href="/" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            <Icon icon={ArrowLeft} className="size-4" />
            Retour à l&apos;accueil
          </Button>
        </a>
        <a href="/#services" className="flex-1">
          <Button type="button" variant="primary" className="w-full">
            Découvrir mes services
          </Button>
        </a>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Section principale                                                       */
/* ------------------------------------------------------------------------ */

function Contact() {
  const reduce = Boolean(useReducedMotion())

  const [hydrated, setHydrated] = useState(false)
  const [showResume, setShowResume] = useState(false)
  const [savedPayload, setSavedPayload] = useState<PersistedState | null>(null)

  const [data, setData] = useState<ConfiguratorData>(EMPTY_DATA)
  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState
        if (parsed.offer || parsed.needs?.length || parsed.name) {
          setSavedPayload(parsed)
          setShowResume(true)
        }
      }
    } catch {
      // localStorage indisponible — on ignore silencieusement.
    }
    setHydrated(true)
  }, [])

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

  function handleSubmitProject() {
    if (!validateProject()) return
    setSubmitted(true)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage indisponible — on ignore silencieusement.
    }
  }

  function handleResume() {
    if (!savedPayload) return
    const { step: savedStep, maxStep: savedMax, ...rest } = savedPayload
    setData(rest)
    setStep(savedStep ?? 0)
    setMaxStep(savedMax ?? savedStep ?? 0)
    setShowResume(false)
  }

  function handleRestart() {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage indisponible — on ignore silencieusement.
    }
    setSavedPayload(null)
    setShowResume(false)
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
          <Badge variant="outline" className="gap-2 py-1.5">
            <Icon icon={MessageSquare} className="size-3.5" />
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
          className="mt-6 max-w-xl text-body text-text-secondary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.22, { y: 40 })}
        >
          Répondez à quelques questions et recevez une proposition personnalisée sous 24 heures.
        </motion.p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={floatIn(0.1, { x: -160, rotate: -4 }, { damping: 30, mass: 4 })}
        >
          <Card>
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
                      className="mt-6 flex items-center gap-1.5 text-small font-medium text-text-secondary transition-colors duration-150 ease-nova hover:text-primary"
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
                            <StepOffer value={data.offer} onSelect={selectOffer} />
                          </StepBlock>
                        )}

                        {step === 1 && (
                          <StepBlock title={STEP_CONTENT[1].title} subtitle={STEP_CONTENT[1].subtitle}>
                            <StepNeeds value={data.needs} onToggle={toggleNeed} />
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
                              <FormField label="Téléphone" htmlFor="config-phone">
                                <Input
                                  id="config-phone"
                                  type="tel"
                                  placeholder="06 12 34 56 78"
                                  value={data.phone}
                                  onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
                                />
                              </FormField>
                            </div>
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
                                  className="w-full min-w-0 rounded-xl border border-border bg-surface px-4 py-3 text-body text-text placeholder:text-text-secondary transition-colors outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
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
                                <Card className="bg-background">
                                  <p className="mb-3 text-small font-semibold text-text">Récapitulatif</p>
                                  <SummaryContent data={data} />
                                </Card>
                              </div>

                              <Button type="button" variant="primary" className="w-full" onClick={handleSubmitProject}>
                                🚀 Lancer mon projet
                              </Button>
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
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.15, { x: 160, rotate: 4 }, { damping: 30, mass: 4 })}
          >
            <ContactIllustration reduce={reduce} />
          </motion.div>

          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(0.25 + index * 0.1, { y: 90 }, { damping: 30, mass: 4 })}
            >
              <Card className="flex items-start gap-3 p-5">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    benefit.className
                  )}
                >
                  <Icon icon={benefit.icon} className="size-5" />
                </span>
                <div>
                  <p className="text-small font-semibold text-text">{benefit.title}</p>
                  <p className="text-small text-text-secondary">{benefit.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

export { Contact }
