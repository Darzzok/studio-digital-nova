"use client";

import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number };
type FloatOptions = { stiffness?: number; damping?: number; mass?: number; opacityDuration?: number };

function floatIn(delay: number, from: FloatFrom, options?: FloatOptions) {
  const { stiffness = 110, damping = 15, mass = 1, opacityDuration = 0.4 } = options ?? {};
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
  };
}

const SECTIONS = [
  {
    title: "Responsable du traitement",
    content:
      "En tant qu'entrepreneur individuel exerçant sous le nom Studio Digital Nova, je suis responsable du traitement des données collectées sur ce site. Pour toute question, contactez-moi à contact@studiodigitalnova.fr.",
  },
  {
    title: "Données collectées",
    content:
      "Lorsque vous utilisez le formulaire de contact, je collecte votre nom, votre email, votre téléphone, le nom de votre entreprise, la description de votre projet et votre budget. Seuls le nom, l'email et le message sont obligatoires.",
  },
  {
    title: "Finalité du traitement",
    content:
      "Ces informations sont utilisées uniquement pour répondre à votre demande de devis et échanger avec vous sur votre projet. Elles ne sont ni vendues, ni partagées avec des tiers.",
  },
  {
    title: "Conservation des données",
    content:
      "Vos données sont conservées le temps nécessaire au traitement de votre demande, puis supprimées ou archivées conformément à la réglementation en vigueur.",
  },
  {
    title: "Cookies",
    content:
      "Ce site n'utilise aucun cookie de suivi ni outil de mesure d'audience tiers. Aucune donnée de navigation n'est collectée à des fins publicitaires.",
  },
  {
    title: "Vos droits",
    content:
      "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez-moi à contact@studiodigitalnova.fr.",
  },
];

function PrivacyContent() {
  return (
    <Section>
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h1">Politique de confidentialité</Heading>
        </motion.div>

        <motion.p
          className="mt-6 max-w-xl text-body text-text-secondary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.1, { y: 40 })}
        >
          La protection de vos données est une priorité. Voici comment je les traite.
        </motion.p>
      </div>

      <motion.div
        className="mx-auto mt-16 max-w-3xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={floatIn(0.15, { y: 100 })}
      >
        <Card className="flex flex-col gap-8 text-left">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <Heading variant="h3">{section.title}</Heading>
              <p className="mt-3 text-body text-text-secondary">{section.content}</p>
            </div>
          ))}
        </Card>
      </motion.div>
    </Section>
  );
}

export { PrivacyContent };
