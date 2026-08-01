"use client"

import { Check, Crown, Rocket, Sparkles, Tag } from "lucide-react"
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

const PLANS = [
  {
    name: "Essentiel",
    icon: Rocket,
    price: "690€",
    scope: "One Page",
    tagline: "Pour démarrer votre présence en ligne rapidement.",
    idealFor: "Idéal pour lancer votre activité sans attendre.",
    features: [
      "Design personnalisé",
      "1 page optimisée",
      "Formulaire de contact",
      "Livraison en 5 jours",
    ],
    featured: false,
  },
  {
    name: "Pro",
    icon: Sparkles,
    price: "990€",
    scope: "Site Vitrine",
    tagline: "La formule la plus complète pour convertir vos visiteurs.",
    idealFor: "Idéal pour une entreprise qui veut se démarquer durablement.",
    features: [
      "Tout Essentiel, plus :",
      "Jusqu'à 5 pages",
      "Optimisation SEO incluse",
      "Design responsive premium",
      "Livraison en 10 jours",
    ],
    featured: true,
  },
  {
    name: "Premium",
    icon: Crown,
    price: "À partir de 1200€",
    scope: "Projet sur mesure",
    tagline: "Un accompagnement sur mesure, sans compromis.",
    idealFor: "Idéal pour un projet ambitieux aux besoins spécifiques.",
    features: [
      "Tout Pro, plus :",
      "Fonctionnalités sur mesure",
      "Accompagnement dédié",
      "Maintenance incluse",
    ],
    featured: false,
  },
]

function Tarifs() {
  return (
    <Section id="tarifs" className="scroll-mt-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
        <motion.div
          className="mb-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -40, scale: 0.85 })}
        >
          <Badge variant="outline" className="gap-2 py-1.5">
            <Icon icon={Tag} className="size-3.5" />
            Tarifs
          </Badge>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.12, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h2">Un investissement clair, sans surprise</Heading>
        </motion.div>

        <motion.p
          className="mt-6 max-w-xl text-body text-text-secondary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.22, { y: 40 })}
        >
          Une offre adaptée à chaque étape de votre projet, du site one page au projet sur mesure.
          Chaque tarif inclut{" "}
          <strong className="font-semibold text-text">un accompagnement personnalisé</strong>, du
          premier échange à la mise en ligne.
        </motion.p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {PLANS.map((plan, index) => {
          const column = index % 3
          const from: FloatFrom =
            column === 0
              ? { x: -180, rotate: -6 }
              : column === 2
                ? { x: 180, rotate: 6 }
                : { y: 100 }

          return (
            <motion.div
              key={plan.name}
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={floatIn(index * 0.12, from, { damping: 30, mass: 4 })}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                  <Badge variant="primary" className="gap-1.5 shadow-sm">
                    <Icon icon={Sparkles} className="size-3" />
                    Le plus populaire
                  </Badge>
                </div>
              )}

              <Card
                className={cn(
                  "relative flex h-full flex-col items-center gap-5 overflow-hidden text-center",
                  plan.featured && "border-primary/50 shadow-lg lg:scale-[1.05]"
                )}
              >
                {plan.featured && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-x-10 -top-24 h-48 rounded-full bg-primary/20 blur-3xl"
                  />
                )}

                <span
                  className={cn(
                    "relative flex size-11 shrink-0 items-center justify-center rounded-xl",
                    plan.featured ? "bg-primary text-primary-foreground shadow-sm" : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon icon={plan.icon} className="size-5" />
                </span>

                <div className="relative">
                  <p className="text-h3 font-heading font-semibold text-text">{plan.name}</p>
                  <p className="text-small text-text-secondary">{plan.scope}</p>
                </div>

                <p className="relative text-small text-text-secondary">{plan.tagline}</p>

                <p className="relative text-[2.5rem] font-heading font-bold leading-none text-text">
                  {plan.price}
                </p>

                <div className="relative flex flex-1 flex-col gap-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start justify-center gap-2.5">
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                          plan.featured ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon icon={Check} className="size-2.5" />
                      </span>
                      <p className="text-small text-text-secondary">{feature}</p>
                    </div>
                  ))}
                </div>

                <p className="relative w-full border-t border-border pt-4 text-small text-text-secondary">
                  {plan.idealFor}
                </p>

                <a href="/#contact" className="relative w-full">
                  <Button
                    variant={plan.featured ? "primary" : "outline"}
                    className="h-11 w-full text-small"
                  >
                    Demander un devis
                  </Button>
                </a>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}

export { Tarifs }
