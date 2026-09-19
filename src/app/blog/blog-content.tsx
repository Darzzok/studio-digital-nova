"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Code2,
  Compass,
  FileText,
  Layers,
  Palette,
  Search,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NovaImage } from "@/components/ui/nova-image"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { CHIP, CardIndex, NovaMark } from "@/components/ui/nova"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"
import { ARTICLES, type Article } from "@/lib/articles"
import { useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }

/* ------------------------------------------------------------------------ */
/* Contenu — à remplacer par de vrais articles quand ils seront prêts.       */
/* ------------------------------------------------------------------------ */

const STATS = [
  { icon: FileText, value: String(ARTICLES.length), label: "Articles", className: CHIP.ink },
  { icon: Layers, value: "6", label: "Catégories", className: CHIP.terracotta },
  { icon: Clock, value: "8 min", label: "Temps de lecture moyen", className: CHIP.mineral },
  { icon: Compass, value: "À venir", label: "Guides", className: CHIP.ochre },
]

const CATEGORIES = [
  "Tous",
  "Création de site",
  "SEO",
  "Webdesign",
  "Marketing",
  "Conseils TPE",
  "Actualités",
]

/* ------------------------------------------------------------------------ */
/* Sous-composants                                                          */
/* ------------------------------------------------------------------------ */

/*
  Une pastille par coin, au même retrait des quatre côtés. Les décalages
  irréguliers d'avant (-24 et -32 à gauche, -24 et -16 à droite, hauteurs
  dépareillées) donnaient l'impression que certaines avaient glissé — la loupe
  en particulier.
*/
const BUBBLES = [
  { icon: Code2, className: CHIP.ink, pos: "-left-7 top-7", from: { x: -50, y: -24, rotate: -10 } },
  { icon: Search, className: CHIP.mineral, pos: "-right-7 top-7", from: { x: 50, y: -24, rotate: 10 } },
  { icon: Palette, className: CHIP.terracotta, pos: "-left-7 bottom-7", from: { x: -50, y: 24, rotate: -8 } },
  { icon: BarChart3, className: CHIP.ochre, pos: "-right-7 bottom-7", from: { x: 50, y: 24, rotate: 8 } },
]

