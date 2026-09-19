import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

import { AuditContent } from "./audit-content";
import { QUESTIONS_AUDIT } from "./questions";

const title = "Audit gratuit de votre site internet";
const description =
  "Analysez gratuitement la vitesse, le référencement et l'accessibilité de votre site. Résultat immédiat, sans inscription, partout en France.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "audit site internet gratuit",
    "analyse site web gratuite",
    "test vitesse site internet",
    "audit SEO gratuit",
    "diagnostic site internet",
  ],
  alternates: {
    canonical: "/audit-gratuit/",
  },
  openGraph: {
    title,
    description,
    url: `${siteConfig.url}/audit-gratuit/`,
    type: "website",
    images: [`${siteConfig.url}/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

/**
 * `WebApplication` plutôt que `Service` : la page EST l'outil. Le prix nul est
 * déclaré explicitement — c'est ce qui permet à Google d'afficher « gratuit ».
 */
function auditToolJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteConfig.url}/audit-gratuit/#tool`,
    name: "Audit gratuit de site internet",
    url: `${siteConfig.url}/audit-gratuit/`,
    description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Tout navigateur web",
    inLanguage: siteConfig.language,
    provider: { "@id": `${siteConfig.url}/#organization` },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    areaServed: { "@type": "Country", name: "France" },
  };
}

export default function AuditPage() {
  return (
    <main id="contenu" className="flex-1">
      <JsonLd
        data={[
          auditToolJsonLd(),
          /* Les cinq questions affichées sur la page, balisées à l'identique. */
          faqPageJsonLd(
            QUESTIONS_AUDIT.map((q) => ({ question: q.question, answer: q.reponse }))
          ),
          breadcrumbJsonLd([
            { name: "Accueil", url: `${siteConfig.url}/` },
            { name: "Audit gratuit", url: `${siteConfig.url}/audit-gratuit/` },
          ]),
        ]}
      />
      <AuditContent />
    </main>
  );
}
