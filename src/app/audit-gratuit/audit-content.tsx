"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Check,
  CircleAlert,
  Download,
  Eye,
  Gauge,
  Link2,
  Loader2,
  Lock,
  Mail,
  Monitor,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  X,
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
  DIMENSIONS,
  PAGESPEED_KEY,
  normalizeUrl,
  runAudit,
  type Constat,
  type DimensionId,
  type NoteDimension,
  type RapportPage,
  type Strategy,
} from "@/lib/audit"
import { EASE_NOVA, useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"


const WEB3FORMS_ACCESS_KEY = "37757408-4a45-44eb-afc1-20d7ae50d224"
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit"

/* ==========================================================================
   PAGE D'AUDIT
   ==========================================================================
   Parcours court : une adresse, une analyse, un bilan. Trois écrans se
   succèdent au même endroit — saisie, progression, résultats — pour que le
   visiteur ne perde jamais le fil.

   Tout ce qui est affiché vient du moteur (`lib/audit.ts`). Cette page ne
   recalcule rien et n'ajoute aucun chiffre : elle met en forme des constats
   déjà qualifiés — mesurés, appréciés, ou non vérifiés.
   ========================================================================== */

type Phase = "saisie" | "analyse" | "resultat" | "erreur"

/** Les étapes réellement suivies. Aucune n'avance sans un fait observable. */
type EtapeId = "connexion" | "mobile" | "ordinateur" | "bilan"
type EtatEtape = "attente" | "cours" | "termine" | "indisponible"

const ETAPES: { id: EtapeId; libelle: string; court: string }[] = [
  { id: "connexion", libelle: "Connexion à votre site", court: "Connexion" },
  { id: "mobile", libelle: "Analyse de la version mobile", court: "Mobile" },
  { id: "ordinateur", libelle: "Analyse de la version ordinateur", court: "Ordinateur" },
  { id: "bilan", libelle: "Préparation du bilan", court: "Bilan" },
]

const TON_NOTE = (note: number) =>
  note >= 75
    ? { texte: "text-success", trait: "var(--color-success)", pastille: CHIP.sage }
    : note >= 45
      ? { texte: "text-warning", trait: "var(--color-warning)", pastille: CHIP.ochre }
      : { texte: "text-accent-strong", trait: "var(--color-accent)", pastille: CHIP.terracotta }

const LIBELLE_PRIORITE = { haute: "Prioritaire", moyenne: "À corriger", basse: "À surveiller" }
const CHIP_PRIORITE = {
  haute: "bg-accent/12 text-accent-strong",
  moyenne: "bg-warning/12 text-warning",
  basse: "bg-mineral/12 text-mineral",
}
const LIBELLE_NATURE = {
  mesure: "Mesuré",
  appreciation: "Apprécié",
  non_verifie: "Non vérifié",
}

/* -------------------------------------------------------------------------- */
/* Anneau de note                                                              */
/* -------------------------------------------------------------------------- */

function Anneau({
  note,
  taille = "md",
  reduce,
}: {
  note: number | null
  taille?: "md" | "lg"
  reduce: boolean
}) {
  const ton = note === null ? null : TON_NOTE(note)
  const px = taille === "lg" ? "size-28" : "size-16"
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center", px)}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-border)" strokeWidth="2.5" />
        {note !== null && (
          <motion.circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={ton!.trait}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: note / 100 }}
            transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE_NOVA }}
          />
        )}
      </svg>
      <span
        className={cn(
          "absolute font-heading tabular-nums",
          taille === "lg" ? "text-display" : "text-h3",
          note === null ? "text-text-muted" : ton!.texte
        )}
      >
        {note === null ? "—" : note}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Capture annotée                                                             */
/* -------------------------------------------------------------------------- */
/*
  Les repères ne sont dessinés que pour les constats dont le moteur a jugé la
  position fiable — c'est-à-dire ceux dont l'élément tombe réellement dans la
  fenêtre capturée. Un constat sans `zone` apparaît dans la liste, jamais sur
  l'image : inventer un rectangle serait pire que ne rien montrer.
*/
function CaptureAnnotee({
  rapport,
  actif,
  onChoisir,
}: {
  rapport: RapportPage
  actif: string | null
  onChoisir: (id: string | null) => void
}) {
  const capture = rapport.capture
  const reperes = rapport.constats.filter((c) => c.zone)

  if (!capture) {
    return (
      <Card padding="md" className="text-left">
        <p className="text-eyebrow uppercase text-text-muted">Capture indisponible</p>
        <p className="mt-3 text-small text-text-secondary">
          Google n&apos;a pas renvoyé d&apos;image pour cette page. Les constats ci-dessous
          restent valables — ils viennent des mesures, pas de l&apos;image.
        </p>
      </Card>
    )
  }

  return (
    <figure className="text-left">
      <div className="relative overflow-hidden rounded-lg border border-border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capture.data}
          alt={`Aperçu de ${rapport.url} sur ${rapport.appareil === "mobile" ? "téléphone" : "ordinateur"}`}
          className="block w-full"
        />
        {reperes.map((c, i) => {
          const z = c.zone!
          const estActif = actif === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChoisir(estActif ? null : c.id)}
              aria-label={`Repère ${i + 1} : ${c.constat}`}
              aria-pressed={estActif}
              className={cn(
                "absolute rounded-[3px] border-2 outline-none transition-[opacity,box-shadow] duration-200 ease-nova",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                estActif
                  ? "border-accent opacity-100 shadow-[0_0_0_9999px_rgba(11,23,38,0.45)]"
                  : "border-accent/70 opacity-80 hover:opacity-100"
              )}
              style={{
                top: `${(z.top / capture.hauteur) * 100}%`,
                left: `${(z.left / capture.largeur) * 100}%`,
                width: `${(z.width / capture.largeur) * 100}%`,
                height: `${(z.height / capture.hauteur) * 100}%`,
              }}
            >
              <span className="absolute -left-px -top-px flex size-4 items-center justify-center rounded-[2px] bg-accent font-heading text-[10px] leading-none text-accent-foreground">
                {i + 1}
              </span>
            </button>
          )
        })}
      </div>
      <figcaption className="mt-3 text-small text-text-muted">
        {reperes.length > 0 ? (
          <>
            {reperes.length} repère{reperes.length > 1 ? "s" : ""} situé
            {reperes.length > 1 ? "s" : ""} dans le premier écran. Les autres constats
            concernent des éléments plus bas dans la page.
          </>
        ) : (
          <>
            Aucun constat n&apos;a pu être situé précisément dans cette capture. Ils sont
            listés ci-dessous sans repère.
          </>
        )}
      </figcaption>
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/* Carte de constat                                                            */
/* -------------------------------------------------------------------------- */

