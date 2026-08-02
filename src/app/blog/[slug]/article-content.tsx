"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Circle,
  Clock,
  ListTree,
  Quote,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Section } from "@/components/ui/section"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { cn } from "@/lib/utils"
import {
  CATEGORY_GRADIENT,
  CATEGORY_ICON,
  getRelatedArticles,
  type Article,
  type ArticleBlock,
} from "@/lib/articles"

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

const CALLOUT_TONE: Record<string, string> = {
  primary: "border-primary/30 bg-primary/5",
  success: "border-success/30 bg-success/10",
  warning: "border-warning/30 bg-warning/10",
}

/** Suit la lecture : quelle section est active, et à quel pourcentage de l'article se trouve le lecteur. */
function useReadingProgress(headingIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(headingIds[0] ?? null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const offset = 140
      let current = headingIds[0] ?? null
      for (const id of headingIds) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - offset <= 0) {
          current = id
        }
      }
      setActiveId(current)

      const article = document.getElementById("article-body")
      if (article) {
        const rect = article.getBoundingClientRect()
        const total = rect.height - window.innerHeight
        const scrolled = -rect.top
        setProgress(total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0)
      }
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headingIds.join("|")])

  return { activeId, progress }
}

function ArticleHeroIllustration({ article }: { article: Article }) {
  const gradient = CATEGORY_GRADIENT[article.category]
  const icon = CATEGORY_ICON[article.category]

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <Card className="relative overflow-hidden p-0">
        <div
          className="flex h-64 w-full items-center justify-center sm:h-72"
          style={{ backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        >
          <Icon icon={icon} className="size-16 text-primary-foreground/90" />
        </div>
      </Card>
    </div>
  )
}

function TableOfContents({
  toc,
  activeId,
  progress,
}: {
  toc: { id: string; text: string }[]
  activeId: string | null
  progress: number
}) {
  if (toc.length === 0) return null

  return (
    <Card className="p-6">
      <p className="mb-4 flex items-center gap-2 text-small font-semibold text-text">
        <Icon icon={ListTree} className="size-4 text-primary" />
        Sommaire
      </p>

      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-150 ease-nova"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <nav>
        <ul className="flex flex-col gap-1">
          {toc.map((item, index) => {
            const isActive = item.id === activeId
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-small transition-colors duration-150 ease-nova",
                    isActive ? "bg-primary/10 font-semibold text-primary" : "text-text-secondary hover:text-primary"
                  )}
                >
                  <span className={cn("mt-0.5 font-semibold", isActive ? "text-primary" : "text-primary/60")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.text}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </Card>
  )
}

function ArticleBlockRenderer({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p className="text-body leading-relaxed text-text-secondary">{block.text}</p>
    case "heading":
      return (
        <Heading id={block.id} variant="h2" className="scroll-mt-24">
          {block.text}
        </Heading>
      )
    case "subheading":
      return <Heading variant="h3">{block.text}</Heading>
    case "list":
      return (
        <ul className="flex w-full flex-col gap-3 text-left">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-body text-text-secondary">
              <Icon icon={Circle} className="mt-2 size-1.5 shrink-0 fill-current text-primary" />
              {item}
            </li>
          ))}
        </ul>
      )
    case "quote":
      return (
        <Card className="flex flex-col items-center border-l-4 border-l-primary bg-background text-center">
          <Icon icon={Quote} className="size-6 text-primary/40" />
          <p className="mt-3 text-h3 font-heading italic leading-snug text-text">{block.text}</p>
          <p className="mt-3 text-small text-text-secondary">{block.author}</p>
        </Card>
      )
    case "callout":
      return (
        <Card className={cn("flex flex-col items-center text-center", "border", CALLOUT_TONE[block.tone ?? "primary"])}>
          <p className="text-small font-semibold text-text">{block.title}</p>
          <p className="mt-2 text-body text-text-secondary">{block.text}</p>
        </Card>
      )
    case "checklist":
      return (
        <Card className="flex flex-col items-center bg-background text-center">
          <p className="mb-4 text-small font-semibold text-text">{block.title}</p>
          <div className="flex w-full flex-col gap-3 text-left">
            {block.items.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Icon icon={Check} className="size-2.5" />
                </span>
                <p className="text-small text-text-secondary">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      )
    default:
      return null
  }
}

