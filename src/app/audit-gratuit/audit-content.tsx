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
  PERIMETRES,
  normalizeUrl,
  runAudit,
  type Constat,
  type DimensionId,
  type NoteDimension,
  type Perimetre,
  type RapportPage,
  type Strategy,
} from "@/lib/audit"
import { suiteProposee } from "@/lib/audit-offre"
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

/*
  Le parcours se fait en quatre temps, et le visiteur sait toujours où il en
  est : l'adresse, les coordonnées, l'analyse, le rapport. Demander les
  coordonnées AVANT l'analyse change tout — la personne voit son audit se faire
  pour elle, au lieu de buter sur un mur à mi-parcours.
*/
type Phase = "adresse" | "coordonnees" | "analyse" | "resultat" | "erreur"

/** Ce que le visiteur a laissé avant que l'analyse démarre. */
type Contact = { prenom: string; email: string; telephone: string }

/** Hauteur réservée sous l'en-tête collant quand on amène une étape à l'écran. */
const MARGE_HAUT = 96

const PARCOURS: { id: Phase; numero: number; titre: string }[] = [
  { id: "adresse", numero: 1, titre: "Votre adresse" },
  { id: "coordonnees", numero: 2, titre: "Vos coordonnées" },
  { id: "analyse", numero: 3, titre: "L'analyse" },
  { id: "resultat", numero: 4, titre: "Votre rapport" },
]

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

/*
  Une carte sort par la gauche, la suivante entre par la droite : le parcours
  se lit comme une progression, pas comme un rechargement.
*/
function glisse(reduce: boolean) {
  if (reduce) return {}
  return {
    initial: { opacity: 0, x: 28 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -28 },
    transition: { duration: 0.34, ease: EASE_NOVA },
  }
}

/* -------------------------------------------------------------------------- */
/* Le barème, les trois systèmes côte à côte                                   */
/* -------------------------------------------------------------------------- */
/*
  C'était un bandeau déroulant qui ne montrait qu'une pondération sur trois.
  Trois onglets, une barre proportionnelle : on voit la répartition avant de
  lire le détail, et on compare les trois systèmes sans cliquer ailleurs.
*/
const COULEUR_DIMENSION: Record<DimensionId, string> = {
  apparence: "var(--color-accent)",
  parcours: "var(--color-mineral)",
  performance: "var(--color-warning)",
  referencement: "var(--color-success)",
  pratiques: "var(--color-text-muted)",
}

