"use client"

import { Check, Tag } from "lucide-react"
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
    price: "690€",
    scope: "One Page",
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
    price: "990€",
    scope: "Site Vitrine",
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
    price: "À partir de 1200€",
    scope: "Projet sur mesure",
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
          Chaque tarif inclut un accompagnement personnalisé, du premier échange à la mise en
          ligne.
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
              variants={floatIn(index * 0.12, from)}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                  <Badge variant="primary">Le plus populaire</Badge>
                </div>
              )}

              <Card
                className={cn(
                  "flex h-full flex-col gap-6",
                  plan.featured && "border-primary/40 shadow-md lg:scale-[1.03]"
                )}
              >
                <div>
                  <p className="text-h3 font-heading font-semibold text-text">{plan.name}</p>
                  <p className="mt-1 text-small text-text-secondary">{plan.scope}</p>
                </div>

                <p className="text-[2.5rem] font-heading font-bold leading-none text-text">
                  {plan.price}
                </p>

                <div className="flex flex-1 flex-col gap-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon icon={Check} className="size-2.5" />
                      </span>
                      <p className="text-small text-text-secondary">{feature}</p>
                    </div>
                  ))}
                </div>

                <Button
                  variant={plan.featured ? "primary" : "outline"}
                  className="h-11 w-full text-small"
                >
                  Demander un devis
                </Button>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}

export { Tarifs }
