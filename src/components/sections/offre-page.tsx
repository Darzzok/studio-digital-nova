"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Check,
  Croissant,
  Gauge,
  Globe,
  Hammer,
  LayoutTemplate,
  RefreshCw,
  Search,
  Store,
  Tag,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { CardIndex, CHIP, DrawRule, NovaMark } from "@/components/ui/nova"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"
import type { IconKey, OffrePage } from "@/lib/offres"
import { useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

/** Les icônes vivent côté client : seules leurs clés traversent la frontière. */
const ICONES: Record<IconKey, typeof Globe> = {
  vitrine: Globe,
  onepage: LayoutTemplate,
  refonte: RefreshCw,
  seo: Search,
  maintenance: Wrench,
  tarifs: Tag,
  restaurant: Croissant,
  artisan: Hammer,
  tpe: Store,
}

/*
  Gabarit unique pour les pages de prestation et de métier. Une seule mise en
  page, alimentée par les données de `lib/offres.ts` : la charte reste
  cohérente et le contenu se corrige à un seul endroit.
*/
function OffrePageView({ page }: { page: OffrePage }) {
  const floatIn = useFloatIn()

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        icon={ICONES[page.icon]}
        title={page.title}
        lead={page.lead}
      >
        <Link href="/#contact" className="group w-full sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto">
            Demander un devis
            <Icon
              icon={ArrowRight}
              className="transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
            />
          </Button>
        </Link>
        <Link href="/audit-gratuit/" className="group w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <Icon icon={Gauge} />
            Audit gratuit
          </Button>
        </Link>
      </PageHero>

      {/* Corps de la page */}
      <Section className="bg-surface" spacing="default">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {page.sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={floatIn(index * 0.06, { y: 40 }, { damping: 26, mass: 2 })}
            >
              <Card
                tone="ivory"
                padding="md"
                className="group transition-colors duration-500 ease-nova hover:border-border-strong"
              >
                <CardIndex value={String(index + 1).padStart(2, "0")} />
                <h2 className="mt-5 font-heading text-h2 text-text">{section.title}</h2>

                {section.paragraphs.map((paragraphe) => (
                  <p key={paragraphe} className="measure mx-auto mt-4 text-body text-text-secondary">
                    {paragraphe}
                  </p>
                ))}

                {section.list && (
                  <>
                    <DrawRule className="mt-7" />
                    <ul className="card-list mt-6 flex flex-col gap-3">
                      {section.list.map((item) => (
                        <li key={item} className="flex items-baseline gap-3 text-small text-text-secondary">
                          <Icon icon={Check} className="size-3 shrink-0 translate-y-0.5 text-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            </motion.div>
          ))}

          {/* Repère tarifaire, quand il y en a un */}
          {page.prix && (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={floatIn(0.1, { y: 40 }, { damping: 26, mass: 2 })}
            >
              <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden lg:p-9">
                <div className="relative flex items-center justify-center gap-3">
                  <Badge variant="ink">{page.prix.libelle}</Badge>
                  <NovaMark aria-hidden className="size-2.5 text-accent" />
                </div>
                <p className="relative mt-7 font-heading text-display leading-none text-on-ink">
                  {page.prix.montant}
                </p>
                <p className="relative mt-4 text-lead text-on-ink-soft">{page.prix.detail}</p>
                <Link href="/#tarifs" className="group/cta relative mx-auto mt-7 inline-flex">
                  <Button
                    variant="primary"
                    className="bg-paper text-ink hover:bg-accent hover:text-ink"
                  >
                    Voir les trois formules
                    <Icon
                      icon={ArrowRight}
                      className="transition-transform duration-200 ease-nova group-hover/cta:translate-x-0.5"
                    />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          )}
        </div>
      </Section>

      {/* Questions propres à cette prestation */}
      {page.faq.length > 0 && (
        <Section spacing="default">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-eyebrow uppercase text-text-muted">Questions fréquentes</p>
            <div className="mt-[var(--section-gap)] flex flex-col gap-3">
              {page.faq.map((item, index) => (
                <motion.div
                  key={item.question}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={floatIn(index * 0.06, { y: 30 }, { damping: 26, mass: 2 })}
                >
                  <Card padding="md">
                    <h3 className="font-heading text-h3 text-text">{item.question}</h3>
                    <p className="measure mx-auto mt-3 text-body text-text-secondary">{item.answer}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Reprise de contact */}
      <Section className="bg-surface" spacing="default">
        <div className="mx-auto max-w-3xl">
          <Card tone="ink" padding="md" className="grain-ink relative overflow-hidden text-center lg:p-9">
            <div className="relative flex flex-col items-center">
              <span aria-hidden className="mb-4 flex items-center gap-2 text-accent">
                <span className="h-px w-8 bg-accent/50" />
                <NovaMark className="size-3" />
                <span className="h-px w-8 bg-accent/50" />
              </span>
              <Heading variant="h2" className="text-on-ink">
                Parlons de votre projet
              </Heading>
              <p className="measure mx-auto mt-6 text-lead text-on-ink-soft">
                Un échange, un devis clair sous 24 heures, et vous décidez.{" "}
                <strong className="font-semibold text-on-ink">Sans engagement.</strong>
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link href="/#contact" className="group">
                  <Button
                    variant="primary"
                    className="bg-paper text-ink hover:bg-accent hover:text-ink"
                  >
                    Demander un devis
                    <Icon
                      icon={ArrowRight}
                      className="transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
                    />
                  </Button>
                </Link>
                <Link href="/#ma-methode" className="group">
                  <Button
                    variant="outline"
                    className="border-border-ink text-on-ink hover:border-accent hover:text-accent"
                  >
                    Voir ma méthode
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </>
  )
}

/** Renvoi vers les autres pages d'offre — c'est ce qui fait tenir le maillage. */
function OffreLiens({ courant, pages }: { courant: string; pages: OffrePage[] }) {
  const autres = pages.filter((p) => p.slug !== courant)
  if (autres.length === 0) return null

  return (
    <Section spacing="sm">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-eyebrow uppercase text-text-muted">Voir aussi</p>
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {autres.map((autre) => (
            <li key={autre.slug}>
              <Link href={`/${autre.slug}/`} className="group block">
                <Card
                  padding="sm"
                  interactive
                  className="flex h-full items-center gap-4 text-left"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md group-hover:-translate-y-0.5",
                      autre.famille === "metier" ? CHIP.mineral : CHIP.ink
                    )}
                  >
                    <Icon icon={ICONES[autre.icon]} className="size-4" />
                  </span>
                  <span className="min-w-0 text-small font-medium text-text transition-colors duration-200 ease-nova group-hover:text-accent-strong">
                    {autre.navLabel ?? autre.title}
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

export { OffrePageView, OffreLiens }
