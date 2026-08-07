import type { Metadata } from "next";

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
    url: `${siteConfig.url}/mentions-legales`,
    type: "website",
  },
};

export default function MentionsLegalesPage() {
  return (
    <main className="flex-1">
      <LegalContent />
    </main>
  );
}
