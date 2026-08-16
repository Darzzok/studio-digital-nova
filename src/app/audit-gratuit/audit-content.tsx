"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Check,
  CircleAlert,
  Gauge,
  Mail,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Monitor,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { CHIP, DrawRule, NovaMark } from "@/components/ui/nova"
import { Section } from "@/components/ui/section"
import {
  AuditError,
  PAGESPEED_KEY,
  normalizeUrl,
  runAudit,
  type AuditReport,
  type Strategy,
} from "@/lib/audit"
import { EASE_NOVA, useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

const WEB3FORMS_ACCESS_KEY = "37757408-4a45-44eb-afc1-20d7ae50d224"
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit"

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
    <div className={cn("relative flex shrink-0 items-center justify-center", large ? "size-28" : "size-16")}>
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
      <span
        className={cn(
          "absolute font-heading tabular-nums",
          large ? "text-h2" : "text-h3",
          tone.text
        )}
      >
        {score ?? "—"}
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

function ReportView({
  report,
  other,
  strategy,
  onStrategy,
  reduce,
}: {
  report: AuditReport
  other: AuditReport | null
  strategy: Strategy
  onStrategy: (s: Strategy) => void
  reduce: boolean
}) {
  const verdict =
    report.overall >= 90
      ? "Votre site est en bonne santé. Quelques réglages fins suffiraient à le rendre irréprochable."
      : report.overall >= 50
        ? "Votre site fonctionne, mais il laisse passer des visiteurs. Les points ci-dessous sont les plus rentables à corriger."
        : "Votre site perd des visiteurs avant même d'être lu. Les corrections ci-dessous changeraient nettement la donne."

  return (
    <div className="flex flex-col gap-6">
      {/* Bilan général */}
      <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden lg:p-9">
        <div className="relative flex items-center justify-between gap-4">
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
            <figure className="shrink-0">
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

          <div className="flex min-w-0 flex-1 flex-col items-start gap-7 sm:flex-row sm:items-center sm:gap-9">
            <ScoreRing score={report.overall} size="lg" reduce={reduce} />
            <div className="min-w-0">
              <p className="text-eyebrow uppercase text-on-ink-soft">Page analysée</p>
              <p className="mt-2 break-all font-heading text-h3 text-on-ink">{report.finalUrl}</p>
              <p className="mt-4 text-lead text-on-ink-soft">{verdict}</p>
            </div>
          </div>
        </div>

        {/* La pondération est affichée : le visiteur sait comment la note est faite. */}
        <p className="relative mt-7 border-t border-border-ink pt-5 text-small text-on-ink-soft">
          Cette note est <strong className="font-semibold text-on-ink">ma lecture</strong>, pas
          celle de Google : je pondère par ce qui fait réellement perdre des clients — vitesse
          40 %, confort visuel 30 %, référencement 20 %, bonnes pratiques 10 %. Les scores bruts
          de Google sont juste en dessous.
        </p>

        {other && (
          <div className="relative mt-8 flex items-center gap-2 border-t border-border-ink pt-6">
            <span className="text-eyebrow uppercase text-on-ink-soft">Appareil</span>
            <div className="ml-auto flex gap-2">
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

      {/* Les notes détaillées, confort visuel inclus */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {[
          ...report.categories.slice(0, 1),
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
          ...report.categories.slice(1),
        ].map((category) => (
          <Card key={category.id} tone="ivory" padding="md" className="group flex gap-5 text-left">
            <ScoreRing score={category.score} reduce={reduce} />
            <div className="min-w-0">
              <h3 className="font-heading text-h3 text-text">{category.label}</h3>
              <p className="mt-2 text-small text-text-secondary">{category.meaning}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Pellicule du chargement */}
      {report.filmstrip.length > 1 && (
        <Card padding="md" className="text-left">
          <p className="text-eyebrow uppercase text-text-muted">
            Ce que voit votre visiteur pendant le chargement
          </p>
          <DrawRule className="mt-4" />
          <ol className="mt-6 flex gap-3 overflow-x-auto pb-1">
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
            Chaque vignette est votre page à cet instant précis. Un écran resté blanc, c&apos;est
            un visiteur qui attend — et souvent, qui repart.
          </p>
        </Card>
      )}

      {/* Détail du confort visuel */}
      {report.visual.signals.length > 0 && (
        <Card padding="md" className="text-left">
          <p className="text-eyebrow uppercase text-text-muted">Le détail du confort visuel</p>
          <DrawRule className="mt-4" />
          <ul className="mt-6 flex flex-col divide-y divide-border">
            {report.visual.signals.map((signal, index) => {
              const pct = Math.round(signal.score * 100)
              const tone = scoreTone(pct)
              return (
                <li key={signal.id} className={cn("flex items-start gap-4 py-4", index === 0 && "pt-0")}>
                  <span className={cn("mt-0.5 shrink-0 font-heading text-body tabular-nums", tone.text)}>
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
        <Card padding="md" className="text-left">
          <p className="text-eyebrow uppercase text-text-muted">Ce que ressent votre visiteur</p>
          <DrawRule className="mt-4" />
          <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {report.vitals.map((vital) => (
              <div key={vital.id}>
                <dt className="flex items-baseline justify-between gap-3">
                  <span className="text-small font-medium text-text">{vital.label}</span>
                  <span className={cn("font-heading text-body tabular-nums", VERDICT_TONE[vital.verdict])}>
                    {vital.value}
                  </span>
                </dt>
                <dd className="mt-1.5 text-small text-text-muted">{vital.hint}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Points à corriger */}
      {report.issues.length > 0 ? (
        <Card padding="md" className="text-left">
          <div className="flex items-center justify-between gap-4">
            <p className="text-eyebrow uppercase text-text-muted">
              {report.issues.length} point{report.issues.length > 1 ? "s" : ""} à corriger
            </p>
            <Icon icon={CircleAlert} className="size-4 text-accent" />
          </div>
          <DrawRule className="mt-4" />
          <ul className="mt-6 flex flex-col divide-y divide-border">
            {report.issues.map((issue, index) => (
              <li key={issue.id} className={cn("flex gap-4 py-5", index === 0 && "pt-0")}>
                <span
                  aria-hidden
                  className="mt-0.5 font-heading text-small tabular-nums text-text-muted"
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
      ) : (
        <Card padding="md" className="flex items-center gap-4 text-left">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", CHIP.sage)}>
            <Icon icon={ShieldCheck} className="size-4" />
          </span>
          <p className="text-small text-text-secondary">
            Aucun défaut majeur détecté sur cette page parmi les points que je contrôle. C&apos;est
            rare — et bon signe.
          </p>
        </Card>
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
/* Formulaire de reprise de contact                                            */
/* -------------------------------------------------------------------------- */

function LeadForm({ url, report }: { url: string; report: AuditReport | null }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setError("Merci d'indiquer une adresse email valide.")
      return
    }
    setSending(true)
    setError(null)

    const resume = report
      ? `Note globale ${report.overall}/100 — ` +
        report.categories.map((c) => `${c.label} ${c.score ?? "?"}`).join(", ") +
        (report.issues.length
          ? ` | Points relevés : ${report.issues.map((i) => i.title).join(" ; ")}`
          : " | Aucun point majeur relevé")
      : "Analyse automatique non effectuée."

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: "Demande d'audit détaillé — Studio Digital Nova",
          from_name: name || email,
          name: name || "Non renseigné",
          email,
          site: url || "Non renseigné",
          message: resume,
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message ?? "Échec de l'envoi.")
      setSent(true)
    } catch {
      setError("L'envoi a échoué. Réessayez, ou écrivez-moi directement à contact@studiodigitalnova.fr.")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden text-left lg:p-9">
        <div className="relative flex items-start gap-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border-ink text-accent">
            <Icon icon={Check} className="size-5" />
          </span>
          <div>
            <h3 className="font-heading text-h2 text-on-ink">C&apos;est noté.</h3>
            <p className="mt-3 text-lead text-on-ink-soft">
              Je reprends votre site page par page et je vous envoie l&apos;analyse commentée sous
              24 heures, avec les corrections classées par priorité. Sans engagement.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden text-left lg:p-9">
      <div className="relative flex items-center justify-between gap-4">
        <Badge variant="ink">Aller plus loin</Badge>
        <NovaMark aria-hidden className="size-2.5 text-accent" />
      </div>

      <h3 className="relative mt-7 font-heading text-h2 text-on-ink">
        Recevez l&apos;analyse complète, commentée
      </h3>
      <p className="relative mt-4 max-w-xl text-lead text-on-ink-soft">
        L&apos;automatique mesure. Moi, je regarde vos pages, votre contenu, votre structure et vos
        concurrents — puis je vous dis quoi corriger en premier, et ce que ça vaut. Réponse sous
        24 h, sans engagement.
      </p>

      <form onSubmit={submit} className="relative mt-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="audit-name" className="text-eyebrow uppercase text-on-ink-soft">
              Prénom
            </label>
            <Input
              id="audit-name"
              placeholder="Votre prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-border-ink bg-white/5 text-on-ink placeholder:text-on-ink-soft"
            />
          </div>
        </div>

        {error && <p className="text-small text-accent">{error}</p>}

        <Button
          type="submit"
          variant="primary"
          disabled={sending}
          className="mt-2 w-full bg-paper text-ink hover:bg-accent hover:text-ink sm:w-fit"
        >
          {sending ? "Envoi en cours…" : "Recevoir mon audit détaillé"}
          <Icon icon={ArrowRight} />
        </Button>

        <p className="text-small text-on-ink-soft">
          Votre adresse sert uniquement à vous envoyer cette analyse. Aucune inscription, aucune
          revente, aucune relance automatique.
        </p>
      </form>
    </Card>
  )
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
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const available = Boolean(PAGESPEED_KEY)

  /* Progression estimée : l'API ne renvoie rien pendant qu'elle travaille. */
  useEffect(() => {
    if (phase !== "running") return
    const id = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + (92 - p) * 0.045))
      setStepIndex((i) => Math.min(PROGRESS_STEPS.length - 1, i + (Math.random() > 0.7 ? 1 : 0)))
    }, 400)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => () => abortRef.current?.abort(), [])

  const start = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault()
      const url = normalizeUrl(input)
      if (!url) {
        setError("Cette adresse ne semble pas valide. Exemple : monentreprise.fr")
        setPhase("error")
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setAuditedUrl(url)
      setReports({})
      setProgress(4)
      setStepIndex(0)
      setError(null)
      setPhase("running")

      // Les deux appareils en parallèle : une seule attente au lieu de deux.
      const [mobile, desktop] = await Promise.allSettled([
        runAudit(url, "mobile", controller.signal),
        runAudit(url, "desktop", controller.signal),
      ])

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

      setReports(next)
      setStrategy(next.mobile ? "mobile" : "desktop")
      setProgress(100)
      setPhase("done")
    },
    [input]
  )

  function reset() {
    abortRef.current?.abort()
    setPhase("idle")
    setReports({})
    setError(null)
    setProgress(0)
  }

  const current = reports[strategy] ?? reports.mobile ?? reports.desktop ?? null
  const hasBoth = Boolean(reports.mobile && reports.desktop)

  return (
    <>
      <Section spacing="lg">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            className="mb-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0, { y: -40, scale: 0.85 })}
          >
            <Badge variant="outline">
              <Icon icon={Gauge} className="size-3.5 text-accent" />
              Audit gratuit
            </Badge>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.12, { y: -60, scale: 0.94 })}
          >
            <Heading variant="h1">
              Votre site vous fait-il perdre des{" "}
              <span className="whitespace-nowrap text-[1.15em] italic leading-[0] text-accent">
                clients
              </span>{" "}
              ?
            </Heading>
          </motion.div>

          <motion.p
            className="measure mt-6 text-lead text-text-secondary"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.22, { y: 40 })}
          >
            Entrez l&apos;adresse de votre site. En moins d&apos;une minute, vous saurez ce que
            Google mesure vraiment : la vitesse, le référencement, l&apos;accessibilité et la
            sécurité. <strong className="font-semibold text-text">Gratuit, sans inscription.</strong>
          </motion.p>

          {/* Saisie */}
          <motion.form
            onSubmit={start}
            className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.32, { y: 30 })}
          >
            <div className="relative flex-1">
              <Icon
                icon={Search}
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              />
              <Input
                type="text"
                inputMode="url"
                aria-label="Adresse de votre site"
                placeholder="monentreprise.fr"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={phase === "running"}
                className="h-13 pl-11"
              />
            </div>
            <Button type="submit" variant="primary" disabled={phase === "running" || !available}>
              {phase === "running" ? "Analyse en cours…" : "Analyser mon site"}
              {phase !== "running" && <Icon icon={ArrowRight} />}
            </Button>
          </motion.form>

          {!available && (
            <p className="mt-4 max-w-xl text-small text-text-muted">
              L&apos;analyse automatique est momentanément indisponible. Laissez-moi votre adresse
              plus bas : je lance l&apos;audit de mon côté et vous l&apos;envoie sous 24 h.
            </p>
          )}
        </div>
      </Section>

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
                <Card tone="ivory" padding="md" className="text-left lg:p-9">
                  <p className="text-eyebrow uppercase text-text-muted">Analyse de {auditedUrl}</p>

                  <div className="mt-6 h-px w-full overflow-hidden bg-border">
                    <motion.div
                      className="h-full origin-left bg-accent"
                      animate={{ scaleX: progress / 100 }}
                      transition={{ duration: 0.4, ease: EASE_NOVA }}
                      style={{ transformOrigin: "left" }}
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={stepIndex}
                      className="mt-6 font-heading text-h3 text-text"
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: EASE_NOVA }}
                    >
                      {PROGRESS_STEPS[stepIndex]}
                    </motion.p>
                  </AnimatePresence>

                  <p className="mt-3 text-small text-text-secondary">
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
                    <p className="mt-2 text-small text-text-secondary">{error}</p>
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
                />

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

      {/* Reprise de contact */}
      <Section spacing="default">
        <div className="mx-auto max-w-3xl">
          <LeadForm url={auditedUrl || input} report={current} />
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
