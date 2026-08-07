"use client";

import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { useFloatIn } from "@/lib/motion";

const SECTIONS = [
  {
    title: "Éditeur du site",
    content: (
      <>
        Le site Studio Digital Nova est édité par{" "}
        <strong className="font-semibold text-text">Geoffrey Marechal</strong>, entrepreneur
        individuel (auto-entrepreneur), immatriculé sous le numéro SIRET{" "}
        <strong className="font-semibold text-text">912 865 474 00031</strong>, domicilié à
        Quatremare (27400), France.{" "}
        <strong className="font-semibold text-text">
          TVA non applicable, article 293 B du Code général des impôts.
        </strong>{" "}
        Directeur de la publication : Geoffrey Marechal. Contact :{" "}
        <strong className="font-semibold text-text">contact@studiodigitalnova.fr</strong>.
      </>
    ),
  },
  {
    title: "Hébergement",
    content: (
      <>
        Ce site est hébergé par{" "}
        <strong className="font-semibold text-text">Hostinger International Ltd.</strong>,
        Lumiel Building, 61 Lordou Vironos Street, 6023 Larnaca, Chypre. Site web :{" "}
        <strong className="font-semibold text-text">hostinger.fr</strong>.
      </>
    ),
  },
  {
    title: "Propriété intellectuelle",
    content: (
      <>
        L&apos;ensemble des contenus présents sur ce site (textes, images, graphismes, logo) sont
        la <strong className="font-semibold text-text">propriété de Studio Digital Nova</strong>,
        sauf mention contraire, et ne peuvent être reproduits sans autorisation préalable.
      </>
    ),
  },
  {
    title: "Responsabilité",
    content:
      "Studio Digital Nova s'efforce d'assurer l'exactitude des informations diffusées sur ce site, sans garantir qu'elles soient exemptes d'erreurs ou d'omissions.",
  },
  {
    title: "Litiges",
    content: (
      <>
        Le présent site est soumis au <strong className="font-semibold text-text">droit français</strong>.
        Tout litige relève de la compétence des tribunaux français.
      </>
    ),
  },
];

function LegalContent() {
  const floatIn = useFloatIn();

  return (
    <Section>
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h1">Mentions légales</Heading>
        </motion.div>

        <motion.p
          className="mt-6 max-w-xl text-body text-text-secondary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.1, { y: 40 })}
        >
          Les informations légales relatives à l&apos;édition et à l&apos;hébergement de ce site.
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

export { LegalContent };
