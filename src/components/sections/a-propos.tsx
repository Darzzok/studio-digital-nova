"use client"

import { useState } from "react"
import { ArrowRight, Search, Smartphone, Sparkles, User, UserCheck } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NovaImage } from "@/components/ui/nova-image"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { CHIP } from "@/components/ui/nova"
import { Section } from "@/components/ui/section"
import { useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

const STRENGTHS = [
  { icon: UserCheck, label: "Interlocuteur unique", className: CHIP.ink },
  { icon: Sparkles, label: "Site sur mesure", className: CHIP.terracotta },
  { icon: Search, label: "Optimisé SEO", className: CHIP.mineral },
  { icon: Smartphone, label: "Compatible mobile", className: CHIP.ochre },
]

/** Portrait intégré dans une carte premium — fond DS, radius et ombre du Card, photo inchangée. */
function AboutPortrait() {
  const [imgError, setImgError] = useState(false)

  return (
    <Card padding="sm" className="relative overflow-hidden">
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-md border border-border bg-background">
        {!imgError ? (
          <NovaImage
            src="/images/geoffrey.webp"
            alt="Geoffrey, développeur web freelance et fondateur de Studio Digital Nova"
            sizes="(min-width: 1024px) 480px, 90vw"
            /*
              La source est un paysage 960×768 recadré en 4/5 : 36 % de la
              largeur disparaît. Centré par défaut, le visage — situé à 54,7 %
              de l'image — retombait à 57 % du cadre, visiblement décalé vers
              la droite. 63 % sur l'axe horizontal le ramène au milieu exact.
            */
            className="object-cover object-[63%_50%]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundImage: "var(--gradient-ink)",
            }}
          >
            <span className="font-heading text-display text-paper">G</span>
          </div>
        )}
      </div>
    </Card>
  )
}

function APropos() {
  const floatIn = useFloatIn()

  return (
    <Section id="a-propos" className="scroll-mt-24">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={floatIn(0.1, { x: -160, rotate: -4 }, { damping: 30, mass: 4 })}
        >
          <AboutPortrait />
        </motion.div>

        <div className="flex flex-col items-center text-center">
          <motion.div
            className="mb-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0, { y: -40, scale: 0.85 })}
          >
            <Badge variant="outline">
              <Icon icon={User} className="size-3.5 text-accent" />
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
            className="measure mt-6 text-body text-text-secondary"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.22, { y: 40 })}
          >
            Développeur web indépendant, j&apos;accompagne les{" "}
            <strong className="font-semibold text-text">
              TPE, auto-entrepreneurs, artisans et commerçants
            </strong>{" "}
            dans la création de leur présence en ligne. Quel que soit votre corps de métier, mon
            objectif est simple : concevoir un{" "}
            <strong className="font-semibold text-text">site sur mesure, fluide et performant</strong>,
            qui valorise votre savoir-faire et attire de nouveaux clients. Fort de plusieurs
            années d&apos;expérience dans la création de sites vitrines et multi-pages, je connais
            parfaitement les enjeux des petites et moyennes entreprises. Travailler avec moi,
            c&apos;est bénéficier d&apos;<strong className="font-semibold text-text">un interlocuteur unique</strong>,
            à l&apos;écoute et réactif, qui vous guide pas à pas de l&apos;idée initiale
            jusqu&apos;à la mise en ligne. Chaque projet est pensé pour s&apos;adapter à vos
            besoins réels, sans complexité inutile. Vous obtenez un outil professionnel, efficace
            et prêt à soutenir le développement de votre activité.
          </motion.p>

          <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-2 gap-x-4 gap-y-5">
            {STRENGTHS.map((strength, index) => (
              <motion.div
                key={strength.label}
                /*
                  Sur mobile, la pastille et son libellé s'alignaient à gauche
                  de leur colonne : les quatre paraissaient de travers dans une
                  section par ailleurs centrée. Ils sont désormais empilés et
                  centrés, et reprennent leur disposition en ligne dès 640 px.
                */
                className="flex flex-col items-center gap-2.5 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={floatIn(0.32 + index * 0.1, { y: 30, scale: 0.9 })}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-md",
                    strength.className
                  )}
                >
                  <Icon icon={strength.icon} className="size-5" />
                </span>
                <p className="text-small font-medium text-text">{strength.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.65, { y: 30, scale: 0.94 })}
          >
            <Heading variant="h3">Un projet en tête ? Contactez-moi pour en discuter !</Heading>
          </motion.div>

          <motion.div
            className="mt-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.75, { x: -160, rotate: -6 })}
          >
            <Link href="/#contact" className="group">
              <Button variant="primary">
                Parlons de votre projet
                <Icon
                  icon={ArrowRight}
                  className="size-4 transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
                />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </Section>
  )
}

export { APropos }
