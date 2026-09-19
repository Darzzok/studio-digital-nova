"use client"

import Link from "next/link"
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  Globe,
  LayoutTemplate,
  Layers,
  RefreshCw,
  Search,
  Server,
  Wrench,
} from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { CHIP, CardIndex, DrawRule } from "@/components/ui/nova"
import { Section } from "@/components/ui/section"
import { EASE_NOVA, useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }

/* L'aperçu est décoratif : il cède la place au texte sur petit écran. */
const FRAME = "relative h-28 w-full overflow-hidden rounded-lg border border-border bg-background sm:h-40"

type PreviewProps = { reduce: boolean }

/** Site One Page — un hero centré unique, avec un bouton qui respire. */
function HeroPreview({ reduce }: PreviewProps) {
  return (
    <div className={`${FRAME} flex flex-col items-center justify-center gap-2.5`}>
      <div className="absolute left-3 top-3 flex gap-1">
        <span className="size-1.5 rounded-full bg-error/40" />
        <span className="size-1.5 rounded-full bg-warning/40" />
        <span className="size-1.5 rounded-full bg-success/40" />
      </div>
      <div className="h-2 w-24 rounded-full bg-text/70" />
      <div className="h-2 w-16 rounded-full bg-border" />
      <motion.div
        className="mt-2 h-5 w-20 rounded-md bg-accent"
        animate={reduce ? { scale: 1 } : { scale: [1, 1.07, 1] }}
        transition={reduce ? undefined : { duration: 2, repeat: Infinity, ease: EASE_NOVA }}
      />
    </div>
  )
}

/** Site Vitrine — nav + bandeau hero + grille de sections. */
function HomePreview() {
  return (
    <div className={`${FRAME} flex flex-col gap-2 p-3`}>
      <div className="flex items-center justify-between">
        <div className="h-2 w-7 rounded-full bg-text/70" />
        <div className="flex gap-1.5">
          <div className="h-1.5 w-4 rounded-full bg-border" />
          <div className="h-1.5 w-4 rounded-full bg-border" />
          <div className="h-1.5 w-4 rounded-full bg-border" />
        </div>
      </div>
      <div
        className="h-10 w-full rounded-lg"
        style={{ backgroundImage: "var(--gradient-ink)" }}
      />
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="rounded-md border border-border bg-surface"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1, ease: EASE_NOVA }}
          />
        ))}
      </div>
    </div>
  )
}

/** Refonte — comparaison avant / après avec un curseur qui oscille. */
function RefontePreview({ reduce }: PreviewProps) {
  return (
    <div className={FRAME}>
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-1.5 bg-muted p-3">
          <div className="h-2 w-14 rounded-full bg-text-secondary/40" />
          <div className="h-2 w-10 rounded-full bg-text-secondary/30" />
          <div className="mt-1 h-6 w-16 rounded-md border border-border" />
        </div>
        <div className="flex flex-col items-center justify-center gap-1.5 bg-surface p-3">
          <div className="h-2 w-14 rounded-full bg-text/80" />
          <div className="h-2 w-10 rounded-full bg-accent/70" />
          <div
            className="mt-1 h-6 w-16 rounded-md"
            style={{ backgroundImage: "var(--gradient-ink)" }}
          />
        </div>
      </div>
      <motion.div
        className="absolute inset-y-0 left-1/2 w-px bg-border"
        animate={reduce ? { x: 0 } : { x: [-3, 3, -3] }}
        transition={reduce ? undefined : { duration: 3, repeat: Infinity, ease: EASE_NOVA }}
      >
        <span className="absolute left-1/2 top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface shadow-sm">
          <Icon icon={ArrowLeftRight} className="size-3 text-text-secondary" />
        </span>
      </motion.div>
    </div>
  )
}

const SEO_BARS = [45, 70, 55, 85, 65, 96]

/** SEO — mini graphique de trafic + score en anneau. */
function SeoPreview() {
  return (
    <div className={`${FRAME} flex items-center gap-3 p-3`}>
      <div className="flex h-full flex-1 flex-col justify-between py-1">
        <div className="flex h-16 items-end gap-1">
          {SEO_BARS.map((h, i) => (
            <motion.div
              key={i}
              className="w-full rounded-t-xs bg-mineral/70"
              style={{ height: `${h}%`, transformOrigin: "bottom" }}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE_NOVA }}
            />
          ))}
        </div>
        <p className="text-[10px] font-medium text-text-muted">Trafic organique</p>
      </div>
      <div className="relative flex size-16 shrink-0 items-center justify-center">
        <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-border)" strokeWidth="3" />
          <motion.circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 0.96 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE_NOVA }}
          />
        </svg>
        <span className="absolute font-heading text-body text-text">98</span>
      </div>
    </div>
  )
}

const STATUS_ROWS = [
  { label: "Sécurité", dot: "bg-success" },
  { label: "Sauvegardes", dot: "bg-success" },
  { label: "Mises à jour", dot: "bg-warning" },
]

