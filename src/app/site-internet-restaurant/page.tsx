import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { OffreLiens, OffrePageView } from "@/components/sections/offre-page";
import { OFFRE_PAGES, getOffreBySlug } from "@/lib/offres";
import { breadcrumbJsonLd, faqPageJsonLd, offreJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const SLUG = "site-internet-restaurant";
const page = getOffreBySlug(SLUG)!;

export const metadata: Metadata = {
  title: { absolute: page.seoTitle },
  description: page.description,
  keywords: [...page.keywords],
  alternates: { canonical: `/${SLUG}/` },
  openGraph: {
    title: page.seoTitle,
    description: page.description,
    url: `${siteConfig.url}/${SLUG}/`,
    type: "website",
    images: [`${siteConfig.url}/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: page.seoTitle,
    description: page.description,
  },
};

export default function Page() {
  return (
    <main id="contenu" className="flex-1">
      <JsonLd
        data={[
          offreJsonLd(page),
          /* Les questions de la page sont réelles et visibles : elles méritent
             leur balisage, c'est ce qui déclenche les résultats enrichis. */
          ...(page.faq.length > 0 ? [faqPageJsonLd(page.faq)] : []),
          breadcrumbJsonLd([
            { name: "Accueil", url: `${siteConfig.url}/` },
            { name: page.title, url: `${siteConfig.url}/${SLUG}/` },
          ]),
        ]}
      />
      <OffrePageView page={page} />
      <OffreLiens courant={SLUG} pages={OFFRE_PAGES} />
    </main>
  );
}
