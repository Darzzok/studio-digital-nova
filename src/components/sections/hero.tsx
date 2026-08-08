"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useInView, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
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
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0a0a0a]"
    >
      <Image
        src="https://images.unsplash.com/photo-1568918460973-fe7f54f82482?auto=format&fit=crop&w=2400&q=80"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.6) 45%, rgba(10,10,10,0.85) 100%), radial-gradient(80% 60% at 50% 40%, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.55) 100%)",
        }}
      />

      <div key={playKey} className="relative flex w-full items-center">
        {/* Central composition */}
        <Container className="relative z-10 pt-28 lg:pt-0">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <motion.div
              className="mb-6"
            variants={floatIn(0.75, { y: -40, scale: 0.85 })}
            initial={initial}
            whileInView="visible"
            viewport={viewport}
          >
            <Badge variant="outline" className="gap-2 border-white/25 bg-white/10 py-1.5 text-white backdrop-blur-md">
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
              className="text-balance text-5xl leading-[1.05] text-white sm:text-6xl md:text-7xl lg:text-[4.5rem] xl:text-[5rem]"
            >
              Votre entreprise mérite un site qui inspire{" "}
              <span className="text-primary">confiance</span>.
            </Heading>
          </motion.div>

          <motion.p
            className="mt-8 max-w-2xl text-lg text-white/75 sm:text-xl"
            variants={floatIn(1.15, { y: 50 })}
            initial={initial}
            whileInView="visible"
            viewport={viewport}
          >
            Je crée des sites vitrines modernes, rapides et optimisés pour{" "}
            <strong className="font-semibold text-white">convertir vos visiteurs en clients</strong>.
            De la conception au référencement, je m&apos;occupe de tout, en direct et sans
            intermédiaire. <strong className="font-semibold text-white">Un interlocuteur unique</strong>,
            disponible du premier échange jusqu&apos;à la mise en ligne de votre site.
          </motion.p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
                <Button variant="outline" className="border-white/30 bg-white/5 text-white backdrop-blur-md hover:border-white hover:text-white">
                  Découvrir mes offres
                </Button>
              </Link>
            </motion.div>
          </div>
          </div>
        </Container>
      </div>
    </section>
  )
}

export { Hero }
