import type { Metadata } from "next";

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
    url: `${siteConfig.url}/confidentialite`,
    type: "website",
  },
};

export default function ConfidentialitePage() {
  return (
    <main className="flex-1">
      <PrivacyContent />
    </main>
  );
}
