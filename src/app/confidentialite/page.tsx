import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

import { PrivacyContent } from "./privacy-content";

const description =
  "Politique de confidentialité de Studio Digital Nova : données collectées, finalité du traitement, cookies et droits RGPD.";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description,
  alternates: {
    canonical: "/confidentialite",
  },
  openGraph: {
    title: "Politique de confidentialité",
    description,
    url: `${siteConfig.url}/confidentialite/`,
    type: "website",
    images: [`${siteConfig.url}/opengraph-image`],
  },
};

export default function ConfidentialitePage() {
  return (
    <main id="contenu" className="flex-1">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Accueil", url: `${siteConfig.url}/` },
            { name: "Confidentialité", url: `${siteConfig.url}/confidentialite/` },
          ]),
        ]}
      />
      <PrivacyContent />
    </main>
  );
}
