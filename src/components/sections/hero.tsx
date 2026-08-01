"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Code2,
  LayoutGrid,
  Palette,
  PhoneCall,
  Plus,
  TrendingUp,
  Type,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { EASE_NOVA } from "@/lib/motion"

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }
type FloatOptions = { stiffness?: number; damping?: number; mass?: number; opacityDuration?: number }

function floatIn(delay: number, from: FloatFrom, options?: FloatOptions) {
  const { stiffness = 140, damping = 16, mass = 0.9, opacityDuration = 0.4 } = options ?? {}
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

const BUBBLES = [
  { icon: Code2, className: "bg-warning/15 text-warning", pos: "left-[2%] top-[36%]", from: { x: -160, y: 40, rotate: -12 } },
  { icon: Type, className: "bg-accent-purple/15 text-accent-purple", pos: "right-[2%] top-[36%]", from: { x: 160, y: -40, rotate: 12 } },
  { icon: LayoutGrid, className: "bg-primary/15 text-primary", pos: "left-[2%] top-[58%]", from: { x: -140, y: 100, rotate: -10 } },
  { icon: PhoneCall, className: "bg-accent-green/15 text-accent-green", pos: "right-[2%] top-[58%]", from: { x: 140, y: 90, rotate: 10 } },
]

function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const inView = useInView(sectionRef, { amount: 0 })
  const reduce = useReducedMotion()

  const hasEverBeenInView = useRef(false)
  const hasLeft = useRef(false)
  const [playKey, setPlayKey] = useState(0)

  useEffect(() => {
    if (inView) {
      if (hasEverBeenInView.current && hasLeft.current) {
        setPlayKey((key) => key + 1)
      }
      hasEverBeenInView.current = true
      hasLeft.current = false
    } else if (hasEverBeenInView.current) {
      hasLeft.current = true
    }
  }, [inView])

  const initial = reduce ? false : "hidden"

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background"
    >
      <div key={playKey} className="relative flex w-full items-center justify-center">
        <motion.div
          aria-hidden
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0.05] }}
          transition={{ duration: 2, times: [0, 0.25, 1], ease: EASE_NOVA }}
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
        />

        {/* Floating layer — gravitates around the central content, one single scene */}
        <div className="pointer-events-none absolute inset-0 mx-auto hidden max-w-[1400px] lg:block">
          <motion.div
            className="absolute left-[6%] top-[14%] w-64"
            variants={floatIn(2.3, { x: -220, y: -60, rotate: -8 }, { stiffness: 110, damping: 30, mass: 4 })}
            initial={initial}
            animate="visible"
          >
            <Card className="pointer-events-auto flex items-start gap-3 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon icon={Palette} className="size-5" />
              </span>
              <div>
                <p className="text-small font-semibold text-text">Design personnalisé</p>
                <p className="text-small text-text-secondary">Un design unique à votre image.</p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            className="absolute right-[6%] top-[10%] w-72"
            variants={floatIn(1.95, { x: 240, y: -50, rotate: 6 }, { stiffness: 100, damping: 30, mass: 4.4 })}
            initial={initial}
            animate="visible"
          >
            <Card className="pointer-events-auto p-3">
              <div className="flex items-center gap-1.5 border-b border-border pb-2.5">
                <span className="size-2.5 rounded-full bg-error/40" />
                <span className="size-2.5 rounded-full bg-warning/40" />
                <span className="size-2.5 rounded-full bg-success/40" />
              </div>
              <div className="mt-3 space-y-2">
                <div
                  className="h-16 w-full rounded-lg"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, var(--color-primary), var(--color-accent-purple))",
                  }}
                />
                <div className="h-2 w-3/4 rounded-full bg-border" />
                <div className="h-2 w-1/2 rounded-full bg-border" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            className="absolute bottom-[16%] left-[9%] w-60"
            variants={floatIn(2.4, { x: -200, y: 70, rotate: -6 }, { stiffness: 110, damping: 30, mass: 4 })}
            initial={initial}
            animate="visible"
          >
            <Card className="pointer-events-auto flex items-start gap-3 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-green/15 text-accent-green">
                <Icon icon={TrendingUp} className="size-5" />
              </span>
              <div>
                <p className="text-small font-semibold text-text">Optimisation SEO</p>
                <p className="text-small text-text-secondary">Meilleure visibilité sur Google.</p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            className="absolute bottom-[10%] right-[7%] w-64"
            variants={floatIn(2.5, { x: 220, y: 80, rotate: 8 }, { stiffness: 110, damping: 30, mass: 4 })}
            initial={initial}
            animate="visible"
          >
            <Card className="pointer-events-auto flex items-start gap-3 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <Icon icon={Zap} className="size-5" />
              </span>
              <div>
                <p className="text-small font-semibold text-text">Ultra rapide</p>
                <p className="text-small text-text-secondary">Sites rapides et fluides.</p>
              </div>
            </Card>
          </motion.div>

          {BUBBLES.map((bubble, index) => (
            <motion.div
              key={bubble.pos}
              className={`absolute ${bubble.pos}`}
              variants={floatIn(1.6 + index * 0.08, bubble.from, { stiffness: 170, damping: 14, mass: 0.6 })}
              initial={initial}
              animate="visible"
            >
              <span
                className={`pointer-events-auto flex size-12 items-center justify-center rounded-full shadow-sm ${bubble.className}`}
              >
                <Icon icon={bubble.icon} className="size-5" />
              </span>
            </motion.div>
          ))}

          <motion.svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.3, delay: 2.75 } },
            }}
            initial={initial}
            animate="visible"
          >
            <motion.path
              d="M 10 26 Q 4 32, 3 36"
              vectorEffect="non-scaling-stroke"
              stroke="var(--color-text-secondary)"
              strokeOpacity={0.3}
              strokeWidth={1.5}
              strokeDasharray="5 6"
              fill="none"
              variants={{
                hidden: { pathLength: 0 },
                visible: { pathLength: 1, transition: { duration: 0.8, delay: 2.8, ease: EASE_NOVA } },
              }}
              initial={initial}
              animate="visible"
            />
          </motion.svg>

          {[
            { pos: "left-[4%] top-[16%]" },
            { pos: "right-[4%] top-[74%]" },
          ].map((deco) => (
            <motion.div
              key={deco.pos}
              className={`absolute ${deco.pos}`}
              variants={floatIn(2.85, { scale: 0.4 }, { stiffness: 180, damping: 14, mass: 0.5 })}
              initial={initial}
              animate="visible"
            >
              <Icon icon={Plus} className="size-4 text-text-secondary/30" />
            </motion.div>
          ))}
        </div>

        {/* Central composition */}
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 pt-28 text-center md:max-w-3xl lg:pt-0">
          <motion.div
            className="mb-6"
            variants={floatIn(0.75, { y: -40, scale: 0.85 })}
            initial={initial}
            animate="visible"
          >
            <Badge variant="outline" className="gap-2 py-1.5">
              <motion.span
                className="size-2 rounded-full bg-success"
                animate={
                  reduce
                    ? { boxShadow: "0 0 0 0 rgba(34,118,79,0)" }
                    : {
                        boxShadow: [
                          "0 0 0 0 rgba(34,118,79,0.35)",
                          "0 0 0 6px rgba(34,118,79,0)",
                          "0 0 0 0 rgba(34,118,79,0)",
                        ],
                      }
                }
                transition={reduce ? undefined : { duration: 1.8, repeat: Infinity, ease: EASE_NOVA }}
              />
              Disponible pour de nouveaux projets
            </Badge>
          </motion.div>

          <motion.div
            variants={floatIn(0.95, { y: -90, scale: 0.92 }, { stiffness: 110, damping: 16, mass: 1.1 })}
            initial={initial}
            animate="visible"
          >
            <Heading
              variant="display"
              className="text-balance text-4xl leading-[1.1] sm:text-5xl md:text-6xl lg:text-display lg:leading-[1.05]"
            >
              Votre entreprise mérite un site qui inspire confiance.
            </Heading>
          </motion.div>

          <motion.p
            className="mt-6 max-w-xl text-body text-text-secondary"
            variants={floatIn(1.15, { y: 50 })}
            initial={initial}
            animate="visible"
          >
            Je crée des sites vitrines modernes, rapides et optimisés pour{" "}
            <strong className="font-semibold text-text">convertir vos visiteurs en clients</strong>.
            De la conception au référencement, je m'occupe de tout, en direct et sans
            intermédiaire. <strong className="font-semibold text-text">Un interlocuteur unique</strong>,
            disponible du premier échange jusqu'à la mise en ligne de votre site.
          </motion.p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <motion.div
              variants={floatIn(1.35, { x: -160, rotate: -6 })}
              initial={initial}
              animate="visible"
            >
              <a href="/#contact">
                <Button variant="primary">
                  Demander un devis
                  <Icon icon={ArrowRight} className="size-4" />
                </Button>
              </a>
            </motion.div>
            <motion.div
              variants={floatIn(1.45, { x: 160, rotate: 6 })}
              initial={initial}
              animate="visible"
            >
              <a href="/#tarifs">
                <Button variant="outline">Découvrir mes offres</Button>
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Hero }