function RelatedArticleCard({ article, index }: { article: Article; index: number }) {
  const reduce = Boolean(useReducedMotion())
  const isMobile = useIsMobile()
  const gradient = CATEGORY_GRADIENT[article.category]
  const icon = CATEGORY_ICON[article.category]

  return (
    <motion.div
      initial={reduce || isMobile ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={floatIn(index * 0.1, { y: 60 }, { damping: 30, mass: 4 })}
    >
      <Link href={`/blog/${article.slug}`}>
        <Card className="group relative flex h-full flex-col gap-0 overflow-hidden p-0">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-primary/0 blur-2xl transition-colors duration-300 ease-nova group-hover:bg-primary/15"
          />
          <div className="relative h-32 w-full overflow-hidden">
            <div
              className="absolute inset-0 transition-transform duration-300 ease-nova group-hover:scale-110"
              style={{ backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon icon={icon} className="size-8 text-primary-foreground/90" />
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center gap-2 p-5 text-center">
            <Badge variant="outline">{article.category}</Badge>
            <p className="text-small font-heading font-semibold text-text">{article.title}</p>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}

function ArticleConversionCta() {
  return (
    <Card className="relative overflow-hidden text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-24 h-56 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative flex flex-col items-center gap-4 py-4">
        <Heading variant="h2">🚀 Construisons votre projet</Heading>
        <p className="max-w-xl text-body text-text-secondary">
          Vous souhaitez un site moderne, performant et adapté à votre activité ? Construisons
          ensemble votre futur site internet.
        </p>
        <Link href="/#contact" className="group">
          <Button variant="primary">
            Construisons votre projet
            <Icon
              icon={ArrowRight}
              className="size-4 transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
            />
          </Button>
        </Link>
      </div>
    </Card>
  )
}

function ArticleContent({ article }: { article: Article }) {
  const reduce = Boolean(useReducedMotion())
  const isMobile = useIsMobile()
  const gradient = CATEGORY_GRADIENT[article.category]
  const toc = article.blocks
    .filter((block): block is Extract<ArticleBlock, { type: "heading" }> => block.type === "heading")
    .map((block) => ({ id: block.id, text: block.text }))
  const related = getRelatedArticles(article)
  const { activeId, progress } = useReadingProgress(toc.map((item) => item.id))

  return (
    <>
      <Section spacing="lg">
        <motion.div
          initial={reduce || isMobile ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -30 })}
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-small font-medium text-text-secondary transition-colors duration-150 ease-nova hover:text-primary"
          >
            <Icon icon={ArrowLeft} className="size-3.5" />
            Retour au blog
          </Link>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-center text-center">
            <motion.div
              className="mb-4"
              initial={reduce || isMobile ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(0, { y: -40, scale: 0.85 })}
            >
              <Badge variant="outline" className="gap-2 py-1.5">
                {article.category}
              </Badge>
            </motion.div>

            <motion.div
              initial={reduce || isMobile ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(0.12, { y: -60, scale: 0.94 })}
            >
              <Heading variant="h1" className="text-balance">
                {article.title}
              </Heading>
            </motion.div>

            <motion.div
              className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-small text-text-secondary"
              initial={reduce || isMobile ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(0.2, { y: 30 })}
            >
              <span className="flex items-center gap-1.5">
                <Icon icon={User} className="size-3.5" />
                {article.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon icon={Calendar} className="size-3.5" />
                {article.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon icon={Clock} className="size-3.5" />
                {article.readingTime} de lecture
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={reduce || isMobile ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={floatIn(0.15, { x: 100, rotate: 3 }, { damping: 30, mass: 4 })}
          >
            <ArticleHeroIllustration article={article} />
          </motion.div>
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article id="article-body" className="flex flex-col gap-6 text-center">
            {article.intro.map((paragraph, index) => (
              <motion.p
                key={index}
                className="text-h3 font-heading font-medium leading-snug text-text"
                initial={reduce || isMobile ? false : "hidden"}
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={floatIn(index * 0.08, { y: 30 })}
              >
                {paragraph}
              </motion.p>
            ))}

            {article.blocks.map((block, index) => (
              <motion.div
                key={index}
                initial={reduce || isMobile ? false : "hidden"}
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                variants={floatIn(0, { y: 30 })}
              >
                <ArticleBlockRenderer block={block} />
              </motion.div>
            ))}

            <div className="mt-6">
              <ArticleConversionCta />
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-28 flex flex-col gap-6">
              <TableOfContents toc={toc} activeId={activeId} progress={progress} />
              <Card
                className="relative overflow-hidden p-6 text-center"
                style={{ backgroundImage: `linear-gradient(160deg, ${gradient.from}1a, transparent)` }}
              >
                <p className="text-small font-semibold text-text">Un projet en tête ?</p>
                <p className="mt-2 text-small text-text-secondary">
                  Discutons de votre projet de site internet, sans engagement.
                </p>
                <Link href="/#contact" className="mt-4 block">
                  <Button variant="primary" className="h-11 w-full text-small">
                    Construisons votre projet
                  </Button>
                </Link>
              </Card>
            </div>
          </aside>
        </div>
      </Section>

      {related.length > 0 && (
        <Section spacing="sm">
          <motion.div
            initial={reduce || isMobile ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0, { y: -30 })}
          >
            <Heading variant="h2" className="text-center">
              À lire aussi
            </Heading>
          </motion.div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {related.map((relatedArticle, index) => (
              <RelatedArticleCard key={relatedArticle.slug} article={relatedArticle} index={index} />
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

export { ArticleContent }