function CarteConstat({
  constat,
  rang,
  actif,
  onSurvol,
}: {
  constat: Constat
  rang?: number
  actif: boolean
  onSurvol: (id: string | null) => void
}) {
  return (
    <Card
      padding="md"
      className={cn(
        "text-left transition-[border-color,background-color] duration-300 ease-nova",
        actif && "border-accent bg-accent/[0.04]"
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {rang !== undefined && (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-[4px] bg-accent font-heading text-[11px] text-accent-foreground">
            {rang}
          </span>
        )}
        <span
          className={cn(
            "rounded-sm px-2 py-0.5 text-eyebrow uppercase",
            CHIP_PRIORITE[constat.priorite]
          )}
        >
          {LIBELLE_PRIORITE[constat.priorite]}
        </span>
        <span className="rounded-sm border border-border px-2 py-0.5 text-eyebrow uppercase text-text-muted">
          {LIBELLE_NATURE[constat.nature]}
        </span>
        <span className="text-eyebrow uppercase text-text-muted">
          {constat.appareil === "mobile" ? "Mobile" : "Ordinateur"}
        </span>
      </div>

      <h4 className="mt-4 font-heading text-h3 text-text">{constat.constat}</h4>

      <dl className="mt-4 flex flex-col gap-3 text-small">
        <div>
          <dt className="text-eyebrow uppercase text-text-muted">Ce qui a été relevé</dt>
          <dd className="mt-1 text-text-secondary">{constat.preuve}</dd>
        </div>
        <div>
          <dt className="text-eyebrow uppercase text-text-muted">Conséquence possible</dt>
          <dd className="mt-1 text-text-secondary">{constat.consequence}</dd>
        </div>
        <div>
          <dt className="text-eyebrow uppercase text-accent-strong">Ce qu&apos;il faut faire</dt>
          <dd className="mt-1 text-text">{constat.recommandation}</dd>
        </div>
      </dl>

      {constat.zone && (
        <button
          type="button"
          onMouseEnter={() => onSurvol(constat.id)}
          onMouseLeave={() => onSurvol(null)}
          onFocus={() => onSurvol(constat.id)}
          onBlur={() => onSurvol(null)}
          onClick={() => onSurvol(actif ? null : constat.id)}
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-small font-medium text-text outline-none transition-colors duration-200 ease-nova hover:text-accent-strong focus-visible:text-accent-strong"
        >
          <Icon icon={Eye} className="size-4 text-accent" />
          {actif ? "Masquer le repère" : "Situer sur la capture"}
        </button>
      )}
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Écran de progression                                                        */
/* -------------------------------------------------------------------------- */
/*
  L'analyse dure vingt à trente secondes. Ce qui se passe pendant ce temps doit
  se voir, sinon le visiteur a le sentiment que le résultat sort de nulle part.

  Deux temps se succèdent ici, et ils ne mentent ni l'un ni l'autre :

  1. LE RELEVÉ — les deux requêtes partent vers Google PageSpeed. Leur durée est
     inconnue, donc la barre est indéterminée : un pourcentage inventé serait un
     mensonge. Ce qui est montré est réel — le chrono qui tourne, l'état de
     chaque appareil, et la capture dès qu'elle arrive.
  2. LE DÉPOUILLEMENT — les mesures sont là. Les cinq dimensions se dévoilent
     l'une après l'autre avec leur VRAIE note. L'espacement est un choix
     d'affichage, jamais un calcul qui continue : rien n'est recalculé ici.
*/

/** Ce que le moteur passe en revue. Chaque ligne correspond à un audit réel. */
const REVUE = [
  "Contraste des textes sur leur fond",
  "Taille des caractères sur petit écran",
  "Images sans dimensions déclarées",
  "Images servies plus lourdes que nécessaire",
  "Zones cliquables trop petites au doigt",
  "Liens et boutons sans intitulé lisible",
  "Décalages de la mise en page au chargement",
  "Délai d'affichage du contenu principal",
  "Titre, description et structure des titres",
]

type Depouillement = { dims: NoteDimension[]; faites: DimensionId[] }

/** Attente que « Annuler » interrompt sur-le-champ. */
function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (ms <= 0 || signal.aborted) return resolve()
    const id = setTimeout(resolve, ms)
    signal.addEventListener("abort", () => { clearTimeout(id); resolve() }, { once: true })
  })
}

/** Compteur qui monte jusqu'à la vraie note. Aucune valeur intermédiaire n'est un résultat. */
function Compteur({ valeur, reduce }: { valeur: number; reduce: boolean }) {
  const [anime, setAnime] = useState(0)

  useEffect(() => {
    if (reduce) return
    let image = 0
    const depart = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - depart) / 620)
      setAnime(Math.round(valeur * (1 - Math.pow(1 - p, 3))))
      if (p < 1) image = requestAnimationFrame(tick)
    }
    image = requestAnimationFrame(tick)

    /*
      Filet indispensable : dans un onglet passé en arrière-plan, le navigateur
      n'exécute plus une seule image d'animation. Le compteur restait alors
      bloqué sur 0 et affichait « 0/100 » comme si c'était la note. Ce délai
      pose la vraie valeur quoi qu'il arrive.
    */
    const secours = setTimeout(() => setAnime(valeur), 800)

    return () => {
      cancelAnimationFrame(image)
      clearTimeout(secours)
    }
  }, [valeur, reduce])

  /* En mouvement réduit, la note s'affiche d'emblée : pas de compte à rebours. */
  return <>{reduce ? valeur : anime}</>
}

/**
 * Cadre d'appareil — téléphone ou ordinateur. La capture réelle s'y installe
 * dès qu'elle arrive ; avant, c'est une trame vide, jamais une fausse image.
 */
