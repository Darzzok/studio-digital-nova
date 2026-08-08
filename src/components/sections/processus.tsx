"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Code2,
  Palette,
  Route,
  Rocket,
  Search,
  Zap,
} from "lucide-react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Section } from "@/components/ui/section"
import { EASE_NOVA, useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    number: "01",
    title: "Découverte",
    icon: Search,
    className: "bg-primary/10 text-primary",
    description: (
      <>
        J&apos;échange avec vous sur{" "}
        <strong className="font-semibold text-text">vos besoins, vos objectifs</strong> et votre
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
    className: "bg-accent-purple/15 text-accent-purple",
    description: (
      <>
        Je conçois un design <strong className="font-semibold text-text">sur mesure</strong> qui
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
    className: "bg-accent-green/15 text-accent-green",
    description: (
      <>
        Le site prend vie avec un code{" "}
        <strong className="font-semibold text-text">propre et performant</strong>.
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
    className: "bg-warning/15 text-warning",
    description: (
      <>
        <strong className="font-semibold text-text">SEO, vitesse et accessibilité</strong> sont
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
    className: "bg-primary/10 text-primary",
    description: (
      <>
        Vous testez et validez{" "}
        <strong className="font-semibold text-text">chaque détail</strong> avant la mise en
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
    className: "bg-accent-purple/15 text-accent-purple",
    description: (
      <>
        Votre site est publié et prêt à{" "}
        <strong className="font-semibold text-text">convertir vos visiteurs</strong>.
      </>
    ),
    details: [
      "Publication sur votre nom de domaine",
      "Configuration finale sécurisée",
      "Site prêt à convertir vos visiteurs",
    ],
  },
]

const STEP_COUNT = STEPS.length
const AUTOPLAY_DELAY = 2800
const RESUME_DELAY = 6000

const cardVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction >= 0 ? -32 : 32 }),
}

function Processus() {
  const reduce = Boolean(useReducedMotion())
  const floatIn = useFloatIn({ stiffness: 130, damping: 16, mass: 0.9 })

  const friezeRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(friezeRef, { amount: 0.5 })
  const hasEverBeenInView = useRef(false)
  const hasLeft = useRef(false)

  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const active = STEPS[activeIndex]

  function goTo(index: number, dir: number) {
    setDirection(dir)
    setActiveIndex(index)
  }

  function handleManualSelect(index: number) {
    goTo(index, index > activeIndex ? 1 : -1)
    setIsPaused(true)
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current)
    resumeTimeout.current = setTimeout(() => setIsPaused(false), RESUME_DELAY)
  }

  useEffect(() => {
    return () => {
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current)
    }
  }, [])

  // Repart de l'étape 1 à chaque fois qu'on revient sur la section après l'avoir quittée.
  useEffect(() => {
    if (inView) {
      if (hasEverBeenInView.current && hasLeft.current) {
        setDirection(1)
        setActiveIndex(0)
      }
      hasEverBeenInView.current = true
      hasLeft.current = false
    } else if (hasEverBeenInView.current) {
      hasLeft.current = true
    }
  }, [inView])

  useEffect(() => {
    if (reduce || isPaused || !inView) return
    const id = setInterval(() => {
      setDirection(1)
      setActiveIndex((current) => (current + 1) % STEP_COUNT)
    }, AUTOPLAY_DELAY)
    return () => clearInterval(id)
  }, [reduce, isPaused, inView])

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
          <Badge variant="outline" className="gap-2 py-1.5">
            <Icon icon={Route} className="size-3.5" />
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
          className="mt-6 max-w-xl text-body text-text-secondary"
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

      <motion.div
        ref={friezeRef}
        className="mt-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={floatIn(0.1, { y: 60, scale: 0.96 })}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          if (resumeTimeout.current) clearTimeout(resumeTimeout.current)
          setIsPaused(false)
        }}
      >
        {/* Frise cliquable */}
        <div className="flex items-start">
          {STEPS.map((step, index) => {
            const isActive = index === activeIndex
            const isDone = index < activeIndex

            return (
              <Fragment key={step.number}>
                <button
                  type="button"
                  onClick={() => handleManualSelect(index)}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Étape ${index + 1} : ${step.title}`}
                  className="group flex flex-col items-center gap-2"
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full border-2 font-heading text-small font-bold transition-all duration-200 ease-nova sm:size-12",
                      isActive && "scale-110 border-primary bg-primary text-primary-foreground shadow-md",
                      isDone && "border-primary bg-primary/10 text-primary",
                      !isActive && !isDone && "border-border bg-surface text-text-secondary group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:text-primary"
                    )}
                  >
                    {isDone ? <Icon icon={Check} className="size-4" /> : <Icon icon={step.icon} className="size-4" />}
                  </span>
                  <span
                    className={cn(
                      "hidden text-[11px] transition-colors duration-200 ease-nova sm:block sm:text-small",
                      isActive ? "font-semibold text-primary" : "text-text-secondary"
                    )}
                  >
                    {step.title}
                  </span>
                </button>

                {index < STEPS.length - 1 && (
                  <div className="relative mx-1.5 mt-5 h-0.5 flex-1 self-start rounded-full bg-border sm:mx-2 sm:mt-6">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary"
                      initial={false}
                      animate={{ width: index < activeIndex ? "100%" : "0%" }}
                      transition={reduce ? { duration: 0 } : { duration: 0.4, ease: EASE_NOVA }}
                    />
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>

        {/* Panneau de détail */}
        <div className="mt-10 flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => handleManualSelect((activeIndex - 1 + STEP_COUNT) % STEP_COUNT)}
            aria-label="Étape précédente"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors duration-150 ease-nova hover:border-primary hover:text-primary"
          >
            <Icon icon={ArrowLeft} className="size-4" />
          </button>

          <div className="relative min-h-[26rem] flex-1 overflow-hidden sm:min-h-[22rem]">
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
                <Card className="flex flex-col items-center gap-4 bg-surface-sunken p-8 text-center sm:p-10">
                  <span
                    className={cn(
                      "flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                      active.className
                    )}
                  >
                    <Icon icon={active.icon} className="size-6" />
                  </span>

                  <Badge variant="outline">
                    Étape {activeIndex + 1}/{STEP_COUNT}
                  </Badge>

                  <h3 className="text-h3 font-heading font-semibold text-text">{active.title}</h3>
                  <p className="max-w-md text-body text-text-secondary">{active.description}</p>

                  <div className="h-px w-full max-w-xs bg-border" />

                  <ul className="flex w-full max-w-sm flex-col gap-2.5">
                    {active.details.map((detail) => (
                      <li key={detail} className="flex items-start justify-center gap-2 text-small text-text-secondary">
                        <Icon icon={Check} className="mt-0.5 size-3.5 shrink-0 text-success" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => handleManualSelect((activeIndex + 1) % STEP_COUNT)}
            aria-label="Étape suivante"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors duration-150 ease-nova hover:border-primary hover:text-primary"
          >
            <Icon icon={ArrowRight} className="size-4" />
          </button>
        </div>
      </motion.div>
    </Section>
  )
}

export { Processus }
