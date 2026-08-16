"use client"

import { CircleAlert, CircleCheck, Lightbulb, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { CardIndex, DrawRule } from "@/components/ui/nova"
import { Section } from "@/components/ui/section"
import { EASE_NOVA, useFloatIn } from "@/lib/motion"

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }

const FRAME = "relative h-40 w-full overflow-hidden rounded-lg border border-border bg-background"

type PreviewVariant = "restaurant" | "artisan" | "pme"

/** Mini maquette de site — hero, cartes de contenu et bouton, au langage du Hero principal. */
function CasePreview({
  variant,
  from,
  to,
  reduce,
}: {
  variant: PreviewVariant
  from: string
  to: string
  reduce: boolean
}) {
  const gradient = `linear-gradient(135deg, ${from}, ${to})`

  const dots = (
    <div className="flex gap-1">
      <span className="size-1.5 rounded-full bg-error/40" />
      <span className="size-1.5 rounded-full bg-warning/40" />
      <span className="size-1.5 rounded-full bg-success/40" />
    </div>
  )

  const pulse = (
    <motion.div
      className="mx-auto h-4 w-16 rounded-full"
      style={{ backgroundImage: gradient }}
      animate={reduce ? { scale: 1 } : { scale: [1, 1.06, 1] }}
      transition={reduce ? undefined : { duration: 2, repeat: Infinity, ease: EASE_NOVA }}
    />
  )

  if (variant === "pme") {
    return (
      <div className={`${FRAME} flex flex-col gap-2 p-3`}>
        {dots}
        <div className="grid flex-1 grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-background p-2 opacity-60">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-text-secondary">
              Avant
            </span>
            <span className="h-2 w-full rounded-full bg-border" />
            <span className="h-1 w-3/4 rounded-full bg-border" />
            <span className="h-1 w-1/2 rounded-full bg-border" />
          </div>
          <motion.div
            className="flex flex-col gap-1.5 rounded-md border border-accent/35 bg-surface p-2 shadow-sm"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4, delay: 0.2, ease: EASE_NOVA }}
          >
            <span className="text-[9px] font-semibold uppercase tracking-wide text-accent-strong">
              Après
            </span>
            <span className="h-2 w-full rounded-full" style={{ backgroundImage: gradient }} />
            <span className="h-1 w-full rounded-full bg-accent/25" />
            <span className="h-1 w-2/3 rounded-full bg-accent/25" />
          </motion.div>
        </div>
        {pulse}
      </div>
    )
  }

  if (variant === "artisan") {
    return (
      <div className={`${FRAME} flex flex-col gap-2 p-3`}>
        {dots}
        <div className="grid flex-1 grid-cols-2 gap-1.5">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="rounded-md border border-border"
              style={{ backgroundImage: gradient, opacity: 0.85 }}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 0.85, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.1, ease: EASE_NOVA }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1 rounded-md border border-border bg-surface p-1.5">
          <span className="h-1 w-full rounded-full bg-border" />
          <span className="h-1 w-2/3 rounded-full bg-border" />
        </div>
        {pulse}
      </div>
    )
  }

  return (
    <div className={`${FRAME} flex flex-col gap-2 p-3`}>
      {dots}
      <div className="h-11 w-full rounded-lg" style={{ backgroundImage: gradient }} />
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="rounded-md border border-border bg-surface"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: EASE_NOVA }}
          />
        ))}
      </div>
      {pulse}
    </div>
  )
}

