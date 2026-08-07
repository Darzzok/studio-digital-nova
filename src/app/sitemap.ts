import type { MetadataRoute } from "next";

import { ARTICLES } from "@/lib/articles";
import { parseFrenchDateToIso } from "@/lib/seo";
import { siteConfig, siteRoutes } from "@/lib/site";

export const dynamic = "force-static";

const STATIC_ROUTE_META: Record<(typeof siteRoutes)[number], { priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }> = {
  "/": { priority: 1, changeFrequency: "weekly" },
  "/blog": { priority: 0.9, changeFrequency: "weekly" },
  "/faq": { priority: 0.7, changeFrequency: "monthly" },
  "/mentions-legales": { priority: 0.2, changeFrequency: "yearly" },
  "/confidentialite": { priority: 0.2, changeFrequency: "yearly" },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = siteRoutes.map((route) => ({
    url: `${siteConfig.url}${route === "/" ? "" : route}`,
    lastModified: new Date(),
    ...STATIC_ROUTE_META[route],
  }));

  const articleRoutes = ARTICLES.map((article) => ({
    url: `${siteConfig.url}/blog/${article.slug}`,
    lastModified: new Date(parseFrenchDateToIso(article.date)),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
