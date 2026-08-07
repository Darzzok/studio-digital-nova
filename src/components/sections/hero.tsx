"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useInView, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Palette,
  Smartphone,
  TrendingUp,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { EASE_NOVA, useFloatIn } from "@/lib/motion"

function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const inView = useInView(sectionRef, { amount: 0 })
  const reduce = useReducedMotion()
  const floatIn = useFloatIn({ stiffness: 140, damping: 16, mass: 0.9 })

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

  const initial = "hidden"
  const viewport = { once: true, amount: 0 } as const

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background"
    >
      <div key={playKey} className="relative flex w-full items-center justify-center">
        {/* Floating layer — gravitates around the central content, one single scene */}
        <div className="pointer-events-none absolute inset-0 mx-auto hidden max-w-[1400px] xl:block">
          <motion.div
            className="absolute left-0 top-[8%] w-60"
            variants={floatIn(2.3, { x: -220, y: -60, rotate: -8 }, { stiffness: 110, damping: 30, mass: 4 })}
            initial={initial}
            whileInView="visible"
            viewport={viewport}
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
            className="absolute right-0 top-[4%] w-64"
            variants={floatIn(1.95, { x: 240, y: -50, rotate: 6 }, { stiffness: 100, damping: 30, mass: 4.4 })}
            initial={initial}
            whileInView="visible"
            viewport={viewport}
          >
            <Card className="pointer-events-auto flex items-start gap-3 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-purple/15 text-accent-purple">
                <Icon icon={Smartphone} className="size-5" />
              </span>
              <div>
                <p className="text-small font-semibold text-text">100% responsive</p>
                <p className="text-small text-text-secondary">Parfait sur mobile et tablette.</p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            className="absolute bottom-[8%] left-0 w-60"
            variants={floatIn(2.4, { x: -200, y: 70, rotate: -6 }, { stiffness: 110, damping: 30, mass: 4 })}
            initial={initial}
            whileInView="visible"
            viewport={viewport}
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
            className="absolute bottom-[2%] right-0 w-60"
            variants={floatIn(2.5, { x: 220, y: 80, rotate: 8 }, { stiffness: 110, damping: 30, mass: 4 })}
            initial={initial}
            whileInView="visible"
            viewport={viewport}
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

        </div>

        {/* Central composition */}
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 pt-28 text-center md:max-w-3xl lg:pt-0">
          <motion.div
            className="mb-6"
            variants={floatIn(0.75, { y: -40, scale: 0.85 })}
            initial={initial}
            whileInView="visible"
            viewport={viewport}
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
            whileInView="visible"
            viewport={viewport}
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
            whileInView="visible"
            viewport={viewport}
          >
            Je crée des sites vitrines modernes, rapides et optimisés pour{" "}
            <strong className="font-semibold text-text">convertir vos visiteurs en clients</strong>.
            De la conception au référencement, je m&apos;occupe de tout, en direct et sans
            intermédiaire. <strong className="font-semibold text-text">Un interlocuteur unique</strong>,
            disponible du premier échange jusqu&apos;à la mise en ligne de votre site.
          </motion.p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <motion.div
              variants={floatIn(1.35, { x: -160, rotate: -6 })}
              initial={initial}
              whileInView="visible"
              viewport={viewport}
            >
              <Link href="/#contact" className="group">
                <Button variant="primary">
                  Demander un devis
                  <Icon
                    icon={ArrowRight}
                    className="size-4 transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
                  />
                </Button>
              </Link>
            </motion.div>
            <motion.div
              variants={floatIn(1.45, { x: 160, rotate: 6 })}
              initial={initial}
              whileInView="visible"
              viewport={viewport}
            >
              <Link href="/#tarifs">
                <Button variant="outline">Découvrir mes offres</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Hero }
