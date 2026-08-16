"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion"
import type { MotionValue } from "framer-motion"
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
import { CardIndex, NovaMark } from "@/components/ui/nova"
import { Section } from "@/components/ui/section"
import { useFloatIn } from "@/lib/motion"
import { cn } from "@/lib/utils"
import {
  CATEGORY_GRADIENT,
  getRelatedArticles,
  type Article,
  type ArticleBlock,
} from "@/lib/articles"

const CALLOUT_TONE: Record<string, string> = {
  primary: "border-l-mineral bg-mineral/6",
  success: "border-l-success bg-success/8",
  warning: "border-l-warning bg-warning/8",
}

/**
 * Suit la lecture : quelle section est active, et où en est le lecteur.
 * La progression est une MotionValue lissée par un spring — plus de
 * `setState` à chaque frame ni de transition CSS sur la largeur.
 */
function useReadingProgress(
  articleRef: React.RefObject<HTMLElement | null>,
  headingIds: string[]
) {
  const [activeId, setActiveId] = useState<string | null>(headingIds[0] ?? null)

  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ["start start", "end end"],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", () => {
    const offset = 140
    let current = headingIds[0] ?? null
    for (const id of headingIds) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top - offset <= 0) {
        current = id
      }
    }
    setActiveId((previous) => (previous === current ? previous : current))
  })

  return { activeId, progress }
}

