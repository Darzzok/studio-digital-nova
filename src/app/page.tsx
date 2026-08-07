import type { Metadata } from "next";

import {
  Hero,
  Services,
  APropos,
  Processus,
  CasClients,
  Tarifs,
  Contact,
} from "@/components/sections";
import { JsonLd } from "@/components/seo/json-ld";
import { professionalServiceJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export default function Home() {
  return (
    <main className="flex-1">
      <JsonLd data={professionalServiceJsonLd()} />
      <Hero />
      <Services />
      <APropos />
      <Processus />
      <Tarifs />
      <CasClients />
      <Contact />
    </main>
  );
}
