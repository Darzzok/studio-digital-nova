"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Search, Smartphone, Sparkles, User, UserCheck } from "lucide-react"
import { motion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Section } from "@/components/ui/section"
import { cn } from "@/lib/utils"

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }
type FloatOptions = { stiffness?: number; damping?: number; mass?: number; opacityDuration?: number }

function floatIn(delay: number, from: FloatFrom, options?: FloatOptions) {
  const { stiffness = 110, damping = 15, mass = 1, opacityDuration = 0.4 } = options ?? {}
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

const STRENGTHS = [
  { icon: UserCheck, label: "Interlocuteur unique", className: "bg-primary/10 text-primary" },
  { icon: Sparkles, label: "Site sur mesure", className: "bg-accent-purple/15 text-accent-purple" },
  { icon: Search, label: "Optimisé SEO", className: "bg-accent-green/15 text-accent-green" },
  { icon: Smartphone, label: "Compatible mobile", className: "bg-warning/15 text-warning" },
]

/** Portrait intégré dans une carte premium — fond DS, radius et ombre du Card, photo inchangée. */
function AboutPortrait() {
  const [imgError, setImgError] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth === 0) {
      setImgError(true)
    }
  }, [])

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-accent-purple/10 blur-3xl"
      />

      <div className="relative aspect-4/5 w-full overflow-hidden rounded-3xl border border-border bg-background">
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src="/images/geoffrey.webp"
            alt="Geoffrey, développeur web freelance et fondateur de Studio Digital Nova"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundImage: "linear-gradient(135deg, var(--color-primary), var(--color-accent-purple))",
            }}
          >
            <span className="font-heading text-display font-bold text-primary-foreground">G</span>
          </div>
        )}
      </div>
    </Card>
  )
}

function APropos() {
  return (
    <Section>
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-5 lg:gap-12">
        <motion.div
          className="lg:col-span-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={floatIn(0.1, { x: -160, rotate: -4 })}
        >
          <AboutPortrait />
        </motion.div>

        <div className="lg:col-span-3">
          <motion.div
            className="mb-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0, { y: -40, scale: 0.85 })}
          >
            <Badge variant="outline" className="gap-2 py-1.5">
              <Icon icon={User} className="size-3.5" />
              À propos
            </Badge>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.12, { y: -60, scale: 0.94 })}
          >
            <Heading variant="h2">Bonjour, moi c&apos;est Geoffrey.</Heading>
          </motion.div>

          <motion.p
            className="mt-6 max-w-xl text-body text-text-secondary"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.22, { y: 40 })}
          >
            Développeur web freelance, je conçois des sites qui allient design soigné, performance
            technique et référencement naturel. Pas d&apos;agence, pas d&apos;intermédiaire : un
            seul interlocuteur, du premier échange à la mise en ligne, pour un accompagnement
            personnalisé à chaque étape de votre projet.
          </motion.p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {STRENGTHS.map((strength, index) => (
              <motion.div
                key={strength.label}
                className="flex items-center gap-3"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={floatIn(0.32 + index * 0.1, { y: 30, scale: 0.9 })}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    strength.className
                  )}
                >
                  <Icon icon={strength.icon} className="size-5" />
                </span>
                <p className="text-small font-semibold text-text">{strength.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.75, { x: -160, rotate: -6 })}
          >
            <Button variant="primary">
              Parlons de votre projet
              <Icon icon={ArrowRight} className="size-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </Section>
  )
}

export { APropos }