/** Maintenance — tableau de suivi avec voyants de statut et progression. */
function MaintenancePreview({ reduce }: PreviewProps) {
  return (
    <div className={`${FRAME} flex flex-col justify-center gap-3 p-4`}>
      {STATUS_ROWS.map((row, i) => (
        <div key={row.label} className="flex items-center gap-2.5">
          <motion.span
            className={`size-2 rounded-full ${row.dot}`}
            animate={reduce ? { opacity: 1 } : { opacity: [1, 0.35, 1] }}
            transition={reduce ? undefined : { duration: 2, repeat: Infinity, delay: i * 0.3, ease: EASE_NOVA }}
          />
          <span className="h-1.5 flex-1 rounded-full bg-border" />
          <span className="text-[10px] text-text-muted">{row.label}</span>
        </div>
      ))}
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 0.78 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE_NOVA }}
          style={{ transformOrigin: "left" }}
        />
      </div>
    </div>
  )
}

/** Hébergement & mise en ligne — panneau serveur avec voyant "En ligne". */
function ServerPreview({ reduce }: PreviewProps) {
  return (
    <div className={`${FRAME} flex flex-col justify-center gap-2 p-4`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-md border border-border bg-surface px-2.5 py-1.5"
        >
          <div className="flex gap-1">
            <span className="h-1 w-6 rounded-full bg-border" />
            <span className="h-1 w-3 rounded-full bg-border" />
          </div>
          <span className="size-1.5 rounded-full bg-success" />
        </div>
      ))}
      <motion.div
        className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5"
        initial={{ backgroundColor: "var(--color-border)" }}
        whileInView={{ backgroundColor: "rgba(74,107,87,0.12)" }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE_NOVA }}
      >
        <motion.span
          className="size-2 rounded-full bg-success"
          animate={
            reduce
              ? { boxShadow: "0 0 0 0 rgba(74,107,87,0)" }
              : {
                  boxShadow: [
                    "0 0 0 0 rgba(74,107,87,0.4)",
                    "0 0 0 6px rgba(74,107,87,0)",
                    "0 0 0 0 rgba(74,107,87,0)",
                  ],
                }
          }
          transition={reduce ? undefined : { duration: 1.8, repeat: Infinity, ease: EASE_NOVA }}
        />
        <span className="text-eyebrow uppercase text-success">En ligne</span>
      </motion.div>
    </div>
  )
}

const SERVICES = [
  {
    title: "Site One Page",
    href: "/creation-site-one-page/",
    description: (
      <>
        Une page unique et percutante pour présenter votre activité{" "}
        <strong className="font-semibold text-text">rapidement</strong>.
      </>
    ),
    icon: LayoutTemplate,
    className: CHIP.ink,
    features: [
      "Design sur mesure, pensé pour convertir",
      "Livré en 5 jours",
      "Idéal pour lancer rapidement votre activité",
    ],
    Preview: HeroPreview,
  },
  {
    title: "Site Vitrine",
    href: "/creation-site-vitrine/",
    description: (
      <>
        Un site <strong className="font-semibold text-text">multi-pages complet</strong> pour
        présenter votre entreprise en détail.
      </>
    ),
    icon: Globe,
    className: CHIP.terracotta,
    features: [
      "Jusqu'à 5 pages incluses",
      "Structure pensée pour le référencement",
      "Contenu et images optimisés",
    ],
    Preview: HomePreview,
  },
  {
    title: "Refonte de site",
    href: "/refonte-site-internet/",
    description: (
      <>
        Redonnez <strong className="font-semibold text-text">une seconde vie</strong> à votre
        site avec un design moderne.
      </>
    ),
    icon: RefreshCw,
    className: CHIP.mineral,
    features: [
      "Reprise de votre contenu existant",
      "Design entièrement modernisé",
      "Aucune perte de référencement",
    ],
    Preview: RefontePreview,
  },
  {
    title: "SEO",
    href: "/referencement-seo/",
    description: (
      <>
        Une optimisation fine pour être{" "}
        <strong className="font-semibold text-text">mieux référencé sur Google</strong>.
      </>
    ),
    icon: Search,
    className: CHIP.ochre,
    features: [
      "Audit complet de votre site",
      "Optimisation technique et éditoriale",
      "Suivi mensuel des positions",
    ],
    Preview: SeoPreview,
  },
  {
    title: "Maintenance",
    href: "/maintenance-site-internet/",
    description: (
      <>
        Mises à jour et suivi technique pour un site{" "}
        <strong className="font-semibold text-text">toujours performant</strong>.
      </>
    ),
    icon: Wrench,
    className: CHIP.ink,
    features: [
      "Mises à jour de sécurité",
      "Sauvegardes automatiques",
      "Intervention rapide en cas de souci",
    ],
    Preview: MaintenancePreview,
  },
  {
    title: "Hébergement & mise en ligne",
    href: "/maintenance-site-internet/",
    description: (
      <>
        Un hébergement <strong className="font-semibold text-text">fiable et sécurisé</strong>,
        avec une mise en ligne rapide.
      </>
    ),
    icon: Server,
    className: CHIP.sage,
    features: [
      "Hébergement rapide et sécurisé",
      "Certificat SSL inclus",
      "Mise en ligne en moins de 24h",
    ],
    Preview: ServerPreview,
  },
]

