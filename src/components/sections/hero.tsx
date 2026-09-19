"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Heading } from "@/components/ui/heading"
import { NovaImage } from "@/components/ui/nova-image"
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

  // Parallaxe de sortie : l'image dérive lentement, le contenu s'efface.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })
  const imageY = useTransform(smooth, [0, 1], ["0%", "14%"])
  const imageScale = useTransform(smooth, [0, 1], [1, 1.08])
  const contentY = useTransform(smooth, [0, 1], [0, 70])
  const contentOpacity = useTransform(smooth, [0, 0.65], [1, 0])
  const veilOpacity = useTransform(smooth, [0, 1], [0.9, 1])

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
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-surface-ink"
    >
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { y: imageY, scale: imageScale }}
      >
        <NovaImage
          src="/images/blog/1568918460973-fe7f54f82482.webp"
          alt=""
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* Voile d'encre — le bleu nuit de la marque, pas un noir neutre. */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(11,23,38,0.80) 0%, rgba(11,23,38,0.66) 42%, rgba(11,23,38,0.94) 100%), radial-gradient(76% 58% at 50% 42%, rgba(11,23,38,0.12) 0%, rgba(11,23,38,0.66) 100%)",
          ...(reduce ? {} : { opacity: veilOpacity }),
        }}
      />
      {/* Grain de papier imprimé, à peine perceptible. */}
      <div aria-hidden className="grain-ink absolute inset-0" />

      {/* Filet terracotta en pied de hero — la signature éditoriale. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <motion.div
        key={playKey}
        className="relative flex w-full items-center"
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        {/* Central composition */}
        <Container className="relative z-10 pt-28 lg:pt-0">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <motion.div
              className="mb-8"
            variants={floatIn(0.75, { y: -40, scale: 0.85 })}
            initial={initial}
            whileInView="visible"
            viewport={viewport}
          >
            <Badge variant="ink" className="gap-2.5 backdrop-blur-md">
              <motion.span
                className="size-1.5 rounded-full bg-accent"
                animate={
                  reduce
                    ? { boxShadow: "0 0 0 0 rgba(217,108,79,0)" }
                    : {
                        boxShadow: [
                          "0 0 0 0 rgba(217,108,79,0.45)",
                          "0 0 0 6px rgba(217,108,79,0)",
                          "0 0 0 0 rgba(217,108,79,0)",
                        ],
                      }
                }
                transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, ease: EASE_NOVA }}
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
            <Heading variant="display" className="text-on-ink">
              Votre entreprise mérite un site qui inspire{" "}
              {/*
                Le mot pivot est agrandi en `em` : il suit donc l'échelle
                fluide du titre à tous les formats. `leading-[0]` empêche
                l'interligne de s'ouvrir sous le poids de la ligne agrandie.
              */}
              <span className="whitespace-nowrap text-[1.22em] italic leading-[0] text-accent">
                confiance
              </span>
              .
            </Heading>
          </motion.div>

          <motion.p
            className="measure mt-9 text-lead text-on-ink-soft"
            variants={floatIn(1.15, { y: 50 })}
            initial={initial}
            whileInView="visible"
            viewport={viewport}
          >
            Je crée des sites vitrines modernes, rapides et optimisés pour{" "}
            <strong className="font-semibold text-on-ink">convertir vos visiteurs en clients</strong>.
            De la conception au référencement, je m&apos;occupe de tout, en direct et sans
            intermédiaire. <strong className="font-semibold text-on-ink">Un interlocuteur unique</strong>,
            disponible du premier échange jusqu&apos;à la mise en ligne de votre site.
          </motion.p>

          <div className="mt-11 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <motion.div
              variants={floatIn(1.35, { x: -160, rotate: -6 })}
              initial={initial}
              whileInView="visible"
              viewport={viewport}
            >
              <Link href="/#contact" className="group">
                <Button variant="primary" className="bg-paper text-ink hover:bg-accent hover:text-accent-foreground">
                  Demander un devis
                  <Icon
                    icon={ArrowRight}
                    className="transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
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
                <Button variant="outline" className="border-border-ink bg-white/5 text-on-ink backdrop-blur-md hover:border-accent hover:text-accent">
                  Découvrir mes offres
                </Button>
              </Link>
            </motion.div>
          </div>
          </div>
        </Container>
      </motion.div>
    </section>
  )
}

export { Hero }
