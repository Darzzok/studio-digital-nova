import type { MetadataRoute } from "next";

import { ARTICLES } from "@/lib/articles";
import { siteConfig, siteRoutes } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = siteRoutes.map((route) => ({
    url: `${siteConfig.url}${route === "/" ? "" : route}`,
    lastModified: new Date(),
  }));

  const articleRoutes = ARTICLES.map((article) => ({
    url: `${siteConfig.url}/blog/${article.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...articleRoutes];
}
