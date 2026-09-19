import type { MetadataRoute } from "next";

import { ARTICLES } from "@/lib/articles";
import { OFFRE_PAGES } from "@/lib/offres";
import { parseFrenchDateToIso } from "@/lib/seo";
import { siteConfig, siteRoutes } from "@/lib/site";

export const dynamic = "force-static";

const STATIC_ROUTE_META: Record<(typeof siteRoutes)[number], { priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }> = {
  "/": { priority: 1, changeFrequency: "weekly" },
  "/audit-gratuit": { priority: 0.9, changeFrequency: "monthly" },
  "/blog": { priority: 0.9, changeFrequency: "weekly" },
  "/faq": { priority: 0.7, changeFrequency: "monthly" },
  "/mentions-legales": { priority: 0.2, changeFrequency: "yearly" },
  "/confidentialite": { priority: 0.2, changeFrequency: "yearly" },
};

export default function sitemap(): MetadataRoute.Sitemap {
  // Slash final : le site est exporté avec `trailingSlash`, les URLs
  // canoniques en portent un. Le sitemap doit annoncer les mêmes.
  /*
    Date de dernière modification du contenu, et non du build : sinon chaque
    déploiement déclare toutes les pages modifiées, et Google finit par
    ignorer le signal. On prend la date de l'article le plus récent comme
    référence pour les pages qui évoluent avec le blog.
  */
  const derniereDate = ARTICLES.map((a) => parseFrenchDateToIso(a.date)).sort().at(-1)
  const contentDate = derniereDate ? new Date(derniereDate) : new Date()

  const staticRoutes = siteRoutes.map((route) => ({
    url: `${siteConfig.url}${route === "/" ? "/" : `${route}/`}`,
    lastModified: contentDate,
    ...STATIC_ROUTE_META[route],
  }));

  /* Pages de prestation et de métier — priorité haute : ce sont les pages
     commerciales sur lesquelles le site doit se positionner. */
  const offreRoutes = OFFRE_PAGES.map((page) => ({
    url: `${siteConfig.url}/${page.slug}/`,
    lastModified: contentDate,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }))

  const articleRoutes = ARTICLES.map((article) => ({
    url: `${siteConfig.url}/blog/${article.slug}/`,
    lastModified: new Date(parseFrenchDateToIso(article.date)),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...offreRoutes, ...articleRoutes];
}
