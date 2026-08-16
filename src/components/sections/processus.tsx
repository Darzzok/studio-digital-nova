"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Code2,
  Palette,
  Route,
  Rocket,
  Search,
  Zap,
} from "lucide-react"
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Frieze } from "@/components/ui/frieze"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { CHIP, NovaMark } from "@/components/ui/nova"
import { Section } from "@/components/ui/section"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { EASE_NOVA, useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    number: "01",
    title: "Découverte",
    icon: Search,
    className: CHIP.ink,
    description: (
      <>
        J&apos;échange avec vous sur{" "}
        <strong className="font-semibold text-on-ink">vos besoins, vos objectifs</strong> et votre
        marché.
      </>
    ),
    details: [
      "Échange sur vos besoins et vos objectifs",
      "Analyse de votre marché et de la concurrence",
      "Définition claire du périmètre du projet",
    ],
  },
  {
    number: "02",
    title: "Maquette",
    icon: Palette,
    className: CHIP.terracotta,
    description: (
      <>
        Je conçois un design <strong className="font-semibold text-on-ink">sur mesure</strong> qui
        vous ressemble.
      </>
    ),
    details: [
      "Choix des couleurs et de la typographie",
      "Structure des pages pensée pour convertir",
      "Allers-retours jusqu'à votre validation",
    ],
  },
  {
    number: "03",
    title: "Développement",
    icon: Code2,
    className: CHIP.mineral,
    description: (
      <>
        Le site prend vie avec un code{" "}
        <strong className="font-semibold text-on-ink">propre et performant</strong>.
      </>
    ),
    details: [
      "Intégration responsive mobile et desktop",
      "Code propre, rapide et maintenable",
      "Tests sur tous les navigateurs",
    ],
  },
  {
    number: "04",
    title: "Optimisation",
    icon: Zap,
    className: CHIP.ochre,
    description: (
      <>
        <strong className="font-semibold text-on-ink">SEO, vitesse et accessibilité</strong> sont
        peaufinés en détail.
      </>
    ),
    details: [
      "Vitesse de chargement optimisée",
      "Référencement SEO technique et éditorial",
      "Accessibilité vérifiée pour tous les visiteurs",
    ],
  },
  {
    number: "05",
    title: "Validation",
    icon: ClipboardCheck,
    className: CHIP.ink,
    description: (
      <>
        Vous testez et validez{" "}
        <strong className="font-semibold text-on-ink">chaque détail</strong> avant la mise en
        ligne.
      </>
    ),
    details: [
      "Relecture complète avec vous",
      "Ajustements de dernière minute",
      "Vérification sur mobile et sur ordinateur",
    ],
  },
  {
    number: "06",
    title: "Mise en ligne",
    icon: Rocket,
    className: CHIP.sage,
    description: (
      <>
        Votre site est publié et prêt à{" "}
        <strong className="font-semibold text-on-ink">convertir vos visiteurs</strong>.
      </>
    ),
    details: [
      "Publication sur votre nom de domaine",
      "Configuration finale sécurisée",
      "Site prêt à convertir vos visiteurs",
    ],
  },
]

/** Projection des étapes dans le format de la frise partagée. */
const FRIEZE_STEPS = STEPS.map((step) => ({
  key: step.number,
  label: step.title,
  icon: step.icon,
}))

const STEP_COUNT = STEPS.length
const LAST_INDEX = STEP_COUNT - 1

/* Temps de lecture d'une étape avant que la frise n'avance d'elle-même. */
const DWELL = 3400
/* Après une sélection manuelle, on laisse la main au visiteur ce temps-là. */
const RESUME_AFTER = 8000

const cardVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction >= 0 ? -32 : 32 }),
}

