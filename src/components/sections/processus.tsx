"use client"

import { useRef } from "react"
import { Route } from "lucide-react"
import { motion, useInView, useReducedMotion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Section } from "@/components/ui/section"
import { EASE_NOVA } from "@/lib/motion"

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }
type FloatOptions = { stiffness?: number; damping?: number; mass?: number; opacityDuration?: number }

function floatIn(delay: number, from: FloatFrom, options?: FloatOptions) {
  const { stiffness = 130, damping = 16, mass = 0.9, opacityDuration = 0.4 } = options ?? {}
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

const STEPS = [
  { number: "01", title: "Découverte", description: "J'échange avec vous sur vos besoins, vos objectifs et votre marché." },
  { number: "02", title: "Maquette", description: "Je conçois un design sur mesure qui vous ressemble." },
  { number: "03", title: "Développement", description: "Le site prend vie avec un code propre et performant." },
  { number: "04", title: "Optimisation", description: "SEO, vitesse et accessibilité sont peaufinés en détail." },
  { number: "05", title: "Validation", description: "Vous testez et validez chaque détail avant la mise en ligne." },
  { number: "06", title: "Mise en ligne", description: "Votre site est publié et prêt à convertir vos visiteurs." },
]

const STEP_COUNT = STEPS.length
const LAST_INDEX = STEP_COUNT - 1
const centerOf = (index: number) => ((index + 0.5) / STEP_COUNT) * 100

// ---- Minuterie de la progression (une capsule à la fois, puis la ligne, puis la suivante) ----
const ENTRANCE_SETTLE = 1.6 // laisse le temps à l'animation d'entrée existante de se terminer
const CAPSULE_FILL = 0.7
const LINE_FILL = 0.45
const STEP_CYCLE = CAPSULE_FILL + LINE_FILL
const RAMP = 0.3
const END_PAUSE = 0.4

const activeStart = (i: number) => ENTRANCE_SETTLE + i * STEP_CYCLE
const activeEnd = (i: number) => activeStart(i + 1)
const SEQUENCE_END = activeStart(LAST_INDEX) + CAPSULE_FILL
const GRAND_TOTAL = SEQUENCE_END + END_PAUSE + RAMP

type Frames = { values: number[]; times: number[] }

function toTimes(points: number[]): number[] {
  return points.map((t) => Math.min(1, Math.max(0, t / GRAND_TOTAL)))
}

/** Allumé pendant [activeStart(i), activeEnd(i)) puis éteint — reste allumé pour la dernière étape. */
function pulse(i: number, off: number, on: number): Frames {
  const start = activeStart(i)
  if (i === LAST_INDEX) {
    return { values: [off, off, on, on], times: toTimes([0, start, start + RAMP, GRAND_TOTAL]) }
  }
  const end = activeEnd(i)
  return {
    values: [off, off, on, on, off, off],
    times: toTimes([0, start, start + RAMP, end - RAMP, end, GRAND_TOTAL]),
  }
}

/** Opacité de la carte : discrète tant que ce n'est pas son tour, pleine pendant, puis retour "normal" à la toute fin. */
function cardOpacity(i: number): Frames {
  const start = activeStart(i)
  const isFirst = i === 0
  const isLast = i === LAST_INDEX
  const points: number[] = [0]
  const values: number[] = [1]
  if (!isFirst) {
    points.push(ENTRANCE_SETTLE, ENTRANCE_SETTLE + RAMP)
    values.push(1, 0.7)
  }
  points.push(start, start + RAMP)
  values.push(isFirst ? 1 : 0.7, 1)
  if (!isLast) {
    const end = activeEnd(i)
    points.push(end - RAMP, end, GRAND_TOTAL - RAMP, GRAND_TOTAL)
    values.push(1, 0.7, 0.7, 1)
  } else if (points[points.length - 1] < GRAND_TOTAL) {
    // Framer requiert que le dernier point de "times" atteigne la durée totale,
    // sans quoi il réinterprète la fin de la timeline — on maintient donc la valeur.
    points.push(GRAND_TOTAL)
    values.push(1)
  }
  return { values, times: toTimes(points) }
}

/** Remplissage en un sens (0 -> 1) qui reste plein ensuite. */
function fillOnce(start: number, duration: number): Frames {
  const end = start + duration
  if (end >= GRAND_TOTAL) {
    return { values: [0, 0, 1], times: toTimes([0, start, end]) }
  }
  // Un point final à GRAND_TOTAL est indispensable : sans lui, Framer Motion ne
  // tient pas la valeur atteinte et la timeline "dérive" après le remplissage.
  return { values: [0, 0, 1, 1], times: toTimes([0, start, end, GRAND_TOTAL]) }
}

const finalOn = (i: number) => (i === LAST_INDEX ? 1 : 0)

/**
 * Une seule courbe (ease-nova) mais appliquée segment par segment : les paliers qui ne
 * changent pas de valeur restent strictement plats (linear), seule une vraie transition
 * utilise ease-nova. Sans ça, Framer applique la courbe globalement sur toute la durée et
 * fait "fuiter" un peu de progression sur les paliers censés rester à 0 — d'où le clignotement.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function easesFor(values: number[]): any[] {
  const eases: unknown[] = []
  for (let i = 0; i < values.length - 1; i++) {
    eases.push(values[i] === values[i + 1] ? "linear" : EASE_NOVA)
  }
  return eases
}

/**
 * Construit les props initial/animate/transition d'une valeur unique pour un `motion.*`.
 * Ne joue qu'une seule fois, quand `inView` passe à `true` (jamais de rejeu).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function seq(inView: boolean, reduce: boolean, frames: Frames, finalValue: number): { animate: { value: number | number[] }; transition: any } {
  if (reduce) {
    return { animate: { value: finalValue }, transition: { duration: 0 } }
  }
  return {
    animate: { value: inView ? frames.values : frames.values[0] },
    transition: inView
      ? { duration: GRAND_TOTAL, times: frames.times, ease: easesFor(frames.values) }
      : { duration: 0 },
  }
}

type PulseProps = { index: number; inView: boolean; reduce: boolean }

function Capsule({ index, inView, reduce }: PulseProps) {
  const fill = fillOnce(activeStart(index), CAPSULE_FILL)
  const fillSeq = seq(inView, reduce, fill, 1)
  const invertedFill: Frames = { values: fill.values.map((v) => 1 - v), times: fill.times }
  const numberSeq = seq(inView, reduce, invertedFill, 0)

  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-border bg-surface shadow-sm" />
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full bg-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: fillSeq.animate.value }}
        transition={fillSeq.transition}
      />
      <motion.span
        aria-hidden
        className="absolute text-h3 font-heading font-bold text-primary"
        initial={{ opacity: 1 }}
        animate={{ opacity: numberSeq.animate.value }}
        transition={numberSeq.transition}
      >
        {STEPS[index].number}
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute text-h3 font-heading font-bold text-primary-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: fillSeq.animate.value }}
        transition={fillSeq.transition}
      >
        {STEPS[index].number}
      </motion.span>
    </div>
  )
}

function StepCard({ index, inView, reduce }: PulseProps) {
  const step = STEPS[index]
  const scaleFrames = pulse(index, 1, 1.03)
  const glowFrames = pulse(index, 0, 1)
  const opacityFrames = cardOpacity(index)

  const scaleSeq = seq(inView, reduce, scaleFrames, index === LAST_INDEX ? 1.03 : 1)
  const glowSeq = seq(inView, reduce, glowFrames, finalOn(index))
  const opacitySeq = seq(inView, reduce, opacityFrames, 1)

  return (
    <motion.div
      className="relative"
      style={{ transformOrigin: "center" }}
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: opacitySeq.animate.value, scale: scaleSeq.animate.value }}
      transition={{ opacity: opacitySeq.transition, scale: scaleSeq.transition }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-primary/25 blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: glowSeq.animate.value }}
        transition={glowSeq.transition}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-primary shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: glowSeq.animate.value }}
        transition={glowSeq.transition}
      />
      <Card className="flex flex-col items-center gap-2 p-6 text-center">
        <p className="text-h3 font-heading font-semibold text-text">{step.title}</p>
        <p className="text-small text-text-secondary">{step.description}</p>
      </Card>
    </motion.div>
  )
}

function Processus() {
  const reduce = Boolean(useReducedMotion())
  const gridRef = useRef<HTMLDivElement | null>(null)
  const inView = useInView(gridRef, { once: true, amount: 0.3 })

  return (
    <Section>
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
          Un processus clair et éprouvé, de la première idée à la mise en ligne de votre site.
          Vous savez toujours où vous en êtes, sans jargon ni mauvaise surprise.
        </motion.p>
      </div>

      <div ref={gridRef}>
        {/* Desktop — frise horizontale, capsules alignées au centre, cartes en quinconce */}
        <div
          className="relative mt-20 hidden lg:grid lg:grid-cols-6 lg:gap-x-4"
          style={{ gridTemplateRows: "auto auto auto", rowGap: "2.5rem" }}
        >
          <div
            aria-hidden
            className="pointer-events-none relative h-4 self-center"
            style={{ gridColumn: "1 / -1", gridRow: 2 }}
          >
            <svg viewBox="0 0 100 16" preserveAspectRatio="none" className="absolute inset-0 h-4 w-full">
              {STEPS.slice(0, -1).map((_, index) => {
                const fill = fillOnce(activeEnd(index) - LINE_FILL, LINE_FILL)
                const fillSeq = seq(inView, reduce, fill, 1)
                return (
                  <g key={index}>
                    <motion.path
                      d={`M ${centerOf(index)} 8 H ${centerOf(index + 1)}`}
                      vectorEffect="non-scaling-stroke"
                      stroke="var(--color-border)"
                      strokeWidth={1.5}
                      strokeDasharray="5 6"
                      fill="none"
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.5 }}
                      variants={{
                        hidden: { pathLength: 0 },
                        visible: {
                          pathLength: 1,
                          transition: { duration: 0.5, delay: 0.35 + index * 0.12, ease: EASE_NOVA },
                        },
                      }}
                    />
                    <motion.path
                      d={`M ${centerOf(index)} 8 H ${centerOf(index + 1)}`}
                      vectorEffect="non-scaling-stroke"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: fillSeq.animate.value }}
                      transition={fillSeq.transition}
                    />
                  </g>
                )
              })}
            </svg>
          </div>

          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              style={{ gridColumn: index + 1, gridRow: 2 }}
              className="flex items-center justify-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(index * 0.12, { y: 70, scale: 0.85 })}
            >
              <Capsule index={index} inView={inView} reduce={reduce} />
            </motion.div>
          ))}

          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              style={{ gridColumn: index + 1, gridRow: index % 2 === 0 ? 1 : 3 }}
              className={index % 2 === 0 ? "self-end" : "self-start"}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(index * 0.12, { y: index % 2 === 0 ? -70 : 70, scale: 0.85 })}
            >
              <StepCard index={index} inView={inView} reduce={reduce} />
            </motion.div>
          ))}
        </div>

        {/* Mobile / tablette — repli en liste, capsule intégrée à chaque carte */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:hidden">
          {STEPS.map((step, index) => {
            const scaleFrames = pulse(index, 1, 1.02)
            const glowFrames = pulse(index, 0, 1)
            const opacityFrames = cardOpacity(index)
            const scaleSeq = seq(inView, reduce, scaleFrames, index === LAST_INDEX ? 1.02 : 1)
            const glowSeq = seq(inView, reduce, glowFrames, finalOn(index))
            const opacitySeq = seq(inView, reduce, opacityFrames, 1)

            return (
              <motion.div
                key={step.number}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={floatIn(index * 0.1, { y: 60, scale: 0.9 })}
              >
                <motion.div
                  className="relative"
                  style={{ transformOrigin: "center" }}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: opacitySeq.animate.value, scale: scaleSeq.animate.value }}
                  transition={{ opacity: opacitySeq.transition, scale: scaleSeq.transition }}
                >
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-primary shadow-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: glowSeq.animate.value }}
                    transition={glowSeq.transition}
                  />
                  <Card className="flex flex-col items-center gap-3 p-6 text-center">
                    <Capsule index={index} inView={inView} reduce={reduce} />
                    <p className="text-h3 font-heading font-semibold text-text">{step.title}</p>
                    <p className="text-small text-text-secondary">{step.description}</p>
                  </Card>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

export { Processus }