function BlogHeroIllustration() {
  const floatIn = useFloatIn()

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <Card padding="sm" className="relative">
        <div className="flex items-center gap-1.5 border-b border-border pb-3">
          <span className="size-2.5 rounded-full bg-error/40" />
          <span className="size-2.5 rounded-full bg-warning/40" />
          <span className="size-2.5 rounded-full bg-success/40" />
        </div>
        <div className="mt-4 space-y-3">
          <div
            className="h-28 w-full rounded-md"
            style={{ backgroundImage: "var(--gradient-ink)" }}
          />
          <div className="h-2.5 w-3/4 rounded-full bg-border" />
          <div className="h-2.5 w-1/2 rounded-full bg-border" />
        </div>
      </Card>

      {BUBBLES.map((bubble, index) => (
        <motion.div
          key={bubble.pos}
          className={cn("absolute", bubble.pos)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={floatIn(0.3 + index * 0.1, bubble.from, { stiffness: 170, damping: 14, mass: 0.6 })}
        >
          <span className={cn("flex size-12 items-center justify-center rounded-full border border-border bg-surface shadow-sm", bubble.className)}>
            <Icon icon={bubble.icon} className="size-5" />
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function BlogHero() {
  const floatIn = useFloatIn()

  return (
    <PageHero
      eyebrow="Conseils & Ressources"
      icon={BookOpen}
      title="Des conseils concrets pour votre activité"
      lead={
        <>
          Découvrez des{" "}
          <strong className="font-semibold text-text">
            conseils pratiques, des guides et des ressources
          </strong>{" "}
          pour développer votre présence en ligne et faire évoluer votre activité. Des articles
          écrits pour les{" "}
          <strong className="font-semibold text-text">
            TPE, artisans, commerçants et indépendants
          </strong>{" "}
          qui veulent avancer sereinement dans leur projet digital.
        </>
      }
      split
      aside={
        /*
          La maquette est décorative : sur téléphone elle repoussait la liste
          des articles d'un demi-écran sans rien apprendre au lecteur. Elle
          revient dès 640 px, où la place existe.
        */
        <motion.div
          className="hidden sm:block"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={floatIn(0.15, { y: 60 }, { damping: 30, mass: 4 })}
        >
          <BlogHeroIllustration />
        </motion.div>
      }
    />
  )
}

function StatsRow() {
  const floatIn = useFloatIn()

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      {STATS.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(index * 0.1, { y: 40, scale: 0.9 }, { damping: 30, mass: 4 })}
        >
          <Card
            tone="ivory"
            padding="sm"
            className="group flex h-full flex-col transition-colors duration-500 ease-nova hover:border-border-strong"
          >
            <span
              className={cn(
                "mx-auto flex size-9 items-center justify-center rounded-md group-hover:-translate-y-0.5",
                stat.className
              )}
            >
              <Icon icon={stat.icon} className="size-4" />
            </span>
            <p className="mt-5 font-heading text-h3 leading-none text-text">{stat.value}</p>
            <p className="mt-2 text-eyebrow uppercase text-text-muted">{stat.label}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const floatIn = useFloatIn()

  return (
    <motion.div
      className="relative mx-auto w-full max-w-xl"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={floatIn(0.1, { y: 30 })}
    >
      <Icon
        icon={Search}
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted"
      />
      <Input
        type="search"
        placeholder="Rechercher un article..."
        className="h-14 pl-12"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </motion.div>
  )
}

function CategoryFilters({ active, onSelect }: { active: string; onSelect: (category: string) => void }) {
  const floatIn = useFloatIn()

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-3"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={floatIn(0.18, { y: 30 })}
    >
      {CATEGORIES.map((category) => (
        <Button
          key={category}
          type="button"
          variant={active === category ? "primary" : "outline"}
          className="h-11 px-5"
          onClick={() => onSelect(category)}
        >
          {category}
        </Button>
      ))}
    </motion.div>
  )
}

function ArticleCard({ article, index }: { article: Article; index: number }) {
  const floatIn = useFloatIn()
  const column = index % 3
  const from: FloatFrom =
    column === 0 ? { x: -160, rotate: -5 } : column === 2 ? { x: 160, rotate: 5 } : { y: 90 }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={floatIn(index * 0.1, from, { damping: 30, mass: 4 })}
    >
      <Card
        padding="none"
        className="group relative flex h-full flex-col gap-0 overflow-hidden transition-colors duration-500 ease-nova hover:border-border-strong"
      >
        {/*
          Une couverture de magazine : l'image dérive et respire dans son cadre
          au survol, la carte elle-même ne bouge pas — elle n'est pas cliquable.
        */}
        <div className="relative h-48 w-full overflow-hidden border-b border-border">
          <NovaImage
            src={article.image.url}
            alt={article.image.alt}
            sizes="(min-width: 1024px) 400px, 90vw"
            className="scale-[1.02] object-cover transition-transform duration-[900ms] ease-editorial group-hover:-translate-y-1.5 group-hover:scale-[1.06]"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/55 to-transparent"
          />
          <div className="absolute bottom-3 left-4">
            <Badge variant="ink" className="backdrop-blur-sm">
              {article.category}
            </Badge>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <CardIndex value={String(index + 1).padStart(2, "0")} />

          <h3 className="mt-5 font-heading text-h3 text-text transition-colors duration-300 ease-nova group-hover:text-accent-strong">
            {article.title}
          </h3>

          <p className="mt-3 flex-1 text-small text-text-secondary">{article.excerpt}</p>

          <div className="mt-6 flex items-center justify-center gap-5 border-t border-border pt-4 text-eyebrow uppercase text-text-muted">
            <span className="flex items-center gap-1.5">
              <Icon icon={Clock} className="size-3" />
              {article.readingTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon icon={Calendar} className="size-3" />
              {article.date}
            </span>
          </div>

          <Link href={`/blog/${article.slug}`} className="group/cta mt-5 block">
            <Button variant="outline" className="h-11 w-full">
              Lire l&apos;article
              <Icon
                icon={ArrowRight}
                className="transition-transform duration-200 ease-nova group-hover/cta:translate-x-0.5"
              />
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  )
}

function EmptyState({
  title = "Les premiers articles arrivent bientôt.",
  description = "Je prépare actuellement une collection de guides et d'articles pour vous accompagner dans le développement de votre activité.",
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="flex size-20 items-center justify-center rounded-full border border-border bg-surface text-accent">
        <Icon icon={Sparkles} className="size-8" />
      </span>
      <div>
        <Heading variant="h3">{title}</Heading>
        <p className="mt-3 text-body text-text-secondary">{description}</p>
      </div>
      {action}
    </div>
  )
}

function FinalCta() {
  const floatIn = useFloatIn()

  return (
    <Card tone="ink" className="grain-ink relative mx-auto max-w-3xl overflow-hidden text-center">
      <div className="relative flex flex-col items-center">
        <motion.div
          className="flex flex-col items-center"
          initial="hidden"
          animate="visible"
          variants={floatIn(0, { y: -60, scale: 0.94 })}
        >
          <span aria-hidden className="mb-4 flex items-center gap-2 text-accent">
            <span className="h-px w-8 bg-accent/50" />
            <NovaMark className="size-3" />
            <span className="h-px w-8 bg-accent/50" />
          </span>
          <Heading variant="h2" className="text-on-ink">🚀 Un projet en tête ?</Heading>
        </motion.div>

        <motion.p
          className="measure mt-6 text-lead text-on-ink-soft"
          initial="hidden"
          animate="visible"
          variants={floatIn(0.12, { y: 40 })}
        >
          Construisons ensemble{" "}
          <strong className="font-semibold text-on-ink">un site internet moderne, performant et pensé pour développer votre activité</strong>.
        </motion.p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={floatIn(0.22, { x: -160, rotate: -6 })}
          >
            <Link href="/#contact">
              <Button variant="primary" className="bg-paper text-ink hover:bg-accent hover:text-accent-foreground">🚀 Construisons votre projet</Button>
            </Link>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={floatIn(0.3, { x: 160, rotate: 6 })}
          >
            <Link href="/#services">
              <Button variant="outline" className="border-border-ink text-on-ink hover:border-accent hover:text-accent">Découvrir mes services</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------------ */
/* Page                                                                     */
/* ------------------------------------------------------------------------ */

function BlogContent() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Tous")

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return ARTICLES.filter((article) => {
      const matchesCategory = category === "Tous" || article.category === category
      const matchesQuery =
        normalizedQuery === "" ||
        article.title.toLowerCase().includes(normalizedQuery) ||
        article.excerpt.toLowerCase().includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [query, category])

  return (
    <>
      <BlogHero />

      <Section className="bg-surface">
        <div className="flex flex-col gap-10">
          <StatsRow />

          <div className="flex flex-col gap-6">
            <SearchBar value={query} onChange={setQuery} />
            <CategoryFilters active={category} onSelect={setCategory} />
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article, index) => (
                <ArticleCard key={article.slug} article={article} index={index} />
              ))}
            </div>
          ) : ARTICLES.length === 0 ? (
            <EmptyState />
          ) : (
            <EmptyState
              title="Aucun article ne correspond à votre recherche."
              description="Essayez un autre mot-clé ou réinitialisez les filtres pour retrouver tous les articles."
              action={
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-6"
                  onClick={() => {
                    setQuery("")
                    setCategory("Tous")
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              }
            />
          )}
        </div>
      </Section>

      <Section>
        <FinalCta />
      </Section>
    </>
  )
}

export { BlogContent }
