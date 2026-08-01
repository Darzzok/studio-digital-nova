import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ARTICLES, getArticleBySlug } from "@/lib/articles";
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
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url,
      type: "article",
      siteName: siteConfig.name,
      locale: "fr_FR",
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="flex-1">
      <ArticleContent article={article} />
    </main>
  );
}
