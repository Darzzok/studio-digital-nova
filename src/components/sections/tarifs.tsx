"use client"

import { ArrowRight, Check, Crown, Rocket, Sparkles, Tag } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { CHIP, DrawRule, NovaCorner } from "@/components/ui/nova"
import { Section } from "@/components/ui/section"
import { useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }

const PLANS = [
  {
    name: "Essentiel",
    icon: Rocket,
    className: CHIP.mineral,
    price: "690 €",
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
    className: CHIP.terracotta,
    price: "990 €",
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
    className: CHIP.ink,
    price: "À partir de 1 200 €",
    scope: "Projet sur mesure",
    tagline: "Un accompagnement sur mesure, sans compromis.",
    idealFor: "Idéal pour un projet ambitieux aux besoins spécifiques.",
    features: [
      "Tout Pro, plus :",
      "Fonctionnalités sur mesure",
      "Accompagnement dédié",
      "Optimisation avancée",
    ],
    featured: false,
  },
]

/** Paliers de la gamme — chiffrage romain, purement décoratif. */
const TIERS = ["I", "II", "III"]

function Tarifs() {
  const floatIn = useFloatIn()

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
          <Badge variant="outline">
            <Icon icon={Tag} className="size-3.5 text-accent" />
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
          className="measure mt-6 text-lead text-text-secondary"
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

      <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                  <Badge variant="accent" className="whitespace-nowrap border-accent bg-accent text-ink">
                    <Icon icon={Sparkles} className="size-3" />
                    Le plus populaire
                  </Badge>
                </div>
              )}

              <Card
                tone={plan.featured ? "ink" : "paper"}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden text-left",
                  "transition-[transform,box-shadow,border-color] duration-500 ease-nova hover:-translate-y-1",
                  plan.featured
                    ? "shadow-lg hover:border-accent/60 hover:shadow-lg"
                    : "hover:border-border-strong hover:shadow-[var(--shadow-lift)]"
                )}
              >
                {/*
                  Lavis d'accent qui monte du haut de la carte au survol.
                  Très bas en opacité : on doit le sentir, pas le voir.
                */}
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-x-0 top-0 h-40 opacity-0",
                    "transition-opacity duration-700 ease-editorial group-hover:opacity-100",
                    plan.featured
                      ? "bg-gradient-to-b from-accent/12 to-transparent"
                      : "bg-gradient-to-b from-accent/[0.06] to-transparent"
                  )}
                />
                <NovaCorner tone={plan.featured ? "ink" : "light"} />

                {/*
                  Palier et rail de progression : trois segments, remplis
                  jusqu'au rang de l'offre. On lit la gamme d'un coup d'œil.
                */}
                <div aria-hidden className="relative flex items-center gap-3">
                  <span
                    className={cn(
                      "font-heading text-small leading-none transition-colors duration-500 ease-nova delay-75",
                      plan.featured ? "text-accent" : "text-text-muted group-hover:text-accent-strong"
                    )}
                  >
                    {TIERS[index]}
                  </span>
                  <span aria-hidden className="flex flex-1 items-center gap-1">
                    {PLANS.map((_, segment) => (
                      <span
                        key={segment}
                        className={cn(
                          "h-px flex-1 transition-colors duration-500 ease-nova",
                          segment <= index
                            ? "bg-accent"
                            : cn(
                                plan.featured ? "bg-border-ink" : "bg-border",
                                // Le palier suivant se devine au survol.
                                segment === index + 1 && "group-hover:bg-accent/40"
                              )
                        )}
                      />
                    ))}
                  </span>
                </div>

                <div className="relative mt-7 flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={cn(
                        "text-eyebrow uppercase",
                        plan.featured ? "text-on-ink-soft" : "text-text-muted"
                      )}
                    >
                      {plan.scope}
                    </p>
                    <h3
                      className={cn(
                        "mt-2 font-heading text-h3",
                        plan.featured ? "text-on-ink" : "text-text"
                      )}
                    >
                      {plan.name}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md group-hover:-translate-y-0.5",
                      plan.featured
                        ? "border border-accent bg-accent text-ink transition-colors duration-500 ease-nova"
                        : plan.className
                    )}
                  >
                    <Icon icon={plan.icon} className="size-4" />
                  </span>
                </div>

                <p
                  className={cn(
                    "relative mt-6 whitespace-nowrap font-heading text-[clamp(1.375rem,0.9rem+1.5vw,2rem)] leading-none",
                    "transition-transform duration-500 ease-editorial delay-100 group-hover:-translate-y-0.5",
                    plan.featured ? "text-on-ink" : "text-text"
                  )}
                >
                  {plan.price}
                </p>

                <p
                  className={cn(
                    "relative mt-4 text-small",
                    plan.featured ? "text-on-ink-soft" : "text-text-secondary"
                  )}
                >
                  {plan.tagline}
                </p>

                <DrawRule className="mt-6" tone={plan.featured ? "ink" : "light"} />

                <div className="relative mt-5 flex flex-1 flex-col gap-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-baseline gap-3">
                      <Icon
                        icon={Check}
                        className={cn(
                          "size-3 shrink-0 translate-y-0.5",
                          plan.featured ? "text-accent" : "text-accent-strong"
                        )}
                      />
                      <p
                        className={cn(
                          "text-small",
                          plan.featured ? "text-on-ink-soft" : "text-text-secondary"
                        )}
                      >
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>

                <p
                  className={cn(
                    "relative mt-6 border-t pt-5 text-small italic",
                    plan.featured
                      ? "border-border-ink text-on-ink-soft"
                      : "border-border text-text-muted"
                  )}
                >
                  {plan.idealFor}
                </p>

                <Link href="/#contact" className="group/cta relative mt-6 w-full">
                  <Button
                    variant={plan.featured ? "primary" : "outline"}
                    className={cn(
                      "h-11 w-full",
                      plan.featured && "bg-paper text-ink hover:bg-accent hover:text-ink"
                    )}
                  >
                    Demander un devis
                    <Icon
                      icon={ArrowRight}
                      className="transition-transform duration-200 ease-nova group-hover/cta:translate-x-0.5"
                    />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}

export { Tarifs }