function Processus() {
  const reduce = Boolean(useReducedMotion())
  const isMobile = useIsMobile()
  const floatIn = useFloatIn({ stiffness: 130, damping: 16, mass: 0.9 })

  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)

  const active = STEPS[activeIndex]

  /*
    La frise n'est plus pilotée par le scroll : elle avance seule, à rythme
    régulier, tant qu'elle est visible. Le scroll ne fait qu'une chose —
    décider si le défilement tourne ou non.
  */
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(sectionRef, { amount: 0.35 })
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /*
    Le rail garde une progression continue : le marqueur glisse jusqu'au
    repère de l'étape courante au lieu d'y sauter. C'est ce glissement qui
    rend l'enchaînement lisible.
  */
  const progress = useMotionValue(0)
  useEffect(() => {
    const target = activeIndex / LAST_INDEX
    if (reduce) {
      progress.set(target)
      return
    }
    const controls = animate(progress, target, {
      type: "spring",
      stiffness: 90,
      damping: 22,
      mass: 0.9,
    })
    return () => controls.stop()
  }, [activeIndex, progress, reduce])

  /* Le pas automatique. */
  useEffect(() => {
    if (reduce || paused || !inView) return
    const id = setTimeout(() => {
      setDirection(1)
      setActiveIndex((current) => (current + 1) % STEP_COUNT)
    }, DWELL)
    return () => clearTimeout(id)
  }, [activeIndex, reduce, paused, inView])

  /* Quitter la section remet le parcours à son début. */
  const seen = useRef(false)
  useEffect(() => {
    if (inView) {
      seen.current = true
      return
    }
    if (!seen.current) return
    setDirection(1)
    setActiveIndex(0)
  }, [inView])

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
  }, [])

  /* Sélection manuelle : on suspend, puis la main revient à la frise. */
  const goToStep = useCallback(
    (index: number) => {
      const target = Math.min(LAST_INDEX, Math.max(0, index))
      setDirection(target > activeIndex ? 1 : -1)
      setActiveIndex(target)
      setPaused(true)
      if (resumeTimer.current) clearTimeout(resumeTimer.current)
      resumeTimer.current = setTimeout(() => setPaused(false), RESUME_AFTER)
    },
    [activeIndex]
  )

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
            <Icon icon={Route} className="size-3.5 text-accent" />
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
          la première idée à la mise en ligne de votre site. Cliquez sur une étape pour en savoir
          plus.
        </motion.p>
      </div>

      {/*
        Plus de piste de scroll ni d'épinglage : la section reprend sa hauteur
        naturelle. Le défilement de la page n'a plus qu'un rôle — mettre en
        marche ou suspendre le pas automatique selon que la frise est visible.
      */}
      <motion.div
        ref={sectionRef}
        className="mt-[var(--section-gap)]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={floatIn(0.1, { y: 60, scale: 0.96 })}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          if (resumeTimer.current) clearTimeout(resumeTimer.current)
          setPaused(false)
        }}
      >
        {/*
          Desktop : le rail court à l'horizontale au-dessus du panneau.
          Mobile : il descend le long du panneau. Même balisage, même
          nombre d'étapes — seul l'axe change.
        */}
        <div className="flex gap-4 lg:block">
          <Frieze
            id="processus"
            steps={FRIEZE_STEPS}
            activeIndex={activeIndex}
            onSelect={goToStep}
            orientation={isMobile ? "vertical" : "horizontal"}
            progress={reduce ? undefined : progress}
            className="lg:mb-12"
          />

          <div className="relative min-h-[24rem] flex-1 overflow-hidden sm:min-h-[19rem]">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={reduce ? { duration: 0 } : { duration: 0.35, ease: EASE_NOVA }}
              >
                <Card
                  tone="ink"
                  padding="md"
                  className="grain-ink relative overflow-hidden lg:p-9"
                >
                  {/*
                    Bandeau : le rang de l'étape, le rappel de progression et
                    la signature. Le rail interne reprend la grammaire des
                    paliers tarifaires — six segments, remplis jusqu'ici.
                  */}
                  <div className="relative flex items-center justify-between gap-4">
                    <Badge variant="ink">
                      Étape {activeIndex + 1}/{STEP_COUNT}
                    </Badge>

                    <div className="flex items-center gap-3">
                      <span aria-hidden className="flex w-20 items-center gap-1 sm:w-28">
                        {STEPS.map((step, segment) => (
                          <span
                            key={`seg-${step.number}`}
                            className={cn(
                              "h-px flex-1 transition-colors duration-500 ease-nova",
                              segment <= activeIndex ? "bg-accent" : "bg-border-ink"
                            )}
                          />
                        ))}
                      </span>
                      <NovaMark aria-hidden className="size-2.5 shrink-0 text-accent" />
                    </div>
                  </div>

                  <div className="relative mt-8 grid gap-7 sm:grid-cols-[auto_1fr] sm:gap-10">
                    <div className="flex items-center gap-5 sm:flex-col sm:items-start sm:gap-6">
                      {/* Repère graphique, pas une information : masqué aux lecteurs d'écran. */}
                      <span
                        aria-hidden
                        className="font-heading leading-[0.8] text-[clamp(3.25rem,2rem+5vw,5.5rem)] text-accent"
                      >
                        {active.number}
                      </span>
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border-ink text-accent">
                        <Icon icon={active.icon} className="size-5" />
                      </span>
                    </div>

                    <div className="min-w-0 text-left">
                      <h3 className="font-heading text-h2 text-on-ink">{active.title}</h3>

                      <p className="mt-4 text-lead text-on-ink-soft">{active.description}</p>

                      <div className="mt-8 h-px w-full bg-border-ink" />

                      <ul className="mt-6 flex flex-col gap-4">
                        {active.details.map((detail) => (
                          <li key={detail} className="flex gap-4 text-small text-on-ink-soft">
                            <span
                              aria-hidden
                              className="relative top-[0.62em] h-px w-4 shrink-0 bg-accent"
                            />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Commandes manuelles — elles suspendent le pas automatique. */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => goToStep((activeIndex - 1 + STEP_COUNT) % STEP_COUNT)}
            aria-label="Étape précédente"
            className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface text-text-secondary outline-none transition-colors duration-200 ease-nova hover:border-accent hover:text-accent-strong focus-visible:ring-3 focus-visible:ring-ring/35"
          >
            <Icon icon={ArrowLeft} className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => goToStep((activeIndex + 1) % STEP_COUNT)}
            aria-label="Étape suivante"
            className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface text-text-secondary outline-none transition-colors duration-200 ease-nova hover:border-accent hover:text-accent-strong focus-visible:ring-3 focus-visible:ring-ring/35"
          >
            <Icon icon={ArrowRight} className="size-4" />
          </button>
        </div>
      </motion.div>
    </Section>
  )
}

export { Processus }