function Services() {
  const reduce = useReducedMotion()
  const floatIn = useFloatIn()


  return (
    <Section id="services" className="scroll-mt-24 bg-surface">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
        <motion.div
          className="mb-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -40, scale: 0.85 })}
        >
          <Badge variant="outline">
            <Icon icon={Layers} className="size-3.5 text-accent" />
            Mes services
          </Badge>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.12, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h2">Tout ce qu&apos;il faut pour réussir en ligne</Heading>
        </motion.div>

        <motion.p
          className="measure mt-6 text-lead text-text-secondary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.22, { y: 40 })}
        >
          Du site vitrine à la refonte complète, je vous accompagne à chaque étape de votre
          présence en ligne. Chaque prestation est pensée pour rester{" "}
          <strong className="font-semibold text-text">simple, efficace et sans mauvaise surprise</strong>.
        </motion.p>
      </div>

      {/*
        Sous 640 px, les six services se parcourent en glissant. Cela remplace
        le « voir les 3 autres » : plus de clic pour découvrir la moitié de
        l'offre, et la section ne fait plus qu'un écran au lieu de trois.

        L'entrée est portée par le RAIL, pas par chaque carte. Auparavant chaque
        carte avait son propre `whileInView` : en glissant horizontalement, elles
        rejouaient leur animation une à une et semblaient bouger dans tous les
        sens. Le rendu serveur ignore la largeur d'écran et applique l'état caché
        « desktop » (x ±180, rotate ±6), ce qui rendait le saut d'autant plus
        visible. Désormais : une seule entrée en cascade quand la section arrive
        à l'écran, puis les cartes ne bougent plus.
      */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        className={cn(
          "mt-[var(--section-gap)]",
          "rail-mobile -mx-4 gap-4 px-4 pb-2",
          "sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
        )}
      >
        {SERVICES.map((service, index) => {
          const column = index % 3
          const from: FloatFrom =
            column === 0
              ? { x: -180, rotate: -6 }
              : column === 2
                ? { x: 180, rotate: 6 }
                : { y: 100 }

          return (
            <motion.div
              key={service.title}
              className="w-[85vw] shrink-0 snap-center sm:w-auto sm:shrink"
              variants={floatIn(index * 0.12, from, { damping: 30, mass: 4 })}
            >
              <Card
                tone="ivory"
                padding="md"
                className="group relative flex h-full flex-col overflow-hidden transition-colors duration-500 ease-nova hover:border-border-strong"
              >
                {/* Ouverture éditoriale : rang, filet, pastille de service. */}
                <div className="flex items-center gap-4">
                  <CardIndex value={String(index + 1).padStart(2, "0")} className="flex-1" />
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md group-hover:-translate-y-0.5",
                      service.className
                    )}
                  >
                    <Icon icon={service.icon} className="size-4" />
                  </span>
                </div>

                {/*
                  L'aperçu dérive légèrement de son cadre au survol : c'est le
                  contenu qui bouge, jamais la carte entière.
                */}
                <div className="mt-6 overflow-hidden rounded-lg">
                  <div className="transition-transform duration-700 ease-editorial group-hover:-translate-y-1">
                    <service.Preview reduce={Boolean(reduce)} />
                  </div>
                </div>

                <h3 className="mt-7 font-heading text-h3 text-text transition-colors duration-300 ease-nova group-hover:text-accent-strong">
                  {service.title}
                </h3>

                <p className="mt-3 text-small text-text-secondary">{service.description}</p>

                <DrawRule className="mt-6" />

                <ul className="card-list mt-5 flex flex-col gap-3">
                  {service.features.map((feature, featureIndex) => (
                    <motion.li
                      key={feature}
                      className="flex items-baseline gap-3 text-small text-text-secondary"
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.35, delay: 0.15 + featureIndex * 0.08, ease: EASE_NOVA }}
                    >
                      <Icon icon={Check} className="size-3 shrink-0 translate-y-0.5 text-accent" />
                      {feature}
                    </motion.li>
                  ))}
                </ul>

                {/*
                  L'accès à la page dédiée est explicite. Le lien porte la zone
                  cliquable étendue à toute la carte : le survol de n'importe quel
                  point de la carte anime cette ligne, et un seul lien est exposé
                  au clavier et aux lecteurs d'écran.
                */}
                <Link
                  href={service.href}
                  className="mx-auto mt-auto inline-flex w-fit items-center gap-2 pt-7 text-small font-medium text-text outline-none transition-colors duration-300 ease-nova hover:text-accent-strong focus-visible:text-accent-strong"
                >
                  <span className="absolute inset-0 z-10" aria-hidden />
                  En savoir plus
                  <span className="sr-only"> sur {service.title}</span>
                  <Icon
                    icon={ArrowRight}
                    className="size-4 text-accent transition-transform duration-300 ease-nova group-hover:translate-x-1"
                  />
                </Link>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

    </Section>
  )
}

export { Services }