const CASES: {
  sector: string
  title: string
  problem: string
  solution: string
  outcome: string
  variant: PreviewVariant
  gradientFrom: string
  gradientTo: string
}[] = [
  {
    sector: "Restauration",
    title: "Restaurant",
    problem:
      "Le restaurant n'avait aucune présence en ligne et les clients trouvaient difficilement les informations essentielles.",
    solution:
      "Création d'un site moderne présentant le menu, les horaires, la localisation et les moyens de réservation.",
    outcome: "Un site clair qui rassure les clients et facilite la réservation.",
    variant: "restaurant",
    gradientFrom: "var(--color-ink)",
    gradientTo: "var(--color-mineral)",
  },
  {
    sector: "Artisanat",
    title: "Artisan",
    problem:
      "Les demandes arrivaient uniquement par téléphone et l'entreprise ne présentait pas clairement ses services.",
    solution:
      "Création d'un site vitrine optimisé permettant de présenter les prestations, les réalisations et de générer des demandes de devis.",
    outcome: "Une image professionnelle qui génère plus de demandes de devis.",
    variant: "artisan",
    gradientFrom: "var(--color-mineral)",
    gradientTo: "var(--color-success)",
  },
  {
    sector: "TPE",
    title: "TPE",
    problem:
      "L'entreprise possédait un ancien site peu rassurant, lent et non adapté aux mobiles.",
    solution:
      "Refonte complète avec un design moderne, responsive, rapide et optimisé pour le référencement.",
    outcome: "Un site moderne qui inspire confiance et convertit mieux.",
    variant: "pme",
    gradientFrom: "var(--color-ink)",
    gradientTo: "var(--color-accent)",
  },
]

function CasClients() {
  const reduce = useReducedMotion()
  const floatIn = useFloatIn()

  return (
    <Section id="cas-client" className="scroll-mt-24 bg-surface">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
        <motion.div
          className="mb-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -40, scale: 0.85 })}
        >
          <Badge variant="outline">
            <Icon icon={Lightbulb} className="size-3.5 text-accent" />
            Cas client
          </Badge>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.12, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h2">Des solutions adaptées à chaque activité</Heading>
        </motion.div>

        <motion.p
          className="measure mt-6 text-lead text-text-secondary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.22, { y: 40 })}
        >
          Chaque entreprise a des besoins différents. Voici quelques exemples de{" "}
          <strong className="font-semibold text-text">problématiques que Studio Digital Nova peut résoudre</strong>.
        </motion.p>
      </div>

      <div className="mt-[var(--section-gap)] grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CASES.map((item, index) => {
          const column = index % 3
          const from: FloatFrom =
            column === 0
              ? { x: -180, rotate: -6 }
              : column === 2
                ? { x: 180, rotate: 6 }
                : { y: 100 }

          return (
            <motion.div
              key={item.sector}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={floatIn(index * 0.12, from, { damping: 30, mass: 4 })}
            >
              <Card
                tone="ivory"
                padding="md"
                className="group relative flex h-full flex-col overflow-hidden text-left transition-colors duration-500 ease-nova hover:border-border-strong"
              >
                <div className="flex items-center gap-4">
                  <CardIndex value={String(index + 1).padStart(2, "0")} className="flex-1" />
                  <Badge variant="outline">{item.sector}</Badge>
                </div>

                <div className="mt-6 overflow-hidden rounded-lg">
                  <div className="transition-transform duration-700 ease-editorial group-hover:-translate-y-1">
                    <CasePreview
                      variant={item.variant}
                      from={item.gradientFrom}
                      to={item.gradientTo}
                      reduce={Boolean(reduce)}
                    />
                  </div>
                </div>

                <h3 className="mt-7 font-heading text-h3 text-text">{item.title}</h3>

                <DrawRule className="mt-6" />

                {/*
                  Problématique → Solution → Résultat : une progression lue de
                  haut en bas, portée par trois filets verticaux plutôt que par
                  trois aplats. Le dernier filet est terracotta et signé.
                */}
                <div className="mt-6 flex w-full flex-1 flex-col gap-6">
                  <div className="border-l border-l-warning pl-4">
                    <span className="flex items-center gap-2 text-eyebrow uppercase text-text-muted">
                      <Icon icon={CircleAlert} className="size-3 text-warning" />
                      Problématique
                    </span>
                    <p className="mt-2 text-small text-text-secondary">{item.problem}</p>
                  </div>

                  <div className="border-l border-l-mineral pl-4">
                    <span className="flex items-center gap-2 text-eyebrow uppercase text-text-muted">
                      <Icon icon={CircleCheck} className="size-3 text-mineral" />
                      Solution
                    </span>
                    <p className="mt-2 text-small text-text-secondary">{item.solution}</p>
                  </div>

                  <div className="border-l border-l-accent pl-4">
                    <span className="flex items-center gap-2 text-eyebrow uppercase text-accent-strong">
                      <Icon icon={Sparkles} className="size-3 text-accent" />
                      Résultat
                    </span>
                    <p className="mt-2 text-small text-text">{item.outcome}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}

export { CasClients }