function Bareme({ reduce }: { reduce: boolean }) {
  const cles = Object.keys(PERIMETRES) as Perimetre[]
  const [actif, setActif] = useState<Perimetre>("complet")
  const onglets = useRef<(HTMLButtonElement | null)[]>([])

  const perimetre = PERIMETRES[actif]
  const total = perimetre.dimensions.reduce((s, id) => s + DIMENSIONS[id].poids, 0)
  const parts = perimetre.dimensions.map((id) => ({
    id,
    libelle: DIMENSIONS[id].libelle,
    sens: DIMENSIONS[id].sens,
    part: DIMENSIONS[id].poids / total,
  }))

  /* Flèches, Origine et Fin : un jeu d'onglets se parcourt au clavier. */
  function auClavier(e: React.KeyboardEvent, index: number) {
    const sauts: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: cles.length - 1,
    }
    const cible = sauts[e.key]
    if (cible === undefined) return
    e.preventDefault()
    const suivant = (cible + cles.length) % cles.length
    setActif(cles[suivant])
    onglets.current[suivant]?.focus()
  }

  return (
    <Card padding="md" className="text-left lg:p-9">
      <p className="text-center text-eyebrow uppercase text-text-muted">Le barème</p>
      <Heading variant="h3" className="mt-4 text-center">
        Comment la note est calculée
      </Heading>
      <p className="measure mx-auto mt-4 text-center text-small text-text-secondary">
        La mesure vient de l&apos;API Google PageSpeed Insights, la même que pagespeed.web.dev.
        Je ne la modifie pas : je la repondère selon ce que vous demandez d&apos;examiner.
      </p>

      <div
        role="tablist"
        aria-label="Systèmes de calcul"
        className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center"
      >
        {cles.map((cle, i) => {
          const choisi = cle === actif
          return (
            <button
              key={cle}
              ref={(el) => { onglets.current[i] = el }}
              role="tab"
              type="button"
              id={`bareme-onglet-${cle}`}
              aria-selected={choisi}
              aria-controls={`bareme-panneau-${cle}`}
              tabIndex={choisi ? 0 : -1}
              onClick={() => setActif(cle)}
              onKeyDown={(e) => auClavier(e, i)}
              className={cn(
                "relative flex min-h-11 items-center justify-center rounded-md px-5 text-small outline-none transition-colors duration-300 ease-nova focus-visible:ring-3 focus-visible:ring-ring/35",
                choisi ? "text-paper" : "text-text-secondary hover:text-text"
              )}
            >
              {choisi && (
                <motion.span
                  layoutId={reduce ? undefined : "bareme-actif"}
                  aria-hidden
                  className="absolute inset-0 rounded-md bg-ink"
                  transition={{ duration: 0.32, ease: EASE_NOVA }}
                />
              )}
              <span className="relative font-heading">{PERIMETRES[cle].libelle}</span>
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`bareme-panneau-${actif}`}
        aria-labelledby={`bareme-onglet-${actif}`}
        className="mt-8"
      >
        <p className="text-center text-small text-text-secondary">{perimetre.promesse}</p>

        {/* La répartition, en une barre : la proportion se voit avant de se lire. */}
        <div className="mt-6 flex h-3 w-full overflow-hidden rounded-full bg-surface-sunken">
          {parts.map((p) => (
            <motion.span
              key={p.id}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ backgroundColor: COULEUR_DIMENSION[p.id] }}
              initial={false}
              animate={{ width: `${p.part * 100}%` }}
              transition={reduce ? { duration: 0 } : { duration: 0.45, ease: EASE_NOVA }}
            />
          ))}
        </div>

        <ul className="card-list mt-7 flex flex-col gap-4">
          {parts.map((p) => (
            <motion.li
              key={p.id}
              className="flex items-baseline gap-3"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_NOVA }}
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 translate-y-1 rounded-full"
                style={{ backgroundColor: COULEUR_DIMENSION[p.id] }}
              />
              <span className="w-12 shrink-0 text-right font-heading tabular-nums text-text">
                {Math.round(p.part * 100)} %
              </span>
              <span className="text-small text-text-secondary">
                <strong className="font-semibold text-text">{p.libelle}</strong> — {p.sens}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <p className="measure mx-auto text-center text-small text-text-muted">
          Une dimension non mesurable sort du calcul au lieu de compter zéro. Les audits qui
          alimentent « apparence » sont volontairement disjoints de la catégorie Performance de
          Google : sans cela, un même défaut serait compté deux fois.
        </p>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Fil du parcours                                                             */
/* -------------------------------------------------------------------------- */
/*
  Quatre pastilles, visibles dès que le parcours est engagé. Savoir qu'il reste
  deux étapes, et lesquelles, vaut mieux que de découvrir un formulaire au
  moment où l'on croyait avoir fini.
*/
function FilParcours({ phase, reduce }: { phase: Phase; reduce: boolean }) {
  const courant = PARCOURS.findIndex((e) => e.id === phase)
  if (courant < 0) return null
  const etape = PARCOURS[courant]

  return (
    <nav aria-label="Étapes de l'audit" className="mb-8">
      <ol className="flex items-start justify-center">
        {PARCOURS.map((e, i) => {
          const fait = i < courant
          const actif = i === courant
          return (
            <li key={e.id} className="flex items-start">
              <div className="flex w-16 flex-col items-center gap-2 sm:w-24">
                <motion.span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border font-heading text-small tabular-nums transition-colors duration-500 ease-nova",
                    fait && "border-accent bg-accent text-paper",
                    actif && "border-accent bg-accent/10 text-accent-strong",
                    !fait && !actif && "border-border text-text-muted"
                  )}
                  animate={actif && !reduce ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                  transition={
                    actif && !reduce
                      ? { duration: 2.4, repeat: Infinity, ease: EASE_NOVA }
                      : { duration: 0.3, ease: EASE_NOVA }
                  }
                >
                  {fait ? <Icon icon={Check} className="size-3.5" /> : e.numero}
                </motion.span>
                <span
                  className={cn(
                    "hidden text-center text-[11px] uppercase leading-tight tracking-[0.1em] transition-colors duration-500 ease-nova sm:block",
                    actif ? "text-text" : "text-text-muted"
                  )}
                >
                  {e.titre}
                </span>
              </div>
              {i < PARCOURS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "mt-4 h-px w-4 shrink-0 transition-colors duration-500 ease-nova sm:w-8",
                    fait ? "bg-accent" : "bg-border"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
      {/* Sous 640 px les intitulés ne tiennent pas côte à côte : une ligne suffit. */}
      <p className="mt-3 text-center text-small text-text-muted sm:hidden">
        Étape {etape.numero} sur {PARCOURS.length} — <span className="text-text">{etape.titre}</span>
      </p>
    </nav>
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
        <p className="mt-3 text-center text-small text-on-ink">
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
                  etat === "attente" ? "text-on-ink-soft" : "text-on-ink"
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
  prenom,
  perimetre,
}: {
  rapports: Partial<Record<Strategy, RapportPage>>
  url: string
  prenom: string
  perimetre: Perimetre
}) {
  const [etat, setEtat] = useState<"pret" | "encours" | "echec">("pret")

  async function telecharger() {
    setEtat("encours")
    try {
      const { construireRapport, telechargerRapport } = await import("@/lib/audit-pdf")
      telechargerRapport(
        construireRapport({
          url,
          prenom,
          perimetre,
          mobile: rapports.mobile ?? null,
          desktop: rapports.desktop ?? null,
        }),
        url,
        prenom
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
  prenom,
  reduce,
}: {
  rapports: Partial<Record<Strategy, RapportPage>>
  appareil: Strategy
  onAppareil: (s: Strategy) => void
  prenom: string
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
            <p className="mt-2 text-small text-on-ink-soft">
              Regard demandé :{" "}
              <span className="text-on-ink">{PERIMETRES[rapport.perimetre].libelle.toLowerCase()}</span>{" "}
              — {PERIMETRES[rapport.perimetre].resume.toLowerCase()}.
            </p>
            <p className="mt-4 text-lead text-on-ink-soft">{synthese}</p>
          </div>
        </div>

        <p className="relative mt-7 border-t border-border-ink pt-5 text-small text-on-ink-soft">
          {/*
            La pondération affichée est celle qui a servi, renormalisée sur le
            périmètre demandé — pas la grille générale, qui ne correspondrait à
            rien quand une partie du barème est hors sujet.
          */}
          Pondération :{" "}
          {(() => {
            const total = rapport.dimensions.reduce((s, d) => s + d.poids, 0)
            return rapport.dimensions
              .map((d) => `${d.libelle.toLowerCase()} ${Math.round((d.poids / total) * 100)} %`)
              .join(", ")
          })()}
          . Une dimension non mesurable sort du calcul au lieu de compter zéro.
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

      {/*
        4 à 6 — le rapport en entier. Plus rien n'est masqué : les coordonnées
        ont été laissées avant l'analyse.
      */}
      <BlocTelechargement
        rapports={rapports}
        url={rapport.url}
        prenom={prenom}
        perimetre={rapport.perimetre}
      />

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

      {/* Ce qui suit l'analyse : deux prestations au plus, choisies d'après ce qui a été mesuré. */}
      {(() => {
        const suite = suiteProposee(rapport, rapport.perimetre)
        return (
          <Card tone="ivory" padding="md">
            <p className="text-eyebrow uppercase text-accent-strong">{suite.titre}</p>
            <DrawRule className="mt-4" />
            <p className="measure mx-auto mt-6 text-body text-text-secondary">{suite.phrase}</p>
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {suite.prestations.map((pr) => (
                <Link key={pr.lien} href={pr.lien} className="group">
                  <Card padding="sm" interactive className="h-full">
                    <p className="font-heading text-body text-text">{pr.nom}</p>
                    <p className="mt-2 text-small text-text-secondary">{pr.ligne}</p>
                    {pr.prix && (
                      <p className="mt-3 text-eyebrow uppercase text-accent-strong">{pr.prix}</p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
            <p className="mt-7 text-small text-text-muted">
              Devis gratuit sous 24 heures, sans engagement —{" "}
              <a
                href="mailto:contact@studiodigitalnova.fr"
                className="text-accent-strong underline decoration-accent/40 underline-offset-4"
              >
                contact@studiodigitalnova.fr
              </a>
            </p>
          </Card>
        )
      })()}

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
  lignes.push(`Périmètre : ${PERIMETRES[r.perimetre].libelle} — ${PERIMETRES[r.perimetre].resume}`)
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
  /*
    Deux tentatives : une coupure réseau d'une seconde ne doit pas faire perdre
    un prospect qui a laissé son numéro.
  */
  for (let essai = 0; essai < 2; essai++) {
    try {
      const rep = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: WEB3FORMS_ACCESS_KEY, ...champs }),
      })
      if ((await rep.json())?.success) return true
    } catch {
      /* on retente une fois */
    }
    if (essai === 0) await new Promise((r) => setTimeout(r, 1200))
  }
  return false
}

/*
  Le seul message qui part vers Studio Digital Nova, et il part une seule fois :
  les coordonnées et l'audit complet dans le même envoi. Deux mails séparés
  obligeaient à les rapprocher à la main.

  Il part aussi quand l'analyse échoue : la personne a laissé son numéro, ce
  n'est pas le moment de la perdre.
*/
async function signaler(
  contact: Contact,
  url: string,
  rapports: Partial<Record<Strategy, RapportPage>>,
  echec: string | null
): Promise<boolean> {
  const base = rapports.mobile ?? rapports.desktop ?? null

  const audit = echec
    ? [
        "L'ANALYSE N'A PAS ABOUTI",
        `  Motif : ${echec}`,
        "",
        "  Les coordonnées restent valables — à rappeler.",
      ].join("\n")
    : [
        "SYNTHÈSE",
        `  Note globale : ${base?.note == null ? "non calculée (bilan partiel)" : `${base.note}/100`}`,
        `  Constats     : ${base?.constats.length ?? 0}`,
        "",
        "────────────────────────────────────────",
        "",
        resumerRapport(rapports.mobile ?? null, "VERSION MOBILE"),
        "",
        "────────────────────────────────────────",
        "",
        resumerRapport(rapports.desktop ?? null, "VERSION ORDINATEUR"),
      ].join("\n")

  const suite = suiteProposee(base, base?.perimetre ?? "complet")

  const corps = [
    "COORDONNÉES",
    `  Prénom    : ${contact.prenom || "non renseigné"}`,
    `  Email     : ${contact.email}`,
    `  Téléphone : ${contact.telephone}`,
    `  Site      : ${url}`,
    `  Reçu le   : ${new Date().toLocaleString("fr-FR")}`,
    "",
    "────────────────────────────────────────",
    "",
    audit,
    "",
    "────────────────────────────────────────",
    "",
    "PISTE COMMERCIALE (celle affichée dans son rapport)",
    `  ${suite.phrase}`,
    ...suite.prestations.map((pr) => `  · ${pr.nom}${pr.prix ? ` — ${pr.prix}` : ""}`),
    "",
    "Le rapport s'est ouvert sur la page et le PDF est à sa main.",
    "Aucun mail ne lui a été envoyé.",
  ].join("\n")

  return transmettre({
    subject: `Audit ${contact.prenom || contact.email} — ${domaineCourt(url)}`,
    from_name: contact.prenom || contact.email,
    name: contact.prenom || "Non renseigné",
    /* Répondre au message répond directement au visiteur. */
    email: contact.email,
    replyto: contact.email,
    telephone: contact.telephone,
    site: url,
    message: corps,
  })
}

/* -------------------------------------------------------------------------- */
/* Étape 1 : l'adresse                                                         */
/* -------------------------------------------------------------------------- */
/*
  Première carte du parcours. Elle vit au même endroit que les trois suivantes
  — le visiteur ne change jamais de zone, ce sont les cartes qui défilent.
*/
function CarteAdresse({
  saisie,
  onSaisie,
  perimetre,
  onPerimetre,
  onSoumettre,
  disponible,
  reduce,
}: {
  saisie: string
  onSaisie: (v: string) => void
  perimetre: Perimetre
  onPerimetre: (p: Perimetre) => void
  onSoumettre: (e: React.FormEvent) => void
  disponible: boolean
  reduce: boolean
}) {
  const [focus, setFocus] = useState(false)

  return (
    <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden lg:p-9">
      <div className="relative flex items-center justify-center gap-3">
        <Badge variant="ink">Étape 1 sur 4</Badge>
        <NovaMark aria-hidden className="size-2.5 text-accent" />
      </div>

      <h2 className="relative mt-7 font-heading text-h2 text-on-ink">
        Quelle adresse dois-je regarder ?
      </h2>
      <p className="relative mx-auto mt-4 max-w-xl text-lead text-on-ink">
        Collez l&apos;adresse de votre site. Pas besoin du{" "}
        <span className="whitespace-nowrap">https://</span> — je m&apos;en occupe.
      </p>

      <form onSubmit={onSoumettre} className="relative mt-8">
        <div
          className={cn(
            "rounded-xl border p-0 transition-[border-color,box-shadow] duration-500 ease-nova sm:p-2",
            focus
              ? "border-accent shadow-[0_0_0_4px_rgba(217,108,79,0.18)]"
              : "border-border-ink"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:gap-2">
            <div className="relative flex-1">
              <Icon
                icon={Search}
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-on-ink-soft"
              />
              {/*
                `type="text"` et non `type="url"` : le navigateur exige un schéma
                sur un champ `url` et refusait « monentreprise.fr » — l'exemple
                donné par le champ lui-même. La validation revient à
                `normalizeUrl`, qui complète le schéma et répond en français.
              */}
              <Input
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                placeholder="monentreprise.fr"
                aria-label="Adresse de votre site"
                value={saisie}
                onChange={(e) => onSaisie(e.target.value)}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                className="h-14 border-transparent bg-transparent pl-11 text-lead text-on-ink shadow-none placeholder:text-on-ink-soft focus-visible:border-transparent focus-visible:ring-0 sm:h-13"
              />
            </div>
            {/* Sur mobile le bouton sort du cadre : deux blocs dans une même bordure alourdissent. */}
            <Button
              type="submit"
              variant="primary"
              disabled={!disponible}
              className="hidden h-13 shrink-0 bg-paper text-ink hover:bg-accent hover:text-ink sm:inline-flex"
            >
              Analyser mon site
              <Icon icon={ArrowRight} />
            </Button>
          </div>
        </div>

        {/*
          Ce qu'on regarde. Le choix se fait ici, avant l'adresse validée :
          il change les catégories demandées à Google, les dimensions notées,
          la pondération de la note et la suite proposée.
        */}
        <fieldset className="mt-7">
          <legend className="mx-auto mb-4 text-eyebrow uppercase text-on-ink-soft">
            Que dois-je regarder ?
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.keys(PERIMETRES) as Perimetre[]).map((cle) => {
              const p = PERIMETRES[cle]
              const actif = perimetre === cle
              return (
                <button
                  key={cle}
                  type="button"
                  onClick={() => onPerimetre(cle)}
                  aria-pressed={actif}
                  className={cn(
                    "relative flex min-h-11 flex-col items-center gap-1.5 rounded-lg border p-4 text-center outline-none transition-[border-color,background-color,transform] duration-300 ease-nova focus-visible:ring-3 focus-visible:ring-ring/35",
                    actif
                      ? "border-accent bg-accent/12"
                      : "border-border-ink hover:border-on-ink-soft"
                  )}
                >
                  {actif && (
                    <motion.span
                      layoutId={reduce ? undefined : "perimetre-actif"}
                      aria-hidden
                      className="absolute inset-0 rounded-lg border-2 border-accent"
                      transition={{ duration: 0.3, ease: EASE_NOVA }}
                    />
                  )}
                  <span className={cn("relative font-heading text-body", actif ? "text-on-ink" : "text-on-ink-soft")}>
                    {p.libelle}
                  </span>
                  <span className="relative text-small leading-snug text-on-ink-soft">{p.resume}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-4 text-small text-on-ink">{PERIMETRES[perimetre].promesse}</p>
        </fieldset>

        <Button
          type="submit"
          variant="primary"
          disabled={!disponible}
          className="mt-6 h-13 w-full bg-paper text-ink hover:bg-accent hover:text-ink sm:hidden"
        >
          Analyser mon site
          <Icon icon={ArrowRight} />
        </Button>

        {!disponible && (
          <p className="mt-4 text-small text-accent">
            L&apos;analyse automatique est momentanément indisponible. Écrivez-moi et je la lance
            de mon côté.
          </p>
        )}
      </form>

      <div aria-hidden className="relative mx-auto mt-9 h-px w-24 bg-border-ink" />

      {/* Ce qui attend le visiteur : dit une fois, en trois lignes. */}
      <ul className="card-list relative mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-8">
        {[
          { icone: Smartphone, texte: "Vos deux versions, mobile et ordinateur" },
          { icone: Eye, texte: "Les défauts situés sur votre capture" },
          { icone: Download, texte: "Un rapport PDF à télécharger" },
        ].map((l) => (
          <li key={l.texte} className="flex items-baseline gap-3 text-small text-on-ink">
            <Icon icon={l.icone} className="size-3.5 shrink-0 translate-y-0.5 text-accent" />
            {l.texte}
          </li>
        ))}
      </ul>

      {/* Discret, mais il installe l'idée : un vrai document sort de là. */}
      <motion.div
        className="relative mx-auto mt-9 w-full max-w-xs"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: EASE_NOVA }}
      >
        <p className="text-eyebrow uppercase text-on-ink-soft">Exemple de rapport</p>
        <div className="mt-3 overflow-hidden rounded-md border border-border-ink bg-white p-4 text-left">
          <div className="relative overflow-hidden rounded-[3px]">
            <div className="flex flex-col gap-2">
              <div className="h-2.5 w-2/3 rounded-full bg-ink/70" />
              <div className="h-2 w-1/2 rounded-full bg-ink/15" />
              <div className="mt-2 h-14 rounded-md" style={{ backgroundImage: "var(--gradient-ink)" }} />
            </div>
            <span className="absolute left-0 top-[6%] flex size-4 items-center justify-center rounded-[2px] bg-accent font-heading text-[10px] text-accent-foreground">
              1
            </span>
            <span aria-hidden className="absolute left-0 top-[6%] h-6 w-[58%] rounded-[3px] border-2 border-accent" />
          </div>
          <p className="mt-4 text-eyebrow uppercase text-accent-strong">Constat n° 1</p>
          <p className="mt-2 text-small text-ink">Des textes manquent de contraste</p>
          <p className="mt-1 text-small text-ink/60">
            Difficile à lire au soleil. Assombrir le texte jusqu&apos;à 4,5:1.
          </p>
          <p className="mt-4 border-t border-ink/10 pt-3 text-[11px] uppercase tracking-[0.14em] text-ink/50">
            Exemple illustratif — pas un vrai site
          </p>
        </div>
      </motion.div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Étape 2 : les coordonnées, avant l'analyse                                  */
/* -------------------------------------------------------------------------- */
/*
  Rien n'est envoyé d'ici : l'analyse n'a pas encore eu lieu. Cet écran ne fait
  que recueillir de quoi rappeler la personne. Le relevé complet part une seule
  fois, à la fin, avec les coordonnées et l'audit dans le même message.
*/
function EcranCoordonnees({
  url,
  perimetre,
  onValide,
  onRetour,
}: {
  url: string
  perimetre: Perimetre
  onValide: (contact: Contact) => void
  onRetour: () => void
}) {
  const [prenom, setPrenom] = useState("")
  const [email, setEmail] = useState("")
  const [telephone, setTelephone] = useState("")
  const [erreur, setErreur] = useState<string | null>(null)
  /*
    Le clic doit se voir tout de suite. La carte met un tiers de seconde à
    s'effacer : sans cet état, le bouton reste inerte pendant ce temps et on
    clique deux fois.
  */
  const [parti, setParti] = useState(false)

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    if (parti) return
    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setErreur("Merci d'indiquer une adresse email valide.")
      return
    }
    if (telephone.replace(/\D/g, "").length < 9) {
      setErreur("Merci d'indiquer un numéro de téléphone valide.")
      return
    }
    setErreur(null)
    setParti(true)
    onValide({ prenom: prenom.trim(), email: email.trim(), telephone: telephone.trim() })
  }

  return (
    <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden lg:p-9">
      <div className="relative flex items-center justify-center gap-3">
        <Badge variant="ink">Étape 2 sur 4</Badge>
        <NovaMark aria-hidden className="size-2.5 text-accent" />
      </div>

      <h2 className="relative mt-7 font-heading text-h2 text-on-ink">
        À qui j&apos;envoie mes remarques ?
      </h2>
      <p className="relative mx-auto mt-4 max-w-xl text-lead text-on-ink">
        J&apos;examine <strong className="font-semibold text-on-ink">{domaineCourt(url)}</strong>{" "}
        sous l&apos;angle «&nbsp;{PERIMETRES[perimetre].libelle.toLowerCase()}&nbsp;». Une trentaine
        de secondes, et le rapport s&apos;affiche ici même, en entier, avec son PDF à télécharger.
      </p>

      <ul className="card-list relative mt-7 flex flex-col gap-3">
        {[
          "Le rapport complet s'ouvre sur cette page, rien à attendre.",
          "Le PDF se fabrique sur votre appareil, d'un clic.",
          "Je lis votre analyse de mon côté et je vous réponds sous 24 heures.",
        ].map((l) => (
          <li key={l} className="flex items-baseline gap-3 text-small text-on-ink">
            <Icon icon={Check} className="size-3 shrink-0 translate-y-0.5 text-accent" />
            {l}
          </li>
        ))}
      </ul>

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
          disabled={parti}
          className="mt-2 w-full bg-paper text-ink hover:bg-accent hover:text-ink sm:mx-auto sm:w-fit"
        >
          {parti ? (
            <>
              <Icon icon={Loader2} className="animate-spin" />
              Je lance l&apos;analyse…
            </>
          ) : (
            <>
              Lancer l&apos;analyse
              <Icon icon={ArrowRight} />
            </>
          )}
        </Button>

        <p className="text-small text-on-ink">
          Vos coordonnées me servent uniquement à vous recontacter au sujet de cette analyse.
          Aucune inscription, aucune revente, aucune relance automatique.
        </p>

        <button
          type="button"
          onClick={onRetour}
          className="mx-auto -my-1 min-h-11 text-small text-on-ink-soft underline decoration-border-ink underline-offset-4 transition-colors duration-200 ease-nova hover:text-on-ink"
        >
          Changer d&apos;adresse
        </button>
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
  const [phase, setPhase] = useState<Phase>("adresse")
  const [rapports, setRapports] = useState<Partial<Record<Strategy, RapportPage>>>({})
  const [appareil, setAppareil] = useState<Strategy>("mobile")
  const [etats, setEtats] = useState<Record<EtapeId, EtatEtape>>({
    connexion: "attente", mobile: "attente", ordinateur: "attente", bilan: "attente",
  })
  const [apercus, setApercus] = useState<Partial<Record<Strategy, string>>>({})
  const [depouillement, setDepouillement] = useState<Depouillement | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  /* Ce que le visiteur a demandé de regarder. Tout en découle. */
  const [perimetre, setPerimetre] = useState<Perimetre>("complet")

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

  /*
    Étape 1 → 2. On retient l'adresse et on demande les coordonnées. Rien n'est
    mesuré ici : aucune requête ne part tant que la personne ne s'est pas
    présentée.
  */
  const validerAdresse = useCallback(
    (e?: React.FormEvent, adresseImposee?: string) => {
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
      setUrlAnalysee(url)
      setRapports({})
      setApercus({})
      setDepouillement(null)
      setEtats({ connexion: "attente", mobile: "attente", ordinateur: "attente", bilan: "attente" })
      setErreur(null)
      setPhase("coordonnees")

      if (typeof window !== "undefined") {
        const partage = new URL(window.location.href)
        partage.searchParams.set("url", url)
        window.history.replaceState(null, "", partage.toString())
      }
    },
    [saisie, phase]
  )

  /* Étape 2 → 3 → 4. Les coordonnées sont là : l'analyse peut partir. */
  const lancerAnalyse = useCallback(
    async (qui: Contact) => {
      const url = urlAnalysee
      if (!url) return

      setContact(qui)
      abort.current?.abort()
      const controleur = new AbortController()
      abort.current = controleur

      setApercus({})
      setDepouillement(null)
      setErreur(null)

      /*
        Adresse déjà analysée : les mesures sont en mémoire, donc aucune requête
        ne part. Le relevé serait un mensonge — on passe directement au
        dépouillement, qui lui montre de vraies notes.
      */
      const connu = cache.current.get(`${perimetre}|${url}`)
      if (connu) {
        setApercus({
          ...(connu.mobile?.capture ? { mobile: connu.mobile.capture.data } : {}),
          ...(connu.desktop?.capture ? { desktop: connu.desktop.capture.data } : {}),
        })
        setEtats({ connexion: "termine", mobile: connu.mobile ? "termine" : "indisponible",
                   ordinateur: connu.desktop ? "termine" : "indisponible", bilan: "termine" })
        setPhase("analyse")
        void signaler(qui, url, connu, null)
        await depouiller(connu, controleur.signal)
        return
      }

      setRapports({})
      setEtats({ connexion: "cours", mobile: "attente", ordinateur: "attente", bilan: "attente" })
      setPhase("analyse")

      /* Chaque piste bascule sur un fait réel : sa requête a abouti, ou non. */
      const piste = (appareilCible: Strategy, etape: EtapeId) => {
        majEtape(etape, "cours")
        return runAudit(url, appareilCible, controleur.signal, perimetre).then(
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
        const message =
          raison instanceof AuditError
            ? raison.message
            : "L'analyse n'a pas abouti pour cette adresse."
        setErreur(message)
        /* La personne s'est présentée : sa fiche part, même sans audit. */
        void signaler(qui, url, {}, message)
        setPhase("erreur")
        return
      }

      majEtape("bilan", "termine")
      cache.current.set(`${perimetre}|${url}`, suivant)

      void signaler(qui, url, suivant, null)

      await depouiller(suivant, controleur.signal)
    },
    [urlAnalysee, perimetre, depouiller]
  )

  function reinitialiser() {
    abort.current?.abort()
    setPhase("adresse")
    setSaisie("")
    setUrlAnalysee("")
    setContact(null)
    setRapports({})
    setEtats({ connexion: "attente", mobile: "attente", ordinateur: "attente", bilan: "attente" })
    setApercus({})
    setDepouillement(null)
    setErreur(null)
    if (typeof window !== "undefined") {
      const propre = new URL(window.location.href)
      propre.searchParams.delete("url")
      window.history.replaceState(null, "", propre.toString())
    }
  }

  /*
    Tout le parcours se joue plus bas que le formulaire du hero : sans ce
    défilement, le visiteur soumet son adresse et ne voit rien bouger. On
    l'accompagne à chaque changement d'étape.
  */
  useEffect(() => {
    if (phase === "adresse") return
    /*
      Position calculée, et non `scrollIntoView` : pendant que la hauteur du
      panneau se réajuste d'une étape à l'autre, `scrollIntoView` visait une
      cible mouvante et dépassait de près de mille pixels. Le haut du fil ne
      bouge pas, lui — on s'y rend directement, une fois la carte échangée.
    */
    const id = setTimeout(() => {
      const cadre = zone.current
      if (!cadre) return
      const haut = cadre.getBoundingClientRect().top + window.scrollY - MARGE_HAUT
      window.scrollTo({ top: Math.max(0, haut), behavior: reduce ? "auto" : "smooth" })
    }, 420)
    return () => clearTimeout(id)
  }, [phase, reduce])

  /*
    Lien partagé : `?url=` reprend l'adresse et amène directement à l'étape des
    coordonnées. Aucune analyse ne démarre toute seule — elle consomme du quota
    et n'a de sens qu'une fois la personne présentée.
  */
  const dejaRepris = useRef(false)
  useEffect(() => {
    if (dejaRepris.current || !disponible) return
    const partagee = new URLSearchParams(window.location.search).get("url")
    if (!partagee) return
    dejaRepris.current = true
    const id = setTimeout(() => validerAdresse(undefined, partagee), 0)
    return () => clearTimeout(id)
  }, [disponible, validerAdresse])

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
        childrenVariant="bloc"
      >
        {/*
          Tout le parcours tient ici, dans un seul cadre. Le visiteur ne change
          jamais de zone : le fil reste en place et les cartes se relaient à
          l'intérieur. La hauteur se réajuste toute seule (`layout`), sans à-coup
          entre deux étapes de tailles différentes.
        */}
        <div ref={zone} className="mx-auto w-full max-w-3xl scroll-mt-24">
          <FilParcours phase={phase} reduce={reduce} />

          <motion.div layout={!reduce} transition={{ duration: 0.45, ease: EASE_NOVA }}>
            <AnimatePresence mode="wait" initial={false}>
              {phase === "adresse" && (
                <motion.div key="adresse" {...glisse(reduce)}>
                  <CarteAdresse
                    saisie={saisie}
                    onSaisie={setSaisie}
                    perimetre={perimetre}
                    onPerimetre={setPerimetre}
                    onSoumettre={validerAdresse}
                    disponible={disponible}
                    reduce={reduce}
                  />
                </motion.div>
              )}

              {phase === "coordonnees" && (
                <motion.div key="coordonnees" {...glisse(reduce)}>
                  <EcranCoordonnees
                    url={urlAnalysee}
                    perimetre={perimetre}
                    onValide={(qui) => void lancerAnalyse(qui)}
                    onRetour={reinitialiser}
                  />
                </motion.div>
              )}

              {phase === "analyse" && (
                <motion.div key="analyse" {...glisse(reduce)}>
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
                <motion.div key="erreur" {...glisse(reduce)}>
                  <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden lg:p-9">
                    <div className="relative flex items-center justify-center gap-3">
                      <Badge variant="ink">Analyse interrompue</Badge>
                      <NovaMark aria-hidden className="size-2.5 text-accent" />
                    </div>
                    <h2 className="relative mt-7 font-heading text-h2 text-on-ink">
                      Je n&apos;ai pas pu aller au bout
                    </h2>
                    <p className="measure relative mx-auto mt-4 text-lead text-on-ink">{erreur}</p>
                    <div className="relative mt-8">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={reinitialiser}
                        className="border-border-ink text-on-ink hover:border-accent hover:text-accent"
                      >
                        <Icon icon={RotateCcw} />
                        Reprendre depuis le début
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {phase === "resultat" && rapportCourant && (
                <motion.div key="resultat" {...glisse(reduce)}>
                  {contact?.prenom && (
                    <p className="mb-6 text-center text-lead text-text-secondary">
                      Voilà votre rapport,{" "}
                      <strong className="font-semibold text-text">{contact.prenom}</strong>.
                    </p>
                  )}

                  <Resultats
                    rapports={rapports}
                    appareil={appareil}
                    onAppareil={setAppareil}
                    prenom={contact?.prenom ?? ""}
                    reduce={reduce}
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
          </motion.div>
        </div>
      </PageHero>
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

      {/* ---- Le barème, les trois systèmes ------------------------------ */}
      <Section spacing="sm">
        <div className="mx-auto max-w-3xl">
          <Bareme reduce={reduce} />
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
