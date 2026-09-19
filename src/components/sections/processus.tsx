"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Palette,
  Rocket,
  Search,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { NovaMark } from "@/components/ui/nova"
import { Section } from "@/components/ui/section"
import { EASE_NOVA, useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

/* ==========================================================================
   MA MÉTHODE — FRISE HORIZONTALE
   ==========================================================================
   Six étapes alignées sur un rail horizontal, à toutes les tailles d'écran.
   L'étape active porte l'accent terracotta, les précédentes sont teintées,
   les suivantes restent neutres : on lit la progression d'un coup d'œil.

   Sous le rail, une carte en deux parties — le texte sur un fond très
   légèrement terracotta, l'aperçu sur le bleu nuit.

   Pas de lecture automatique : le visiteur avance quand il le décide, au
   clic, aux flèches du clavier ou en faisant glisser le rail sur mobile.
   ========================================================================== */
/* ==========================================================================
   APERÇUS DE LA FRISE
   ==========================================================================
   Un visuel par étape, posé sur le bleu nuit. Chacun montre l'objet réel de
   l'étape — une note de cadrage, une maquette, un navigateur en construction,
   un cadran de mesure, une liste de relecture, une mise en ligne. Aucun n'est
   réutilisé d'une étape à l'autre.

   Tout est en CSS et SVG : pas d'image à charger, et le rendu suit les tokens
   de la charte.
   ========================================================================== */

type ApercuProps = { reduce: boolean }

const CADRE =
  "relative h-full min-h-[172px] w-full overflow-hidden rounded-lg border border-border-ink bg-ink/40 p-4"

/** 01 — Découverte : la note de cadrage qui se remplit. */
function ApercuDecouverte({ reduce }: ApercuProps) {
  return (
    <div className={CADRE}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-on-ink-soft">Note de cadrage</p>
      <div className="mt-4 flex flex-col gap-2.5">
        {[88, 64, 76].map((largeur, i) => (
          <div key={largeur} className="flex items-center gap-2.5">
            <motion.span
              className="size-3 shrink-0 rounded-[3px] border border-accent/70"
              initial={reduce ? false : { backgroundColor: "rgba(217,108,79,0)" }}
              animate={{ backgroundColor: "rgba(217,108,79,0.9)" }}
              transition={reduce ? { duration: 0 } : { duration: 0.35, delay: 0.25 + i * 0.18 }}
            />
            <motion.span
              className="h-1.5 rounded-full bg-on-ink-soft/35"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${largeur}%` }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, delay: 0.2 + i * 0.18 }}
            />
          </div>
        ))}
      </div>
      <p className="absolute bottom-4 left-4 font-heading text-small text-accent">Périmètre validé</p>
    </div>
  )
}

/** 02 — Maquette : blocs de mise en page et nuancier. */
function ApercuMaquette({ reduce }: ApercuProps) {
  return (
    <div className={CADRE}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-on-ink-soft">Maquette</p>
      <div className="mt-4 flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <motion.div
            className="h-8 rounded-[5px] bg-on-ink-soft/25"
            initial={reduce ? false : { scaleY: 0.2, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            style={{ transformOrigin: "top" }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 0.15 }}
          />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-10 rounded-[5px] border border-border-ink"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.35, delay: 0.3 + i * 0.09 }}
              />
            ))}
          </div>
        </div>
        <div className="flex w-7 flex-col gap-1.5">
          {["var(--color-ink-700)", "var(--color-accent)", "var(--color-mineral)", "var(--color-on-ink-soft)"].map(
            (c, i) => (
              <motion.span
                key={c}
                className="h-5 rounded-[4px]"
                style={{ backgroundColor: c }}
                initial={reduce ? false : { opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 0.45 + i * 0.07 }}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

/** 03 — Développement : le navigateur qui se construit, ligne à ligne. */
function ApercuDeveloppement({ reduce }: ApercuProps) {
  return (
    <div className={CADRE}>
      <div className="flex items-center gap-1.5 border-b border-border-ink pb-2.5">
        <span className="size-1.5 rounded-full bg-on-ink-soft/40" />
        <span className="size-1.5 rounded-full bg-on-ink-soft/40" />
        <span className="size-1.5 rounded-full bg-on-ink-soft/40" />
        <span className="ml-2 h-1.5 flex-1 rounded-full bg-on-ink-soft/15" />
      </div>
      <div className="mt-3 flex flex-col gap-1.5 font-mono">
        {[42, 68, 30, 56, 48].map((largeur, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 text-right text-[9px] tabular-nums text-on-ink-soft/40">{i + 1}</span>
            <motion.span
              className={`h-1.5 rounded-full ${i === 2 ? "bg-accent/70" : "bg-on-ink-soft/30"}`}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${largeur}%` }}
              transition={reduce ? { duration: 0 } : { duration: 0.32, delay: 0.18 + i * 0.1 }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** 04 — Optimisation : le cadran de mesure qui monte. */
function ApercuOptimisation({ reduce }: ApercuProps) {
  return (
    <div className={`${CADRE} flex items-center gap-5`}>
      <div className="relative size-[76px] shrink-0">
        <svg viewBox="0 0 36 36" className="size-full -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-border-ink)" strokeWidth="2.5" />
          <motion.circle
            cx="18" cy="18" r="15.5" fill="none"
            stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 0.94 }}
            transition={reduce ? { duration: 0 } : { duration: 0.9, delay: 0.2 }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-heading text-body text-on-ink">
          94
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {["Vitesse", "Référencement", "Accessibilité"].map((label, i) => (
          <div key={label}>
            <p className="text-[10px] text-on-ink-soft">{label}</p>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border-ink">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: [0.82, 0.9, 0.86][i] }}
                style={{ transformOrigin: "left" }}
                transition={reduce ? { duration: 0 } : { duration: 0.55, delay: 0.3 + i * 0.12 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 05 — Validation : la relecture qui se coche. */
function ApercuValidation({ reduce }: ApercuProps) {
  return (
    <div className={CADRE}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-on-ink-soft">Relecture</p>
      <div className="mt-4 flex flex-col gap-3">
        {["Textes et images", "Mobile et ordinateur", "Formulaire de contact"].map((label, i) => (
          <div key={label} className="flex items-center gap-2.5">
            <motion.span
              className="flex size-4 shrink-0 items-center justify-center rounded-full border border-accent/60"
              initial={reduce ? false : { backgroundColor: "rgba(217,108,79,0)" }}
              animate={{ backgroundColor: "rgba(217,108,79,0.95)" }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 0.3 + i * 0.22 }}
            >
              <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
                <motion.path
                  d="M2.5 6.2 L5 8.6 L9.5 3.6" fill="none"
                  stroke="var(--color-ink)" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.25, delay: 0.42 + i * 0.22 }}
                />
              </svg>
            </motion.span>
            <span className="text-[11px] text-on-ink-soft">{label}</span>
          </div>
        ))}
      </div>
      <p className="absolute bottom-4 left-4 font-heading text-small text-accent">Bon pour publication</p>
    </div>
  )
}

/** 06 — Mise en ligne : l'adresse qui bascule en ligne. */
function ApercuMiseEnLigne({ reduce }: ApercuProps) {
  return (
    <div className={`${CADRE} flex flex-col justify-center`}>
      <div className="flex items-center gap-2 rounded-md border border-border-ink bg-ink/60 px-3 py-2">
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <span className="truncate text-[11px] text-on-ink-soft">votre-entreprise.fr</span>
      </div>
      <motion.div
        className="mt-3 flex items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/10 py-2"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 0.35 }}
      >
        <motion.span
          className="size-1.5 rounded-full bg-accent"
          animate={reduce ? { opacity: 1 } : { opacity: [1, 0.35, 1] }}
          transition={reduce ? undefined : { duration: 2, repeat: Infinity, ease: EASE_NOVA }}
        />
        <span className="text-[10px] uppercase tracking-[0.16em] text-accent">En ligne</span>
      </motion.div>
      <p className="mt-3 text-center text-[10px] text-on-ink-soft">Certificat SSL actif</p>
    </div>
  )
}

/*
  Le contenu de chaque étape. `benefice` répond à « qu'est-ce que j'y gagne »,
  `livrable` à « qu'est-ce que je reçois concrètement ». Rien ici n'est promis
  au-delà de ce que l'offre tient réellement.
*/
const ETAPES = [
  {
    numero: "01",
    nom: "Découverte",
    icone: Search,
    benefice: "On cadre tout avant d'écrire la moindre ligne",
    explication:
      "Un échange sur votre activité, vos clients et ce que le site doit leur faire faire. C'est ce qui évite les mauvaises surprises en cours de route.",
    livrable: "Un périmètre écrit et un devis clair sous 24 heures",
    Apercu: ApercuDecouverte,
  },
  {
    numero: "02",
    nom: "Maquette",
    icone: Palette,
    benefice: "Vous voyez votre site avant qu'il existe",
    explication:
      "Couleurs, typographie et structure des pages sont posés et vous sont soumis. Rien n'est développé tant que vous n'avez pas validé.",
    livrable: "Une maquette complète, avec les allers-retours nécessaires",
    Apercu: ApercuMaquette,
  },
  {
    numero: "03",
    nom: "Développement",
    icone: Code2,
    benefice: "Le site est construit, pas assemblé depuis un thème",
    explication:
      "La maquette devient un vrai site : code propre, affichage soigné sur mobile comme sur ordinateur, testé sur les navigateurs courants.",
    livrable: "Un site responsive et fonctionnel, prêt à être relu",
    Apercu: ApercuDeveloppement,
  },
  {
    numero: "04",
    nom: "Optimisation",
    icone: Zap,
    benefice: "Rapide et trouvable, pas seulement agréable à regarder",
    explication:
      "Vitesse de chargement, bases du référencement et accessibilité sont repris en détail. C'est le travail qu'on ne voit pas et qui décide de vos visites.",
    livrable: "Les mesures avant / après, et les réglages appliqués",
    Apercu: ApercuOptimisation,
  },
  {
    numero: "05",
    nom: "Validation",
    icone: ClipboardCheck,
    benefice: "Rien ne part en ligne sans votre accord",
    explication:
      "On relit ensemble, page par page : les textes, les images, le formulaire. Les derniers ajustements sont faits à ce moment-là.",
    livrable: "Une relecture complète avec vous, ajustements compris",
    Apercu: ApercuValidation,
  },
  {
    numero: "06",
    nom: "Mise en ligne",
    icone: Rocket,
    benefice: "Votre site est publié, et vous en gardez la main",
    explication:
      "Publication sur votre nom de domaine, certificat de sécurité en place. Je reste joignable après la mise en ligne.",
    livrable: "Le site en ligne, avec le certificat SSL actif",
    Apercu: ApercuMiseEnLigne,
  },
] as const

/* -------------------------------------------------------------------------- */
/* Le rail                                                                     */
/* -------------------------------------------------------------------------- */

function Rail({
  actif,
  onChoisir,
  idOnglets,
  idPanneau,
  reduce,
}: {
  actif: number
  onChoisir: (i: number) => void
  idOnglets: string
  idPanneau: string
  reduce: boolean
}) {
  const railRef = useRef<HTMLDivElement | null>(null)
  const boutons = useRef<(HTMLButtonElement | null)[]>([])

  /* L'étape active est ramenée dans le champ quand le rail déborde (mobile). */
  useEffect(() => {
    const b = boutons.current[actif]
    const rail = railRef.current
    if (!b || !rail || rail.scrollWidth <= rail.clientWidth) return
    const cible = b.offsetLeft - rail.clientWidth / 2 + b.offsetWidth / 2
    rail.scrollTo({ left: Math.max(0, cible), behavior: reduce ? "auto" : "smooth" })
  }, [actif, reduce])

  const auClavier = (e: React.KeyboardEvent) => {
    const suivant =
      e.key === "ArrowRight" ? actif + 1
      : e.key === "ArrowLeft" ? actif - 1
      : e.key === "Home" ? 0
      : e.key === "End" ? ETAPES.length - 1
      : null
    if (suivant === null) return
    e.preventDefault()
    const i = Math.max(0, Math.min(ETAPES.length - 1, suivant))
    onChoisir(i)
    boutons.current[i]?.focus()
  }

  return (
    <div
      ref={railRef}
      role="tablist"
      aria-label="Les six étapes de la méthode"
      onKeyDown={auClavier}
      className={cn(
        "rail-mobile -mx-4 gap-0 px-4 pb-3 md:mx-0 md:overflow-visible md:px-0 md:pb-0",
        "md:flex md:justify-between"
      )}
    >
      {/*
        Le trait de liaison vit DANS chaque repère, en deux moitiés posées de
        part et d'autre de la pastille. Tracé en un seul segment absolu sur le
        conteneur, il devait être masqué sous 768 px : le rail y défile
        horizontalement, et un trait calé sur `left-0 right-0` s'arrêtait au
        bord visible au lieu de suivre le contenu. Découpé ainsi, il suit les
        repères à toutes les largeurs, défilement compris.
      */}
      {ETAPES.map((etape, i) => {
        const estActif = i === actif
        const estPasse = i < actif
        return (
          <button
            key={etape.numero}
            ref={(el) => {
              boutons.current[i] = el
            }}
            role="tab"
            id={`${idOnglets}-${i}`}
            aria-selected={estActif}
            aria-controls={idPanneau}
            tabIndex={estActif ? 0 : -1}
            onClick={() => onChoisir(i)}
            className={cn(
              "group relative flex w-[104px] shrink-0 snap-center flex-col items-center gap-2.5",
              "rounded-md pt-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
              "md:w-auto md:flex-1"
            )}
          >
            {/*
              UN seul segment par intervalle, et non deux demi-traits recollés
              au bord des repères : à cet endroit-là, deux éléments voisins se
              séparaient d'une fraction de pixel et le trait paraissait
              pointillé.

              Celui-ci part du bord droit de la pastille et déborde dans le
              repère suivant jusqu'au bord gauche de la sienne. Les repères
              étant de largeur égale, `calc(-50% + 18px)` tombe exactement
              dessus — 18 px étant le rayon d'une pastille de 36.
            */}
            {i < ETAPES.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-[22px] left-[calc(50%+18px)] right-[calc(-50%+18px)] h-px transition-colors duration-500 ease-nova",
                  i < actif ? "bg-ink" : "bg-border"
                )}
              />
            )}

            <span
              className={cn(
                "relative z-10 flex size-9 items-center justify-center rounded-full border bg-background",
                "transition-[background-color,border-color,color,transform] duration-300 ease-nova",
                estActif
                  ? "scale-110 border-accent bg-accent text-accent-foreground"
                  : estPasse
                    ? "border-ink/35 bg-ink/8 text-ink"
                    : "border-border text-text-muted group-hover:border-border-strong"
              )}
            >
              <Icon icon={etape.icone} className="size-4" />
            </span>
            <span
              className={cn(
                "font-heading text-[11px] tabular-nums transition-colors duration-300 ease-nova",
                estActif ? "text-accent-strong" : "text-text-muted"
              )}
            >
              {etape.numero}
            </span>
            <span
              className={cn(
                "text-center text-small leading-tight transition-colors duration-300 ease-nova",
                estActif ? "font-semibold text-text" : "text-text-secondary"
              )}
            >
              {etape.nom}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* La carte de détail                                                          */
/* -------------------------------------------------------------------------- */

function CarteEtape({
  index,
  idPanneau,
  idOnglets,
  reduce,
}: {
  index: number
  idPanneau: string
  idOnglets: string
  reduce: boolean
}) {
  const etape = ETAPES[index]
  return (
    <div
      role="tabpanel"
      id={idPanneau}
      aria-labelledby={`${idOnglets}-${index}`}
      tabIndex={0}
      className="mt-10 overflow-hidden rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
    >
      <motion.div
        key={etape.numero}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE_NOVA }}
        className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]"
      >
        {/* Texte — fond papier à peine teinté de terracotta. */}
        <div className="bg-[color-mix(in_oklab,var(--color-accent)_5%,var(--color-surface))] p-6 text-left sm:p-8">
          <p className="flex items-center gap-2.5 text-eyebrow uppercase text-accent-strong">
            <span className="font-heading tabular-nums">{etape.numero}</span>
            <span aria-hidden className="h-px w-6 bg-accent/50" />
            {etape.nom}
          </p>

          <h3 className="mt-4 font-heading text-h2 text-text">{etape.benefice}</h3>
          <p className="measure mt-4 text-body text-text-secondary">{etape.explication}</p>

          <div className="mt-7 flex items-start gap-3 border-t border-border pt-5">
            <NovaMark aria-hidden className="mt-1 size-3 shrink-0 text-accent" />
            <p className="text-small text-text">
              <span className="text-eyebrow uppercase text-text-muted">Ce que vous recevez</span>
              <br />
              {etape.livrable}
            </p>
          </div>
        </div>

        {/* Aperçu — bleu nuit. */}
        <div className="grain-ink relative flex items-stretch bg-surface-ink p-5 sm:p-6">
          <etape.Apercu reduce={reduce} />
        </div>
      </motion.div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Section                                                                     */
/* -------------------------------------------------------------------------- */

function Processus() {
  const floatIn = useFloatIn()
  const reduce = Boolean(useReducedMotion())
  const [actif, setActif] = useState(0)
  const base = useId()
  const idOnglets = `${base}-onglet`
  const idPanneau = `${base}-panneau`

  const aller = useCallback((i: number) => {
    setActif(Math.max(0, Math.min(ETAPES.length - 1, i)))
  }, [])

  return (
    <Section id="ma-methode" className="scroll-mt-24 bg-surface">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
        <motion.div
          className="mb-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -40, scale: 0.85 })}
        >
          <Badge variant="outline">
            <NovaMark aria-hidden className="size-3 text-accent" />
            Ma méthode
          </Badge>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.12, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h2">6 étapes pour donner vie à votre projet</Heading>
        </motion.div>

        <motion.p
          className="measure mt-6 text-lead text-text-secondary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.22, { y: 40 })}
        >
          Un <strong className="font-semibold text-text">processus clair et éprouvé</strong>, de
          la première idée à la mise en ligne. Choisissez une étape pour voir ce qu&apos;elle
          produit.
        </motion.p>
      </div>

      <motion.div
        className="relative mt-[var(--section-gap)]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={floatIn(0.1, { y: 48 })}
      >
        <Rail
          actif={actif}
          onChoisir={aller}
          idOnglets={idOnglets}
          idPanneau={idPanneau}
          reduce={reduce}
        />

        <CarteEtape index={actif} idPanneau={idPanneau} idOnglets={idOnglets} reduce={reduce} />

        {/* Commandes précédente / suivante */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => aller(actif - 1)}
            disabled={actif === 0}
            aria-label="Étape précédente"
            className="flex size-11 items-center justify-center rounded-md border border-border text-text-secondary outline-none transition-colors duration-200 ease-nova hover:border-border-strong hover:text-accent-strong focus-visible:ring-3 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-35"
          >
            <Icon icon={ChevronLeft} className="size-4" />
          </button>

          <p className="font-heading text-small tabular-nums text-text-muted" aria-live="polite">
            {ETAPES[actif].numero} <span className="text-text-muted/60">/ 06</span>
          </p>

          <button
            type="button"
            onClick={() => aller(actif + 1)}
            disabled={actif === ETAPES.length - 1}
            aria-label="Étape suivante"
            className="flex size-11 items-center justify-center rounded-md border border-border text-text-secondary outline-none transition-colors duration-200 ease-nova hover:border-border-strong hover:text-accent-strong focus-visible:ring-3 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-35"
          >
            <Icon icon={ChevronRight} className="size-4" />
          </button>
        </div>
      </motion.div>
    </Section>
  )
}

export { Processus }
