"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Section } from "@/components/ui/section"
import { EASE_NOVA } from "@/lib/motion"

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

const QUESTIONS = [
  {
    question: "Combien de temps faut-il pour créer mon site ?",
    answer: (
      <>
        Comptez <strong className="font-semibold text-text">5 jours</strong> pour un site one
        page, <strong className="font-semibold text-text">10 jours</strong> pour un site vitrine
        complet, et un délai adapté pour les projets sur mesure.
      </>
    ),
  },
  {
    question: "Le prix affiché est-il le prix final ?",
    answer: (
      <>
        Oui, mes tarifs sont{" "}
        <strong className="font-semibold text-text">fixes et transparents</strong>. Aucun frais
        caché ne s&apos;ajoute en cours de projet.
      </>
    ),
  },
  {
    question: "Puis-je modifier mon site moi-même après la livraison ?",
    answer: (
      <>
        Oui, je vous forme à la prise en main et peux ajouter un{" "}
        <strong className="font-semibold text-text">espace d&apos;administration</strong> si
        besoin.
      </>
    ),
  },
  {
    question: "Le référencement SEO est-il inclus ?",
    answer: (
      <>
        Il est inclus dans les offres{" "}
        <strong className="font-semibold text-text">Pro et Premium</strong>, et disponible en
        option pour l&apos;offre Essentiel.
      </>
    ),
  },
  {
    question: "Que se passe-t-il si je ne suis pas satisfait du design ?",
    answer: (
      <>
        J&apos;ajuste le design jusqu&apos;à ce qu&apos;il corresponde exactement à votre vision,{" "}
        <strong className="font-semibold text-text">sans frais supplémentaire</strong>.
      </>
    ),
  },
  {
    question: "Proposez-vous l'hébergement du site ?",
    answer: (
      <>
        Oui, je propose un hébergement{" "}
        <strong className="font-semibold text-text">fiable et sécurisé</strong>, avec une mise en
        ligne rapide.
      </>
    ),
  },
  {
    question: "Le site sera-t-il adapté aux mobiles ?",
    answer: (
      <>
        Tous mes sites sont{" "}
        <strong className="font-semibold text-text">100% responsives</strong> et testés sur
        mobile, tablette et ordinateur.
      </>
    ),
  },
  {
    question: "Comment se déroule la prise de contact ?",
    answer: (
      <>
        Vous me contactez via le formulaire, nous échangeons ensemble sur votre projet puis vous
        recevez un <strong className="font-semibold text-text">devis gratuit sous 24h</strong>.
      </>
    ),
  },
  {
    question: "Puis-je demander une refonte de mon site existant ?",
    answer: (
      <>
        Bien sûr, je propose un service de{" "}
        <strong className="font-semibold text-text">refonte complète</strong> pour moderniser
        votre site actuel.
      </>
    ),
  },
]

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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
            <Icon icon={HelpCircle} className="size-3.5" />
            Questions fréquentes
          </Badge>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.12, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h2">Tout ce que vous vous demandez encore</Heading>
        </motion.div>

        <motion.p
          className="mt-6 max-w-xl text-body text-text-secondary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.22, { y: 40 })}
        >
          Tout ce qu'il faut savoir avant de vous lancer. Une autre question ? Contactez-moi,{" "}
          <strong className="font-semibold text-text">je réponds personnellement à chaque message</strong>.
        </motion.p>
      </div>

      <div className="mx-auto mt-16 flex max-w-3xl flex-col gap-4">
        {QUESTIONS.map((item, index) => {
          const isOpen = openIndex === index
          const from: FloatFrom =
            index % 2 === 0 ? { x: -140, rotate: -4 } : { x: 140, rotate: 4 }

          return (
            <motion.div
              key={item.question}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={floatIn(index * 0.08, from, { damping: 30, mass: 4 })}
            >
              <Card className="overflow-hidden p-0">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="text-body font-semibold text-text">{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: EASE_NOVA }}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    <Icon icon={ChevronDown} className="size-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE_NOVA }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-body text-text-secondary">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}

export { FAQ }
