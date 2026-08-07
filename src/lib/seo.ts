import type { Article } from "@/lib/articles"
import { siteConfig } from "@/lib/site"

/* ------------------------------------------------------------------------ */
/* Dates — les articles stockent une date lisible ("3 août 2026"). Les       */
/* données structurées ont besoin d'un ISO 8601 : on la reconvertit ici      */
/* plutôt que de dupliquer la donnée dans deux formats.                     */
/* ------------------------------------------------------------------------ */

const FRENCH_MONTHS: Record<string, string> = {
  janvier: "01",
  février: "02",
  fevrier: "02",
  mars: "03",
  avril: "04",
  mai: "05",
  juin: "06",
  juillet: "07",
  août: "08",
  aout: "08",
  septembre: "09",
  octobre: "10",
  novembre: "11",
  décembre: "12",
  decembre: "12",
}

/** Convertit "3 août 2026" en "2026-08-03". Retourne la date du jour si le format est inattendu. */
function parseFrenchDateToIso(frenchDate: string): string {
  const match = frenchDate.trim().match(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i)
  if (!match) return new Date().toISOString().slice(0, 10)

  const [, day, monthName, year] = match
  const month = FRENCH_MONTHS[monthName.toLowerCase()]
  if (!month) return new Date().toISOString().slice(0, 10)

  return `${year}-${month}-${day.padStart(2, "0")}`
}

/* ------------------------------------------------------------------------ */
/* JSON-LD builders — chacun retourne un objet sérialisable, injecté via     */
/* <script type="application/ld+json"> dans la page correspondante.         */
/* ------------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonLd = Record<string, any>

function organizationJsonLd(): JsonLd {
  const sameAs = Object.values(siteConfig.social)

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/favicon.ico`,
    description: siteConfig.description,
    email: siteConfig.author.email,
    founder: {
      "@type": "Person",
      name: siteConfig.author.name,
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    publisher: { "@id": `${siteConfig.url}/#organization` },
  }
}

/** Service professionnel — évite "LocalBusiness" tant qu'aucune adresse physique vérifiée n'est publiée. */
function professionalServiceJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteConfig.url}/#service`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    email: siteConfig.author.email,
    priceRange: "690€ - 1200€+",
    areaServed: {
      "@type": "Country",
      name: "France",
    },
  }
}

type BreadcrumbItem = { name: string; url: string }

function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

type PlainFaqItem = { question: string; answer: string }

function faqPageJsonLd(items: PlainFaqItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}

function blogJsonLd(articles: Pick<Article, "slug" | "title" | "date">[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${siteConfig.url}/blog/#blog`,
    url: `${siteConfig.url}/blog`,
    name: `Blog ${siteConfig.name}`,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    blogPost: articles.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      url: `${siteConfig.url}/blog/${article.slug}`,
      datePublished: parseFrenchDateToIso(article.date),
    })),
  }
}

function blogPostingJsonLd(article: Article): JsonLd {
  const url = `${siteConfig.url}/blog/${article.slug}`
  const isoDate = parseFrenchDateToIso(article.date)

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}/#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: article.title,
    description: article.metaDescription,
    image: `${url}/opengraph-image`,
    datePublished: isoDate,
    dateModified: isoDate,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
    },
    publisher: { "@id": `${siteConfig.url}/#organization` },
    articleSection: article.category,
    keywords: [article.keywords.primary, ...article.keywords.secondary].join(", "),
    url,
    inLanguage: siteConfig.language,
  }
}

export {
  parseFrenchDateToIso,
  organizationJsonLd,
  websiteJsonLd,
  professionalServiceJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  blogJsonLd,
  blogPostingJsonLd,
}
export type { BreadcrumbItem, PlainFaqItem, JsonLd }