function ArticleHeroIllustration({ article }: { article: Article }) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <Card padding="none" className="relative overflow-hidden">
        <div className="relative h-64 w-full sm:h-72">
          <Image
            src={article.image.url}
            alt={article.image.alt}
            fill
            sizes="(min-width: 1024px) 480px, 90vw"
            priority
            className="object-cover"
          />
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
  progress: MotionValue<number>
}) {
  if (toc.length === 0) return null

  return (
    <Card padding="sm">
      <p className="mb-4 flex items-center gap-2 text-eyebrow uppercase text-text-muted">
        <Icon icon={ListTree} className="size-3.5 text-accent" />
        Sommaire
      </p>

      <div className="mb-5 h-px w-full overflow-hidden bg-border">
        <motion.div
          className="h-full origin-left bg-accent"
          style={{ scaleX: progress }}
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
                    isActive ? "bg-accent/8 font-medium text-accent-strong" : "text-text-secondary hover:text-accent-strong"
                  )}
                >
                  <span className={cn("mt-0.5 font-heading", isActive ? "text-accent-strong" : "text-text-muted")}>
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
      return <p className="measure mx-auto text-body text-text-secondary">{block.text}</p>
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
        <ul className="measure mx-auto flex w-full flex-col gap-3 text-left">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-body text-text-secondary">
              <Icon icon={Circle} className="mt-2.5 size-1.5 shrink-0 fill-current text-accent" />
              {item}
            </li>
          ))}
        </ul>
      )
    case "quote":
      return (
        <Card tone="outline" className="flex flex-col items-center border-x-0 border-y-0 border-l border-l-accent bg-transparent text-center">
          <Icon icon={Quote} className="size-5 text-accent" />
          <p className="mt-4 font-heading text-h3 italic text-text">{block.text}</p>
          <p className="mt-4 text-eyebrow uppercase text-text-muted">{block.author}</p>
        </Card>
      )
    case "callout":
      return (
        <Card padding="md" className={cn("flex flex-col items-center border-l text-center", CALLOUT_TONE[block.tone ?? "primary"])}>
          <p className="text-eyebrow uppercase text-text">{block.title}</p>
          <p className="mt-2 text-body text-text-secondary">{block.text}</p>
        </Card>
      )
    case "checklist":
      return (
        <Card tone="ivory" padding="md" className="flex flex-col items-center text-center">
          <p className="mb-5 text-eyebrow uppercase text-text">{block.title}</p>
          <div className="flex w-full flex-col gap-3 text-left">
            {block.items.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-strong">
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
  const floatIn = useFloatIn()

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={floatIn(index * 0.1, { y: 60 }, { damping: 30, mass: 4 })}
    >
      <Link href={`/blog/${article.slug}`}>
        <Card padding="none" interactive className="group relative flex h-full flex-col gap-0 overflow-hidden">
          <div className="relative h-36 w-full overflow-hidden border-b border-border">
            <Image
              src={article.image.url}
              alt={article.image.alt}
              fill
              sizes="(min-width: 1024px) 320px, 90vw"
              className="scale-[1.02] object-cover transition-transform duration-[900ms] ease-editorial group-hover:-translate-y-1.5 group-hover:scale-[1.06]"
            />
          </div>
          <div className="flex flex-1 flex-col p-5 text-left">
            <CardIndex value={String(index + 1).padStart(2, "0")} />
            <Badge variant="outline" className="mt-4">{article.category}</Badge>
            <h3 className="mt-3 font-heading text-body text-text transition-colors duration-300 ease-nova group-hover:text-accent-strong">{article.title}</h3>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}

function ArticleConversionCta() {
  return (
    <Card tone="ink" className="grain-ink relative overflow-hidden text-center">
      <div className="relative flex flex-col items-center gap-4 py-4">
        <span aria-hidden className="mb-2 flex items-center gap-2 text-accent">
          <span className="h-px w-8 bg-accent/50" />
          <NovaMark className="size-3" />
          <span className="h-px w-8 bg-accent/50" />
        </span>
        <Heading variant="h2" className="text-on-ink">🚀 Construisons votre projet</Heading>
        <p className="max-w-xl text-body text-on-ink-soft">
          Vous souhaitez un site moderne, performant et adapté à votre activité ? Construisons
          ensemble votre futur site internet.
        </p>
        <Link href="/#contact" className="group">
          <Button variant="primary" className="bg-paper text-ink hover:bg-accent hover:text-accent-foreground">
            Construisons votre projet
            <Icon
              icon={ArrowRight}
              className="transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
            />
          </Button>
        </Link>
      </div>
    </Card>
  )
}

function ArticleContent({ article }: { article: Article }) {
  const floatIn = useFloatIn()
  const gradient = CATEGORY_GRADIENT[article.category]
  const toc = article.blocks
    .filter((block): block is Extract<ArticleBlock, { type: "heading" }> => block.type === "heading")
    .map((block) => ({ id: block.id, text: block.text }))
  const related = getRelatedArticles(article)
  const articleRef = useRef<HTMLElement | null>(null)
  const { activeId, progress } = useReadingProgress(articleRef, toc.map((item) => item.id))

  return (
    <>
      <Section spacing="lg">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -30 })}
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-eyebrow uppercase text-text-muted transition-colors duration-200 ease-nova hover:text-accent-strong"
          >
            <Icon icon={ArrowLeft} className="size-3.5" />
            Retour au blog
          </Link>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-center text-center">
            <motion.div
              className="mb-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(0, { y: -40, scale: 0.85 })}
            >
              <Badge variant="outline" className="gap-2 py-1.5">
                {article.category}
              </Badge>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(0.12, { y: -60, scale: 0.94 })}
            >
              <Heading variant="h1" className="text-balance">
                {article.title}
              </Heading>
            </motion.div>

            <motion.div
              className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-small text-text-muted"
              initial="hidden"
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
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={floatIn(0.15, { x: 100, rotate: 3 }, { damping: 30, mass: 4 })}
          >
            <ArticleHeroIllustration article={article} />
          </motion.div>
        </div>
      </Section>

      <Section className="bg-surface">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article ref={articleRef} id="article-body" className="flex flex-col gap-6 text-center">
            {article.intro.map((paragraph, index) => (
              <motion.p
                key={index}
                className="measure mx-auto font-heading text-h3 text-text"
                initial="hidden"
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
                initial="hidden"
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
                padding="sm"
                className="relative overflow-hidden border-l border-l-accent text-center"
                style={{ backgroundImage: `linear-gradient(160deg, ${gradient.from}14, transparent 60%)` }}
              >
                <p className="text-eyebrow uppercase text-text">Un projet en tête ?</p>
                <p className="mt-2 text-small text-text-secondary">
                  Discutons de votre projet de site internet, sans engagement.
                </p>
                <Link href="/#contact" className="mt-4 block">
                  <Button variant="primary" className="h-11 w-full">
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
            initial="hidden"
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
