import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { ARTICLES, getArticleBySlug } from "@/lib/articles";
import { blogPostingJsonLd, breadcrumbJsonLd, faqPageJsonLd, parseFrenchDateToIso } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

import { ArticleContent } from "./article-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return { title: "Article introuvable" };
  }

  const url = `${siteConfig.url}/blog/${article.slug}`;

  return {
    title: article.title,
    description: article.metaDescription,
    keywords: [article.keywords.primary, ...article.keywords.secondary],
    authors: [{ name: siteConfig.author.name, url: siteConfig.url }],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url,
      type: "article",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      authors: [siteConfig.author.name],
      publishedTime: parseFrenchDateToIso(article.date),
      section: article.category,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.metaDescription,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const url = `${siteConfig.url}/blog/${article.slug}`;

  return (
    <main className="flex-1">
      <JsonLd
        data={[
          blogPostingJsonLd(article),
          breadcrumbJsonLd([
            { name: "Accueil", url: siteConfig.url },
            { name: "Blog", url: `${siteConfig.url}/blog` },
            { name: article.title, url },
          ]),
          ...(article.faq.length > 0 ? [faqPageJsonLd(article.faq)] : []),
        ]}
      />
      <ArticleContent article={article} />
    </main>
  );
}
