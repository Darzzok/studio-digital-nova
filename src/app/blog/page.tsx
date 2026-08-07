import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { ARTICLES } from "@/lib/articles";
import { blogJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

import { BlogContent } from "./blog-content";

export const metadata: Metadata = {
  title: "Blog — Conseils et guides pour votre site internet",
  description:
    "Conseils pratiques, guides et ressources pour développer votre présence en ligne et faire évoluer votre activité.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog — Conseils et guides pour votre site internet",
    description:
      "Conseils pratiques, guides et ressources pour développer votre présence en ligne et faire évoluer votre activité.",
    url: `${siteConfig.url}/blog`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Conseils et guides pour votre site internet",
    description:
      "Conseils pratiques, guides et ressources pour développer votre présence en ligne et faire évoluer votre activité.",
  },
};

export default function BlogPage() {
  return (
    <main className="flex-1">
      <JsonLd
        data={[
          blogJsonLd(ARTICLES),
          breadcrumbJsonLd([
            { name: "Accueil", url: siteConfig.url },
            { name: "Blog", url: `${siteConfig.url}/blog` },
          ]),
        ]}
      />
      <BlogContent />
    </main>
  );
}
