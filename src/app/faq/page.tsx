import type { Metadata } from "next";

import { FAQ } from "@/components/sections";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_FAQ_ITEMS } from "@/lib/faq-data";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const description =
  "Délais, tarifs, WordPress, SEO local : toutes les réponses aux questions des TPE, artisans et commerçants avant de créer leur site internet.";

export const metadata: Metadata = {
  title: "FAQ — Questions fréquentes sur la création de site internet",
  description,
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ — Questions fréquentes sur la création de site internet",
    description,
    url: `${siteConfig.url}/faq`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — Questions fréquentes sur la création de site internet",
    description,
  },
};

export default function FaqPage() {
  return (
    <main className="flex-1">
      <JsonLd
        data={[
          faqPageJsonLd(SITE_FAQ_ITEMS),
          breadcrumbJsonLd([
            { name: "Accueil", url: siteConfig.url },
            { name: "FAQ", url: `${siteConfig.url}/faq` },
          ]),
        ]}
      />
      <FAQ />
    </main>
  );
}