function CadreAppareil({
  type,
  etat,
  capture,
  reduce,
}: {
  type: Strategy
  etat: EtatEtape
  capture: string | undefined
  reduce: boolean
}) {
  const mobile = type === "mobile"

  const contenu = (
    <>
      {capture ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={capture} alt="" className="block h-full w-full object-cover object-top" />
      ) : (
        <div className="flex h-full flex-col gap-1.5 p-2">
          {[72, 100, 48].map((l, i) => (
            <motion.span
              key={i}
              className="h-1.5 rounded-full bg-ink/12"
              style={{ width: `${l}%` }}
              animate={reduce ? { opacity: 0.4 } : { opacity: [0.25, 0.6, 0.25] }}
              transition={reduce ? undefined : { duration: 1.8, repeat: Infinity, delay: i * 0.2, ease: EASE_NOVA }}
            />
          ))}
          <motion.span
            className="mt-0.5 flex-1 rounded-sm bg-ink/8"
            animate={reduce ? { opacity: 0.35 } : { opacity: [0.2, 0.45, 0.2] }}
            transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, ease: EASE_NOVA }}
          />
        </div>
      )}

      {/* Balayage : il accompagne une requête réellement en vol. */}
      {etat === "cours" && !reduce && (
        <>
          <motion.span
            aria-hidden
            className="absolute inset-x-0 h-12"
            style={{ backgroundImage: "linear-gradient(180deg, transparent, rgba(217,108,79,0.32), transparent)" }}
            animate={{ top: ["-25%", "110%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            aria-hidden
            className="absolute inset-x-0 h-px bg-accent"
            animate={{ top: ["-2%", "102%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          />
        </>
      )}
    </>
  )

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {mobile ? (
          <div className="rounded-[1.05rem] border-2 border-border-ink bg-ink p-[3px]">
            <div className="relative aspect-[9/18] w-[86px] overflow-hidden rounded-[0.72rem] bg-white sm:w-[100px]">
              {contenu}
              <span aria-hidden className="absolute left-1/2 top-1 z-10 h-1 w-7 -translate-x-1/2 rounded-full bg-ink/45" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="rounded-t-md border-2 border-b-0 border-border-ink bg-ink p-[3px]">
              <div className="relative aspect-[16/10] w-[132px] overflow-hidden rounded-[3px] bg-white sm:w-[158px]">
                {contenu}
              </div>
            </div>
            <span aria-hidden className="h-[5px] w-[152px] rounded-b-md bg-border-ink sm:w-[178px]" />
          </div>
        )}

        {/* Pastille d'état, posée sur le coin du cadre. */}
        <AnimatePresence>
          {(etat === "termine" || etat === "indisponible") && (
            <motion.span
              key={etat}
              className={cn(
                "absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border-2 border-surface-ink",
                etat === "termine" ? "bg-accent text-ink" : "bg-error text-paper"
              )}
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.34, ease: EASE_NOVA }}
            >
              <Icon icon={etat === "termine" ? Check : X} className="size-2.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <p className="flex items-center gap-1.5 text-eyebrow uppercase text-on-ink-soft">
        <Icon icon={mobile ? Smartphone : Monitor} className="size-3" />
        {mobile ? "Mobile" : "Ordinateur"}
      </p>
    </div>
  )
}

function EcranProgression({
  url,
  etats,
  apercus,
  depouillement,
  reduce,
  onAnnuler,
}: {
  url: string
  etats: Record<EtapeId, EtatEtape>
  apercus: Partial<Record<Strategy, string>>
  depouillement: Depouillement | null
  reduce: boolean
  onAnnuler: () => void
}) {
  /* Chrono réel : il compte le temps écoulé, il n'anticipe rien. */
  const [secondes, setSecondes] = useState(0)
  useEffect(() => {
    const debut = Date.now()
    const id = setInterval(() => setSecondes(Math.floor((Date.now() - debut) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  /* Ce que l'analyse passe en revue — une énumération, pas un déroulé d'étapes. */
  const [revue, setRevue] = useState(0)
  useEffect(() => {
    if (reduce || depouillement) return
    const id = setInterval(() => setRevue((i) => (i + 1) % REVUE.length), 1900)
    return () => clearInterval(id)
  }, [reduce, depouillement])

  const total = depouillement?.dims.length ?? 0
  const pourcent = depouillement && total > 0
    ? Math.round((depouillement.faites.length / total) * 100)
    : 0

  return (
    <Card tone="ink" padding="md" role="status" aria-live="polite" className="grain-ink relative overflow-hidden lg:p-9">
      <div className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <Badge variant="ink">{depouillement ? "Dépouillement des mesures" : "Relevé en cours"}</Badge>
        <NovaMark aria-hidden className="size-2.5 text-accent" />
        <span className="font-heading text-small tabular-nums text-on-ink-soft">
          {Math.floor(secondes / 60)}:{String(secondes % 60).padStart(2, "0")}
        </span>
      </div>

      <p className="relative mt-5 break-words text-center text-eyebrow uppercase text-on-ink-soft">{url}</p>

      {/*
        Indéterminée tant qu'on attend Google : la durée est inconnue, un
        pourcentage serait inventé. Elle devient exacte au dépouillement, où
        chaque cran correspond à une dimension réellement affichée.
      */}
      <div className="relative mt-6">
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-border-ink">
          {depouillement ? (
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={false}
              animate={{ scaleX: pourcent / 100 }}
              style={{ transformOrigin: "left" }}
              transition={reduce ? { duration: 0 } : { duration: 0.45, ease: EASE_NOVA }}
            />
          ) : reduce ? (
            <div className="h-full w-1/4 rounded-full bg-accent/60" />
          ) : (
            <motion.div
              className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent"
              animate={{ left: ["-35%", "100%"] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
        <p className="mt-3 text-center text-small text-on-ink-soft">
          {depouillement
            ? `${depouillement.faites.length} / ${total} dimensions dépouillées`
            : "Durée inconnue — je n'affiche pas de pourcentage tant que Google n'a pas répondu."}
        </p>
      </div>

      {/* Les deux appareils, côte à côte, chacun avec son état et sa capture. */}
      <div className="relative mt-9 flex items-end justify-center gap-7 sm:gap-10">
        <CadreAppareil type="mobile" etat={etats.mobile} capture={apercus.mobile} reduce={reduce} />
        <CadreAppareil type="desktop" etat={etats.ordinateur} capture={apercus.desktop} reduce={reduce} />
      </div>

      {/* Fil des étapes — quatre jalons, franchis sur un fait observable. */}
      <ol className="relative mt-9 grid grid-cols-4 gap-1">
        <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[11px] h-px bg-border-ink" />
        {ETAPES.map((etape) => {
          const etat = etats[etape.id]
          return (
            <li key={etape.id} className="relative flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "flex size-[23px] shrink-0 items-center justify-center rounded-full border bg-surface-ink transition-colors duration-500 ease-nova",
                  etat === "termine" && "border-accent bg-accent text-ink",
                  etat === "indisponible" && "border-error text-error",
                  etat === "cours" && "border-accent/60 text-accent",
                  etat === "attente" && "border-border-ink text-on-ink-soft"
                )}
              >
                {etat === "termine" ? (
                  <Icon icon={Check} className="size-3" />
                ) : etat === "indisponible" ? (
                  <Icon icon={X} className="size-3" />
                ) : etat === "cours" ? (
                  <Icon icon={Loader2} className={cn("size-3", !reduce && "animate-spin")} />
                ) : (
                  <span className="size-1.5 rounded-full bg-current opacity-40" />
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] uppercase leading-tight tracking-[0.1em] transition-colors duration-500 ease-nova",
                  etat === "attente" ? "text-on-ink-soft/70" : "text-on-ink"
                )}
              >
                {etape.court}
              </span>
            </li>
          )
        })}
      </ol>

      {/* Bas de l'écran : la revue pendant l'attente, les notes au dépouillement. */}
      <div className="relative mt-9 border-t border-border-ink pt-7">
        {depouillement ? (
          <>
            <p className="text-eyebrow uppercase text-on-ink-soft">Vos notes, dimension par dimension</p>
            <ul className="card-list mt-5 flex flex-col gap-3">
              {depouillement.dims.map((d) => {
                const fait = depouillement.faites.includes(d.id)
                const ton = d.note !== null ? TON_NOTE(d.note) : null
                return (
                  <motion.li
                    key={d.id}
                    className="flex items-center gap-3"
                    initial={false}
                    animate={{ opacity: fait ? 1 : 0.32 }}
                    transition={{ duration: 0.3, ease: EASE_NOVA }}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ease-nova",
                        fait ? "border-accent bg-accent text-ink" : "border-border-ink text-on-ink-soft"
                      )}
                    >
                      {fait ? <Icon icon={Check} className="size-2.5" /> : <span className="size-1 rounded-full bg-current" />}
                    </span>
                    <span className="flex-1 text-left text-small text-on-ink">{d.libelle}</span>
                    {fait && (
                      <motion.span
                        className="font-heading text-body tabular-nums"
                        style={{ color: ton ? `var(--color-${d.note! >= 75 ? "success" : d.note! >= 45 ? "warning" : "accent"})` : undefined }}
                        initial={reduce ? false : { opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease: EASE_NOVA }}
                      >
                        {d.note === null ? (
                          <span className="text-small text-on-ink-soft">non mesurée</span>
                        ) : (
                          <>
                            <Compteur valeur={d.note} reduce={reduce} />
                            <span className="text-small text-on-ink-soft">/100</span>
                          </>
                        )}
                      </motion.span>
                    )}
                  </motion.li>
                )
              })}
            </ul>
          </>
        ) : (
          <>
            <p className="text-eyebrow uppercase text-on-ink-soft">Cette analyse passe en revue</p>
            {/*
              Fondu croisé, et non `mode="wait"` : l'attente entre la sortie et
              l'entrée laissait la ligne vide un tiers de seconde à chaque
              rotation, ce qui donnait un clignotement.
            */}
            <div className="relative mt-4 flex h-6 items-center justify-center">
              <AnimatePresence initial={false}>
                <motion.p
                  key={reduce ? "fixe" : revue}
                  className="absolute inset-x-0 text-small text-on-ink"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE_NOVA }}
                >
                  {REVUE[reduce ? 0 : revue]}
                </motion.p>
              </AnimatePresence>
            </div>
            <div aria-hidden className="mt-4 flex items-center justify-center gap-1.5">
              {REVUE.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500 ease-nova",
                    !reduce && i === revue ? "w-5 bg-accent" : "w-1 bg-border-ink"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="relative mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onAnnuler}
          className="border-border-ink text-on-ink hover:border-accent hover:text-accent"
        >
          Annuler l&apos;analyse
        </Button>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Téléchargement du rapport                                                   */
/* -------------------------------------------------------------------------- */
/*
  Le PDF n'est jamais envoyé par mail : il se fabrique dans le navigateur et se
  télécharge d'un clic, autant de fois que voulu. Rien ne transite par un
  service tiers.
*/
function BlocTelechargement({
  rapports,
  url,
}: {
  rapports: Partial<Record<Strategy, RapportPage>>
  url: string
}) {
  const [etat, setEtat] = useState<"pret" | "encours" | "echec">("pret")

  async function telecharger() {
    setEtat("encours")
    try {
      const { construireRapport, telechargerRapport } = await import("@/lib/audit-pdf")
      telechargerRapport(
        construireRapport({
          url,
          prenom: "",
          mobile: rapports.mobile ?? null,
          desktop: rapports.desktop ?? null,
        }),
        url
      )
      setEtat("pret")
    } catch {
      setEtat("echec")
    }
  }

  return (
    <Card tone="ivory" padding="md" accent="left">
      <span className="mx-auto flex size-11 items-center justify-center rounded-md border border-border-strong text-accent-strong">
        <Icon icon={Download} className="size-5" />
      </span>
      <h3 className="mt-5 font-heading text-h3 text-text">Votre rapport complet en PDF</h3>
      <p className="measure mx-auto mt-3 text-small text-text-secondary">
        Toutes les notes, tous les constats, les captures et le plan d&apos;action. Il se génère
        sur votre appareil : rien n&apos;est envoyé, rien n&apos;est stocké.
      </p>
      <div className="mt-7">
        <Button type="button" variant="primary" onClick={telecharger} disabled={etat === "encours"}>
          <Icon icon={Download} />
          {etat === "encours" ? "Génération…" : "Télécharger le PDF"}
        </Button>
      </div>
      {etat === "echec" && (
        <p role="alert" className="mt-4 text-small text-accent-strong">
          La génération a échoué sur cet appareil. Le rapport reste consultable ci-dessous.
        </p>
      )}
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Résultats                                                                   */
/* -------------------------------------------------------------------------- */

function Resultats({
  rapports,
  appareil,
  onAppareil,
  deverrouille,
  barriere,
  reduce,
}: {
  rapports: Partial<Record<Strategy, RapportPage>>
  appareil: Strategy
  onAppareil: (s: Strategy) => void
  deverrouille: boolean
  barriere: React.ReactNode
  reduce: boolean
}) {
  const rapport = rapports[appareil] ?? rapports.mobile ?? rapports.desktop
  const [repere, setRepere] = useState<string | null>(null)
  if (!rapport) return null

  const lesDeux = Boolean(rapports.mobile && rapports.desktop)
  const priorites = rapport.constats.filter((c) => c.priorite === "haute").slice(0, 3)
  const reste = rapport.constats.filter((c) => !priorites.includes(c))
  const bons = rapport.dimensions.filter((d) => d.note !== null && d.note >= 90)

  const synthese =
    rapport.note === null
      ? "L'analyse est partielle : une dimension majeure n'a pas pu être mesurée sur cette page. Les constats ci-dessous restent valables."
      : rapport.note >= 75
        ? "Votre site tient la route. Les points ci-dessous sont des réglages fins, pas des corrections urgentes."
        : rapport.note >= 45
          ? "Votre site fonctionne, mais plusieurs points mesurés gênent la lecture ou la navigation."
          : "Plusieurs défauts mesurés se cumulent sur cette page. Ce sont les plus rentables à corriger en premier."

  return (
    <div className="flex flex-col gap-6">
      {/* 1 — Synthèse */}
      <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden lg:p-9">
        <div className="relative flex items-center justify-center gap-3">
          <Badge variant="ink">Bilan</Badge>
          <NovaMark aria-hidden className="size-2.5 text-accent" />
        </div>

        <div className="relative mt-8 flex flex-col items-center gap-7 sm:flex-row sm:items-start sm:gap-9">
          <div className="flex flex-col items-center gap-2">
            <Anneau note={rapport.note} taille="lg" reduce={reduce} />
            <span className="text-eyebrow uppercase text-on-ink-soft">
              {rapport.note === null ? "Bilan partiel" : "Note globale"}
            </span>
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-eyebrow uppercase text-on-ink-soft">Page analysée</p>
            <p className="mt-2 break-all font-heading text-h3 text-on-ink">{rapport.url}</p>
            <p className="mt-4 text-lead text-on-ink-soft">{synthese}</p>
          </div>
        </div>

        <p className="relative mt-7 border-t border-border-ink pt-5 text-small text-on-ink-soft">
          Pondération : {Object.values(DIMENSIONS).map((d) => `${d.libelle.toLowerCase()} ${Math.round(d.poids * 100)} %`).join(", ")}.
          Une dimension non mesurable sort du calcul au lieu de compter zéro.
        </p>

        {lesDeux && (
          <div className="relative mt-7 flex items-center justify-center gap-3 border-t border-border-ink pt-6">
            <span className="text-eyebrow uppercase text-on-ink-soft">Appareil</span>
            <div className="flex gap-2">
              {(["mobile", "desktop"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onAppareil(s)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-md border px-3 text-eyebrow uppercase outline-none transition-colors duration-200 ease-nova focus-visible:ring-3 focus-visible:ring-ring/35",
                    appareil === s
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

      {/* 2 — Les priorités */}
      {priorites.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-eyebrow uppercase text-text-muted">
            {priorites.length === 1 ? "La priorité" : `Les ${priorites.length} priorités`}
          </p>
          {priorites.map((c, i) => (
            <CarteConstat
              key={c.id}
              constat={c}
              rang={i + 1}
              actif={repere === c.id}
              onSurvol={setRepere}
            />
          ))}
        </div>
      )}

      {/* 3 — Capture annotée */}
      <CaptureAnnotee rapport={rapport} actif={repere} onChoisir={setRepere} />

      {/* Barrière : au-delà, il faut laisser ses coordonnées */}
      {!deverrouille && (
        <>
          <Card tone="ivory" padding="md">
            <span className="mx-auto flex size-11 items-center justify-center rounded-md border border-border-strong text-text-secondary">
              <Icon icon={Lock} className="size-5" />
            </span>
            <h3 className="mt-5 font-heading text-h2 text-text">La suite du rapport</h3>
            <p className="measure mx-auto mt-3 text-body text-text-secondary">
              L&apos;analyse est déjà faite. Voici ce qui reste à afficher :
            </p>
            <ul className="card-list mt-7 flex flex-col gap-3">
              {[
                reste.length > 0 ? `${reste.length} autre${reste.length > 1 ? "s" : ""} constat${reste.length > 1 ? "s" : ""}` : null,
                `Le détail des ${rapport.dimensions.length} dimensions notées`,
                rapport.vitals.length > 0 ? "Les temps ressentis par vos visiteurs" : null,
                bons.length > 0 ? "Ce qui va bien et qu'il faut conserver" : null,
                "Le rapport complet, et son PDF à télécharger",
              ]
                .filter((x): x is string => Boolean(x))
                .map((l) => (
                  <li key={l} className="flex items-baseline gap-3 text-small text-text-secondary">
                    <Icon icon={Check} className="size-3 shrink-0 translate-y-0.5 text-accent" />
                    {l}
                  </li>
                ))}
            </ul>
          </Card>
          {barriere}
        </>
      )}

      {/* 4 à 6 — le reste, une fois déverrouillé */}
      {deverrouille && (
        <>
          <BlocTelechargement rapports={rapports} url={rapport.url} />

          {bons.length > 0 && (
            <Card tone="ivory" padding="md">
              <p className="text-eyebrow uppercase text-text">Ce qui va bien</p>
              <DrawRule className="mt-4" />
              <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3">
                {bons.map((d) => (
                  <li key={d.id} className="flex items-center gap-2.5 text-small text-text">
                    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", CHIP.sage)}>
                      <Icon icon={Check} className="size-3" />
                    </span>
                    {d.libelle}
                    <span className="font-heading tabular-nums text-text-muted">{d.note}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {reste.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-eyebrow uppercase text-text-muted">Les autres constats</p>
              {reste.map((c) => (
                <CarteConstat key={c.id} constat={c} actif={repere === c.id} onSurvol={setRepere} />
              ))}
            </div>
          )}

          <Card padding="md">
            <p className="text-eyebrow uppercase text-text-muted">Le détail par dimension</p>
            <DrawRule className="mt-4" />
            <ul className="mt-6 flex flex-col gap-5">
              {rapport.dimensions.map((d) => (
                <li key={d.id} className="text-left">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-small font-medium text-text">{d.libelle}</span>
                    <span
                      className={cn(
                        "font-heading tabular-nums",
                        d.note === null ? "text-text-muted" : TON_NOTE(d.note).texte
                      )}
                    >
                      {d.note === null ? "non mesuré" : `${d.note} / 100`}
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
                    {d.note !== null && (
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: TON_NOTE(d.note).trait, transformOrigin: "left" }}
                        initial={reduce ? false : { scaleX: 0 }}
                        animate={{ scaleX: d.note / 100 }}
                        transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE_NOVA }}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-small text-text-muted">
                    {d.sens} <span className="text-text-secondary">Poids : {Math.round(d.poids * 100)} %.</span>
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          {rapport.vitals.length > 0 && (
            <Card padding="md">
              <p className="text-eyebrow uppercase text-text-muted">Ce que ressent votre visiteur</p>
              <DrawRule className="mt-4" />
              <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {rapport.vitals.map((v) => (
                  <div key={v.id}>
                    <dt className="flex items-baseline justify-between gap-3">
                      <span className="text-small font-medium text-text">{v.libelle}</span>
                      <span
                        className={cn(
                          "font-heading tabular-nums",
                          v.verdict === "bon" ? "text-success"
                          : v.verdict === "moyen" ? "text-warning"
                          : v.verdict === "faible" ? "text-error"
                          : "text-text-muted"
                        )}
                      >
                        {v.valeur}
                      </span>
                    </dt>
                    <dd className="mt-1.5 text-small text-text-muted">{v.aide}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {/* Ce que l'analyse ne peut pas trancher */}
          <Card tone="ivory" padding="md">
            <p className="text-eyebrow uppercase text-text-muted">Ce que cette analyse n&apos;a pas vérifié</p>
            <DrawRule className="mt-4" />
            <p className="measure mx-auto mt-6 text-small text-text-secondary">
              Une analyse automatique mesure ce qui est mesurable. Ces points-là demandent un
              œil humain — ils ne sont ni notés, ni comptés dans le bilan.
            </p>
            <ul className="card-list mt-6 flex flex-col gap-3">
              {rapport.nonVerifies.map((p) => (
                <li key={p} className="flex items-baseline gap-3 text-small text-text-secondary">
                  <Icon icon={CircleAlert} className="size-3 shrink-0 translate-y-0.5 text-mineral" />
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <p className="text-small text-text-muted">
        Analyse réalisée par l&apos;API Google PageSpeed Insights sur {rapport.url}
        {lesDeux ? ", en versions mobile et ordinateur" : ""}. Les mesures sont relevées en
        laboratoire, sur une connexion simulée.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Relevé envoyé à Studio Digital Nova                                         */
/* -------------------------------------------------------------------------- */

/*
  Relevé complet, en texte brut : c'est ce que reçoit Studio Digital Nova.
  Tout y est — notes par dimension, chaque constat avec sa preuve, sa
  conséquence et la correction, les temps mesurés — pour pouvoir répondre sans
  avoir à relancer l'analyse.
*/
function resumerRapport(r: RapportPage | null, appareil: string): string {
  if (!r) return `${appareil} : analyse non aboutie.`

  const lignes: string[] = []
  lignes.push(`${appareil} — ${r.url}`)
  lignes.push(
    `Note globale : ${r.note === null ? "bilan partiel, non calculée" : `${r.note}/100`}`
  )
  lignes.push("")
  lignes.push("Notes par dimension")
  for (const d of r.dimensions) {
    lignes.push(
      `  ${d.libelle} (${Math.round(d.poids * 100)} %) : ${d.note === null ? "non mesuré" : `${d.note}/100`}`
    )
  }

  lignes.push("")
  if (r.constats.length === 0) {
    lignes.push("Constats : aucun au-dessus du seuil.")
  } else {
    lignes.push(`Constats (${r.constats.length}), du plus grave au moins grave`)
    r.constats.forEach((c, i) => {
      lignes.push("")
      lignes.push(`  ${i + 1}. [${c.priorite}] ${c.constat}`)
      lignes.push(`     Relevé      : ${c.preuve}`)
      lignes.push(`     Conséquence : ${c.consequence}`)
      lignes.push(`     Correction  : ${c.recommandation}`)
      lignes.push(`     Nature      : ${c.nature} · confiance ${c.confiance}${c.zone ? " · situé sur la capture" : ""}`)
    })
  }

  if (r.vitals.length) {
    lignes.push("")
    lignes.push("Temps mesurés")
    for (const v of r.vitals) lignes.push(`  ${v.libelle} : ${v.valeur} (${v.verdict})`)
  }

  return lignes.join("\n")
}

/** Domaine seul : un sujet court et lisible passe mieux les filtres. */
function domaineCourt(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

async function transmettre(champs: Record<string, string>): Promise<boolean> {
  try {
    const rep = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: WEB3FORMS_ACCESS_KEY, ...champs }),
    })
    return Boolean((await rep.json())?.success)
  } catch {
    return false
  }
}

/* -------------------------------------------------------------------------- */
/* Barrière : coordonnées contre rapport complet                               */
/* -------------------------------------------------------------------------- */

function Barriere({
  url,
  rapports,
  onDeverrouille,
}: {
  url: string
  rapports: Partial<Record<Strategy, RapportPage>>
  onDeverrouille: () => void
}) {
  const [prenom, setPrenom] = useState("")
  const [email, setEmail] = useState("")
  const [telephone, setTelephone] = useState("")
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  /* Empêche un second envoi si le visiteur clique deux fois. */
  const dejaEnvoye = useRef(false)

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    if (dejaEnvoye.current || envoi) return
    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setErreur("Merci d'indiquer une adresse email valide.")
      return
    }
    if (telephone.replace(/\D/g, "").length < 9) {
      setErreur("Merci d'indiquer un numéro de téléphone valide.")
      return
    }
    setEnvoi(true)
    setErreur(null)
    dejaEnvoye.current = true

    const fiche = [
      "COORDONNÉES",
      `  Prénom    : ${prenom || "non renseigné"}`,
      `  Email     : ${email}`,
      `  Téléphone : ${telephone}`,
      `  Site      : ${url}`,
      `  Reçu le   : ${new Date().toLocaleString("fr-FR")}`,
      "",
      "────────────────────────────────────────",
      "",
      resumerRapport(rapports.mobile ?? null, "VERSION MOBILE"),
      "",
      "────────────────────────────────────────",
      "",
      resumerRapport(rapports.desktop ?? null, "VERSION ORDINATEUR"),
      "",
      "────────────────────────────────────────",
      "",
      "Le rapport lui a été ouvert sur la page ; le PDF est à sa main. Aucun mail ne lui a été envoyé.",
    ].join("\n")

    const transmis = await transmettre({
      subject: `Demande d\u0027audit — ${domaineCourt(url)}`,
      from_name: prenom || email,
      name: prenom || "Non renseigné",
      email,
      /* Répondre au mail répond directement au visiteur. */
      replyto: email,
      telephone,
      site: url,
      message: fiche,
    })

    if (!transmis) {
      setErreur(
        "Votre fiche n'a pas pu m'être transmise, mais votre rapport est bien débloqué. " +
          "Écrivez-moi à contact@studiodigitalnova.fr si vous voulez que je le commente."
      )
    }

    /*
      Aucun PDF n'est produit ici : laisser ses coordonnées déverrouille le
      rapport, rien de plus. Le visiteur déclenche lui-même le téléchargement
      depuis le bloc dédié — c'est la seule voie, et elle n'existe qu'après
      cette étape.
    */
    setEnvoi(false)
    onDeverrouille()
  }

  return (
    <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden lg:p-9">
      <div className="relative flex items-center justify-center gap-3">
        <Badge variant="ink">Rapport complet</Badge>
        <NovaMark aria-hidden className="size-2.5 text-accent" />
      </div>

      <h3 className="relative mt-7 font-heading text-h2 text-on-ink">
        Vos coordonnées pour accéder au rapport
      </h3>
      <p className="relative mx-auto mt-4 max-w-xl text-lead text-on-ink-soft">
        Le reste de l&apos;analyse s&apos;affiche aussitôt, avec un bouton pour télécharger le
        PDF depuis cette page. <strong className="font-semibold text-on-ink">Je ne vous envoie
        rien</strong> — le fichier se fabrique sur votre appareil. Je lis le rapport de mon côté
        et je reviens vers vous sous 24 heures, sans engagement.
      </p>

      <form onSubmit={soumettre} className="relative mt-8 flex flex-col gap-4 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { id: "prenom", libelle: "Prénom", type: "text", auto: "given-name", v: prenom, set: setPrenom, ph: "Votre prénom" },
            { id: "email", libelle: "Email", type: "email", auto: "email", v: email, set: setEmail, ph: "vous@exemple.com" },
            { id: "telephone", libelle: "Téléphone", type: "tel", auto: "tel", v: telephone, set: setTelephone, ph: "06 12 34 56 78" },
          ].map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
              <label htmlFor={`audit-${c.id}`} className="text-eyebrow uppercase text-on-ink-soft">
                {c.libelle}
              </label>
              <Input
                id={`audit-${c.id}`}
                type={c.type}
                autoComplete={c.auto}
                placeholder={c.ph}
                value={c.v}
                onChange={(e) => c.set(e.target.value)}
                aria-invalid={erreur ? true : undefined}
                aria-describedby={erreur ? "audit-erreur" : undefined}
                className="border-border-ink bg-white/5 text-on-ink placeholder:text-on-ink-soft"
              />
            </div>
          ))}
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
          {envoi ? "Ouverture du rapport…" : "Accéder au rapport complet"}
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
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

function AuditContent() {
  const reduce = Boolean(useReducedMotion())
  const floatIn = useFloatIn()

  const [saisie, setSaisie] = useState("")
  const [urlAnalysee, setUrlAnalysee] = useState("")
  const [phase, setPhase] = useState<Phase>("saisie")
  const [rapports, setRapports] = useState<Partial<Record<Strategy, RapportPage>>>({})
  const [appareil, setAppareil] = useState<Strategy>("mobile")
  const [etats, setEtats] = useState<Record<EtapeId, EtatEtape>>({
    connexion: "attente", mobile: "attente", ordinateur: "attente", bilan: "attente",
  })
  const [apercus, setApercus] = useState<Partial<Record<Strategy, string>>>({})
  const [depouillement, setDepouillement] = useState<Depouillement | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [deverrouille, setDeverrouille] = useState(false)
  const [focus, setFocus] = useState(false)

  /*
    Sans ce repère, le visiteur restait sur le formulaire pendant les vingt
    secondes d'analyse : l'écran de progression s'affichait hors champ, plus
    bas, et le résultat semblait surgir de nulle part. On l'amène à l'écran.
  */
  const zone = useRef<HTMLDivElement | null>(null)

  const abort = useRef<AbortController | null>(null)
  const cache = useRef(new Map<string, Partial<Record<Strategy, RapportPage>>>())
  const disponible = Boolean(PAGESPEED_KEY)

  useEffect(() => () => abort.current?.abort(), [])

  const majEtape = (id: EtapeId, etat: EtatEtape) =>
    setEtats((c) => ({ ...c, [id]: etat }))

  /*
    Les mesures sont arrivées. On les dévoile dimension par dimension avant de
    basculer sur le rapport : le visiteur voit ses notes se poser au lieu de
    recevoir un mur de résultats d'un bloc.

    Rien n'est calculé ici — `dims` vient du moteur, les notes sont déjà
    établies. L'espacement est un choix d'affichage, et lui seul.
  */
  const depouiller = useCallback(
    async (suivant: Partial<Record<Strategy, RapportPage>>, signal: AbortSignal) => {
      const base = suivant.mobile ?? suivant.desktop
      if (!base) return

      const poser = () => {
        setRapports(suivant)
        setAppareil(suivant.mobile ? "mobile" : "desktop")
        setPhase("resultat")
        setDepouillement(null)
      }

      if (reduce) return poser()

      setDepouillement({ dims: base.dimensions, faites: [] })
      for (const d of base.dimensions) {
        await pause(420, signal)
        if (signal.aborted) return
        setDepouillement((c) => (c ? { ...c, faites: [...c.faites, d.id] } : c))
      }
      await pause(900, signal)
      if (signal.aborted) return
      poser()
    },
    [reduce]
  )

  const lancer = useCallback(
    async (e?: React.FormEvent, adresseImposee?: string) => {
      e?.preventDefault()
      if (phase === "analyse") return

      const url = normalizeUrl(adresseImposee ?? saisie)
      if (adresseImposee) setSaisie(adresseImposee)
      if (!url) {
        setErreur("Cette adresse ne semble pas valide. Exemple : monentreprise.fr")
        setPhase("erreur")
        return
      }

      abort.current?.abort()
      const controleur = new AbortController()
      abort.current = controleur

      setUrlAnalysee(url)
      setDeverrouille(false)
      setApercus({})
      setDepouillement(null)
      setErreur(null)

      if (typeof window !== "undefined") {
        const partage = new URL(window.location.href)
        partage.searchParams.set("url", url)
        window.history.replaceState(null, "", partage.toString())
      }

      /*
        Adresse déjà analysée : les mesures sont en mémoire, donc aucune requête
        ne part. Le relevé serait un mensonge — on passe directement au
        dépouillement, qui lui montre de vraies notes.
      */
      const connu = cache.current.get(url)
      if (connu) {
        setApercus({
          ...(connu.mobile?.capture ? { mobile: connu.mobile.capture.data } : {}),
          ...(connu.desktop?.capture ? { desktop: connu.desktop.capture.data } : {}),
        })
        setEtats({ connexion: "termine", mobile: connu.mobile ? "termine" : "indisponible",
                   ordinateur: connu.desktop ? "termine" : "indisponible", bilan: "termine" })
        setPhase("analyse")
        await depouiller(connu, controleur.signal)
        return
      }

      setRapports({})
      setEtats({ connexion: "cours", mobile: "attente", ordinateur: "attente", bilan: "attente" })
      setPhase("analyse")

      /* Chaque piste bascule sur un fait réel : sa requête a abouti, ou non. */
      const piste = (appareilCible: Strategy, etape: EtapeId) => {
        majEtape(etape, "cours")
        return runAudit(url, appareilCible, controleur.signal).then(
          (r) => {
            majEtape("connexion", "termine")
            majEtape(etape, "termine")
            if (r.capture) setApercus((a) => ({ ...a, [appareilCible]: r.capture!.data }))
            return r
          },
          (cause) => {
            majEtape(etape, "indisponible")
            throw cause
          }
        )
      }

      const [m, o] = await Promise.allSettled([piste("mobile", "mobile"), piste("desktop", "ordinateur")])
      if (controleur.signal.aborted) return

      const suivant: Partial<Record<Strategy, RapportPage>> = {}
      if (m.status === "fulfilled") suivant.mobile = m.value
      if (o.status === "fulfilled") suivant.desktop = o.value

      if (!suivant.mobile && !suivant.desktop) {
        majEtape("connexion", "indisponible")
        majEtape("bilan", "indisponible")
        const raison = m.status === "rejected" ? m.reason : null
        setErreur(
          raison instanceof AuditError
            ? raison.message
            : "L'analyse n'a pas abouti pour cette adresse."
        )
        setPhase("erreur")
        return
      }

      majEtape("bilan", "termine")
      cache.current.set(url, suivant)

      void transmettre({
        subject: `Audit lancé sur ${domaineCourt(url)}`,
        from_name: "Audit automatique",
        name: "Visiteur anonyme",
        email: "contact@studiodigitalnova.fr",
        site: url,
        message:
          `Un visiteur vient d'analyser ${url}. Aucune coordonnée laissée à ce stade.\n\n` +
          `${resumerRapport(suivant.mobile ?? null, "MOBILE")}\n\n` +
          `${resumerRapport(suivant.desktop ?? null, "ORDINATEUR")}`,
      })

      await depouiller(suivant, controleur.signal)
    },
    [saisie, phase, depouiller]
  )

  function reinitialiser() {
    abort.current?.abort()
    setPhase("saisie")
    setRapports({})
    setEtats({ connexion: "attente", mobile: "attente", ordinateur: "attente", bilan: "attente" })
    setApercus({})
    setDepouillement(null)
    setErreur(null)
    setDeverrouille(false)
    if (typeof window !== "undefined") {
      const propre = new URL(window.location.href)
      propre.searchParams.delete("url")
      window.history.replaceState(null, "", propre.toString())
    }
  }

  /*
    L'écran d'analyse vit plus bas que le formulaire : sans ce défilement, le
    visiteur soumet son adresse et ne voit rien bouger. On l'y conduit dès que
    l'analyse démarre — ou dès qu'une erreur doit être lue.
  */
  useEffect(() => {
    if (phase !== "analyse" && phase !== "erreur") return
    zone.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  }, [phase, reduce])

  /* Lien partagé : `?url=` relance la même analyse à l'ouverture. */
  const dejaLance = useRef(false)
  useEffect(() => {
    if (dejaLance.current || !disponible) return
    const partagee = new URLSearchParams(window.location.search).get("url")
    if (!partagee) return
    dejaLance.current = true
    const id = setTimeout(() => void lancer(undefined, partagee), 0)
    return () => clearTimeout(id)
  }, [disponible, lancer])

  const rapportCourant = rapports[appareil] ?? rapports.mobile ?? rapports.desktop ?? null

  return (
    <>
      {/* ---- A. Premier écran ------------------------------------------- */}
      <PageHero
        eyebrow="Audit gratuit"
        icon={Gauge}
        title={
          <>
            Votre site donne-t-il envie de vous{" "}
            <span className="whitespace-nowrap text-[1.15em] italic leading-[0] text-accent">
              appeler
            </span>{" "}
            ?
          </>
        }
        lead={
          <>
            Collez l&apos;adresse de votre site. En une minute, vous voyez ce qu&apos;un
            visiteur voit vraiment : les textes se lisent-ils, la page tient-elle en place, les
            images sont-elles nettes, sait-on comment vous joindre.{" "}
            <strong className="font-semibold text-text">Gratuit, sans inscription.</strong>
          </>
        }
        split
        aside={
          <div className="hidden lg:block">
            <p className="text-eyebrow uppercase text-text-muted">Exemple de rapport</p>
            <Card padding="sm" className="mt-3 text-left">
              <div className="relative overflow-hidden rounded-md border border-border bg-background">
                <div className="flex flex-col gap-2 p-4">
                  <div className="h-2.5 w-2/3 rounded-full bg-text/70" />
                  <div className="h-2 w-1/2 rounded-full bg-border" />
                  <div className="mt-2 h-14 rounded-md" style={{ backgroundImage: "var(--gradient-ink)" }} />
                </div>
                <span className="absolute left-[10%] top-[16%] flex size-4 items-center justify-center rounded-[2px] bg-accent font-heading text-[10px] text-accent-foreground">
                  1
                </span>
                <span
                  aria-hidden
                  className="absolute left-[10%] top-[16%] h-6 w-[58%] rounded-[3px] border-2 border-accent"
                />
              </div>
              <p className="mt-4 text-eyebrow uppercase text-accent-strong">Constat n° 1</p>
              <p className="mt-2 text-small text-text">Des textes manquent de contraste</p>
              <p className="mt-1 text-small text-text-muted">
                Difficile à lire au soleil. Assombrir le texte jusqu&apos;à 4,5:1.
              </p>
              <p className="mt-4 border-t border-border pt-3 text-[11px] uppercase tracking-[0.14em] text-text-muted">
                Exemple illustratif — pas un vrai site
              </p>
            </Card>
          </div>
        }
      >
        <div className="w-full">
          <form onSubmit={lancer} className="w-full">
            {/*
              Sous 640 px, le bouton sort du cadre de saisie et passe en pleine
              largeur dessous : deux éléments empilés dans une même bordure
              donnaient une boîte lourde et mal équilibrée.
            */}
            <div
              className={cn(
                "relative rounded-xl border bg-surface shadow-sm transition-[border-color,box-shadow] duration-500 ease-nova",
                "p-0 sm:p-2",
                focus ? "border-accent shadow-[0_0_0_4px_rgba(217,108,79,0.10)]" : "border-border-strong"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <div className="relative flex-1">
                  <Icon
                    icon={Search}
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                  />
                  {/*
                    `type="text"` et non `type="url"` : le navigateur exige un
                    schéma sur un champ `url` et refusait « monentreprise.fr »
                    — l'exemple donné par le champ lui-même — avec une bulle
                    « Veuillez saisir une URL. ». Le formulaire ne partait pas.
                    La validation revient à `normalizeUrl`, qui complète le
                    schéma et répond en français quand l'adresse est fautive.
                  */}
                  <Input
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    spellCheck={false}
                    placeholder="monentreprise.fr"
                    aria-label="Adresse de votre site"
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                    disabled={phase === "analyse"}
                    className="h-14 border-transparent bg-transparent pl-11 text-lead shadow-none focus-visible:border-transparent focus-visible:ring-0 sm:h-13"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={phase === "analyse" || !disponible}
                  className="hidden h-13 shrink-0 sm:inline-flex"
                >
                  {phase === "analyse" ? "Analyse en cours…" : "Analyser mon site"}
                  {phase !== "analyse" && <Icon icon={ArrowRight} />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={phase === "analyse" || !disponible}
              className="mt-3 h-13 w-full sm:hidden"
            >
              {phase === "analyse" ? "Analyse en cours…" : "Analyser mon site"}
              {phase !== "analyse" && <Icon icon={ArrowRight} />}
            </Button>
            <p className="mt-4 text-small text-text-muted">
              L&apos;adresse analysée m&apos;est transmise pour que je puisse suivre les demandes.
              Aucune autre donnée n&apos;est collectée tant que vous ne remplissez pas le formulaire.
            </p>
            {!disponible && (
              <p className="mt-3 text-small text-accent-strong">
                L&apos;analyse automatique est momentanément indisponible. Écrivez-moi et je la
                lance de mon côté.
              </p>
            )}
          </form>
        </div>
      </PageHero>

      {/* ---- Zone d'analyse, de résultat ou d'erreur --------------------- */}
      <Section className="bg-surface" spacing="default">
        <div ref={zone} className="mx-auto max-w-3xl scroll-mt-24">
          <AnimatePresence>
            {phase === "analyse" && (
              <motion.div
                key="analyse"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_NOVA }}
              >
                <EcranProgression
                  url={urlAnalysee}
                  etats={etats}
                  apercus={apercus}
                  depouillement={depouillement}
                  reduce={reduce}
                  onAnnuler={reinitialiser}
                />
              </motion.div>
            )}

            {phase === "erreur" && (
              <motion.div
                key="erreur"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_NOVA }}
              >
                <Card padding="md" accent="left">
                  <p className="text-eyebrow uppercase text-accent-strong">L&apos;analyse n&apos;a pas abouti</p>
                  <p className="measure mx-auto mt-4 text-body text-text-secondary">{erreur}</p>
                  <div className="mt-7">
                    <Button type="button" variant="outline" onClick={reinitialiser}>
                      <Icon icon={RotateCcw} />
                      Réessayer
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {phase === "resultat" && rapportCourant && (
              <motion.div
                key="resultat"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_NOVA }}
              >
                <Resultats
                  rapports={rapports}
                  appareil={appareil}
                  onAppareil={setAppareil}
                  deverrouille={deverrouille}
                  reduce={reduce}
                  barriere={
                    <Barriere
                      url={urlAnalysee}
                      rapports={rapports}
                      onDeverrouille={() => setDeverrouille(true)}
                    />
                  }
                />

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button type="button" variant="outline" onClick={reinitialiser}>
                    <Icon icon={RotateCcw} />
                    Analyser une autre adresse
                  </Button>
                  <Link href="/#contact" className="group">
                    <Button variant="primary">
                      <Icon icon={Mail} />
                      Parler de ces corrections
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Section>

      {/* ---- B. Trois dimensions ---------------------------------------- */}
      <Section spacing="default">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-eyebrow uppercase text-text-muted">Ce que j&apos;examine</p>
          <Heading variant="h2" className="mt-4 text-center">
            Ce que je regarde, et dans quel ordre
          </Heading>

          <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icone: Eye,
                chip: CHIP.terracotta,
                titre: "Apparence et lisibilité",
                poids: "50 % de la note",
                texte:
                  "C'est ce qu'un visiteur juge en trois secondes, avant d'avoir lu une ligne. Contraste des textes, stabilité de la page pendant le chargement, netteté des images, taille des boutons sous le doigt.",
              },
              {
                icone: Send,
                chip: CHIP.mineral,
                titre: "Parcours et contact",
                poids: "20 %",
                texte:
                  "Un visiteur convaincu doit pouvoir vous joindre sans chercher. Liens dont on comprend la destination, boutons nommés, navigation que Google sait suivre jusqu'à vous.",
              },
              {
                icone: ShieldCheck,
                chip: CHIP.ink,
                titre: "Qualité technique",
                poids: "30 % au total",
                texte:
                  "Le socle : vitesse d'affichage, bases du référencement, HTTPS, erreurs en arrière-plan. Invisible quand tout va bien, coûteux quand ça ne va pas.",
              },
            ].map((d, i) => (
              <motion.div
                key={d.titre}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={floatIn(i * 0.07, { y: 40 }, { damping: 26, mass: 2 })}
              >
                <Card tone="ivory" padding="md" className="flex h-full flex-col">
                  <span className={cn("mx-auto flex size-11 items-center justify-center rounded-md", d.chip)}>
                    <Icon icon={d.icone} className="size-5" />
                  </span>
                  <p className="mt-5 text-eyebrow uppercase text-accent-strong">{d.poids}</p>
                  <h3 className="mt-2 font-heading text-h3 text-text">{d.titre}</h3>
                  <p className="mt-3 text-small text-text-secondary">{d.texte}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="measure mx-auto mt-10 text-center text-small text-text-muted">
            Une dimension qui ne peut pas être mesurée sur votre page ne compte pas zéro : elle
            sort du calcul, et le bilan est annoncé comme partiel.
          </p>
        </div>
      </Section>

      {/* ---- D. Fonctionnement ------------------------------------------ */}
      <Section className="bg-surface" spacing="default">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-eyebrow uppercase text-text-muted">Comment ça marche</p>
          <Heading variant="h2" className="mt-4 text-center">
            Trois étapes, et c&apos;est tout
          </Heading>
          <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { icone: Link2, titre: "Vous collez votre adresse", texte: "Pas de compte, rien à installer." },
              { icone: Gauge, titre: "J'analyse les deux versions", texte: "Mobile et ordinateur, via l'API Google PageSpeed Insights." },
              { icone: Download, titre: "Vous lisez le bilan", texte: "La note et le point le plus grave s'affichent tout de suite. Le rapport complet et son PDF se débloquent avec vos coordonnées — le PDF se télécharge sur la page, rien n'est envoyé." },
            ].map((e, i) => (
              <motion.div
                key={e.titre}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={floatIn(i * 0.07, { y: 40 }, { damping: 26, mass: 2 })}
              >
                <Card padding="md" className="flex h-full flex-col">
                  <CardIndex value={String(i + 1).padStart(2, "0")} />
                  <span className="mx-auto mt-6 flex size-11 items-center justify-center rounded-md border border-border-strong text-text-secondary">
                    <Icon icon={e.icone} className="size-5" />
                  </span>
                  <h3 className="mt-5 font-heading text-h3 text-text">{e.titre}</h3>
                  <p className="mt-3 text-small text-text-secondary">{e.texte}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ---- Méthodologie, repliée ------------------------------------- */}
      <Section spacing="sm">
        <div className="mx-auto max-w-3xl">
          <details className="group rounded-xl border border-border bg-surface p-6 text-left">
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-heading text-h3 text-text outline-none marker:content-[''] focus-visible:ring-3 focus-visible:ring-ring/35">
              Comment la note est calculée
              <Icon
                icon={ArrowRight}
                className="size-4 shrink-0 text-accent transition-transform duration-300 ease-nova group-open:rotate-90"
              />
            </summary>
            <div className="mt-6 flex flex-col gap-4 text-small text-text-secondary">
              <p>
                La mesure vient de l&apos;API Google PageSpeed Insights, la même que
                pagespeed.web.dev. Je ne la modifie pas : je la repondère.
              </p>
              <ul className="card-list flex flex-col gap-2">
                {Object.values(DIMENSIONS).map((d) => (
                  <li key={d.libelle} className="flex items-baseline gap-3 tabular-nums">
                    <span className="w-12 shrink-0 text-right font-heading text-accent-strong">
                      {Math.round(d.poids * 100)} %
                    </span>
                    {d.libelle}
                  </li>
                ))}
              </ul>
              <p>
                Les audits qui alimentent « apparence » sont volontairement <em>disjoints</em> de
                la catégorie Performance de Google : sans cela, un même défaut serait compté deux
                fois.
              </p>
              <p>
                Chaque constat porte sa nature — <strong className="text-text">mesuré</strong>,{" "}
                <strong className="text-text">apprécié</strong> ou{" "}
                <strong className="text-text">non vérifié</strong>. L&apos;analyse ne juge ni vos
                textes, ni votre offre, ni vos concurrents : ces points sont listés à part, sans
                note.
              </p>
            </div>
          </details>
        </div>
      </Section>

      {/* ---- F. Contact -------------------------------------------------- */}
      <Section spacing="default">
        <div className="mx-auto max-w-3xl">
          <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden lg:p-9">
            <span aria-hidden className="relative mb-4 flex items-center justify-center gap-2 text-accent">
              <span className="h-px w-8 bg-accent/50" />
              <NovaMark className="size-3" />
              <span className="h-px w-8 bg-accent/50" />
            </span>
            <Heading variant="h2" className="text-on-ink">
              Et si on corrigeait tout ça ?
            </Heading>
            <p className="measure relative mx-auto mt-6 text-lead text-on-ink-soft">
              Vous avez la liste. Reste à l&apos;appliquer — et c&apos;est mon métier. On part de
              vos résultats, je vous dis ce que ça représente, et vous décidez. Devis clair sous
              24 heures, sans engagement.
            </p>
            <div className="relative mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/#contact" className="group">
                <Button variant="primary" className="bg-paper text-ink hover:bg-accent hover:text-ink">
                  Demander un devis
                  <Icon icon={ArrowRight} className="transition-transform duration-200 ease-nova group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/#tarifs" className="group">
                <Button variant="outline" className="border-border-ink text-on-ink hover:border-accent hover:text-accent">
                  Voir les tarifs
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </Section>
    </>
  )
}

export { AuditContent }
