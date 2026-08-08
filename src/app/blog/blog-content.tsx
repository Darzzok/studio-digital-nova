"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
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
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import { ARTICLES, type Article } from "@/lib/articles"
import { useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }

/* ------------------------------------------------------------------------ */
/* Contenu — à remplacer par de vrais articles quand ils seront prêts.       */
/* ------------------------------------------------------------------------ */

const STATS = [
  { icon: FileText, value: String(ARTICLES.length), label: "Articles", className: "bg-primary/10 text-primary" },
  { icon: Layers, value: "6", label: "Catégories", className: "bg-accent-purple/15 text-accent-purple" },
  { icon: Clock, value: "8 min", label: "Temps de lecture moyen", className: "bg-accent-green/15 text-accent-green" },
  { icon: Compass, value: "À venir", label: "Guides", className: "bg-warning/15 text-warning" },
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

const BUBBLES = [
  { icon: Code2, className: "bg-primary/15 text-primary", pos: "-left-6 top-4", from: { x: -60, y: -30, rotate: -10 } },
  { icon: Search, className: "bg-accent-green/15 text-accent-green", pos: "-right-6 top-16", from: { x: 60, y: -20, rotate: 10 } },
  { icon: Palette, className: "bg-accent-purple/15 text-accent-purple", pos: "-left-8 bottom-14", from: { x: -60, y: 30, rotate: -8 } },
  { icon: BarChart3, className: "bg-warning/15 text-warning", pos: "-right-4 -bottom-2", from: { x: 60, y: 30, rotate: 8 } },
]

function BlogHeroIllustration() {
  const floatIn = useFloatIn()

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <Card className="relative p-4">
        <div className="flex items-center gap-1.5 border-b border-border pb-3">
          <span className="size-2.5 rounded-full bg-error/40" />
          <span className="size-2.5 rounded-full bg-warning/40" />
          <span className="size-2.5 rounded-full bg-success/40" />
        </div>
        <div className="mt-4 space-y-3">
          <div
            className="h-28 w-full rounded-xl"
            style={{ backgroundImage: "linear-gradient(135deg, var(--color-primary), var(--color-accent-purple))" }}
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
          <span className={cn("flex size-12 items-center justify-center rounded-full shadow-sm", bubble.className)}>
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
    <Section spacing="lg">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-center text-center">
          <motion.div
            className="mb-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0, { y: -40, scale: 0.85 })}
          >
            <Badge variant="outline" className="gap-2 py-1.5">
              <Icon icon={BookOpen} className="size-3.5" />
              Conseils &amp; Ressources
            </Badge>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.12, { y: -60, scale: 0.94 })}
          >
            <Heading variant="h1">Des conseils concrets pour votre activité</Heading>
          </motion.div>

          <motion.p
            className="mt-6 max-w-xl text-body text-text-secondary"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.22, { y: 40 })}
          >
            Découvrez des{" "}
            <strong className="font-semibold text-text">conseils pratiques, des guides et des ressources</strong>{" "}
            pour développer votre présence en ligne et faire évoluer votre activité. Des articles
            écrits pour les{" "}
            <strong className="font-semibold text-text">TPE, artisans, commerçants et indépendants</strong>{" "}
            qui veulent avancer sereinement dans leur projet digital.
          </motion.p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={floatIn(0.15, { x: 100, rotate: 3 }, { damping: 30, mass: 4 })}
        >
          <BlogHeroIllustration />
        </motion.div>
      </div>
    </Section>
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
          <Card className="group flex flex-col items-center gap-2 p-6 text-center">
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 ease-nova group-hover:-rotate-6 group-hover:scale-110",
                stat.className
              )}
            >
              <Icon icon={stat.icon} className="size-5" />
            </span>
            <p className="text-h3 font-heading font-bold text-text">{stat.value}</p>
            <p className="text-small text-text-secondary">{stat.label}</p>
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
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-secondary"
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
          className="h-10 px-5 text-small"
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
      <Card className="group relative flex h-full flex-col gap-0 overflow-hidden p-0">
        <div className="relative h-40 w-full overflow-hidden">
          <Image
            src={article.image.url}
            alt={article.image.alt}
            fill
            sizes="(min-width: 1024px) 400px, 90vw"
            className="object-cover transition-transform duration-300 ease-nova group-hover:scale-110"
          />
        </div>

        <div className="flex flex-1 flex-col items-center gap-3 p-6 text-center">
          <Badge variant="outline">{article.category}</Badge>
          <h3 className="text-h3 font-heading font-semibold text-text">{article.title}</h3>
          <p className="flex-1 text-small text-text-secondary">{article.excerpt}</p>
          <div className="flex items-center justify-center gap-4 text-small text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Icon icon={Clock} className="size-3.5" />
              {article.readingTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon icon={Calendar} className="size-3.5" />
              {article.date}
            </span>
          </div>
          <Link href={`/blog/${article.slug}`} className="group mt-2 block">
            <Button variant="outline" className="h-11 w-full text-small">
              Lire l&apos;article
              <Icon
                icon={ArrowRight}
                className="size-4 transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
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
      <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
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
    <Card className="relative mx-auto max-w-3xl overflow-hidden text-center">
      <div className="relative flex flex-col items-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={floatIn(0, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h2">🚀 Un projet en tête ?</Heading>
        </motion.div>

        <motion.p
          className="mt-6 max-w-xl text-body text-text-secondary"
          initial="hidden"
          animate="visible"
          variants={floatIn(0.12, { y: 40 })}
        >
          Construisons ensemble{" "}
          <strong className="font-semibold text-text">un site internet moderne, performant et pensé pour développer votre activité</strong>.
        </motion.p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={floatIn(0.22, { x: -160, rotate: -6 })}
          >
            <Link href="/#contact">
              <Button variant="primary">🚀 Construisons votre projet</Button>
            </Link>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={floatIn(0.3, { x: 160, rotate: 6 })}
          >
            <Link href="/#services">
              <Button variant="outline">Découvrir mes services</Button>
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="h-11 px-6 text-small"
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
