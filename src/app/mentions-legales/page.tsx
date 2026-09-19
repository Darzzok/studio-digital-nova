import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

import { LegalContent } from "./legal-content";

const description =
  "Mentions légales de Studio Digital Nova : éditeur du site, hébergement, propriété intellectuelle et informations légales.";

export const metadata: Metadata = {
  title: "Mentions légales",
  description,
  alternates: {
    canonical: "/mentions-legales",
  },
  openGraph: {
    title: "Mentions légales",
    description,
    url: `${siteConfig.url}/mentions-legales/`,
    type: "website",
    images: [`${siteConfig.url}/opengraph-image`],
  },
};

export default function MentionsLegalesPage() {
  return (
    <main id="contenu" className="flex-1">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Accueil", url: `${siteConfig.url}/` },
            { name: "Mentions légales", url: `${siteConfig.url}/mentions-legales/` },
          ]),
        ]}
      />
      <LegalContent />
    </main>
  );
}
