import type { Metadata } from "next";

import { FAQ } from "@/components/sections";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Délais, tarifs, WordPress, SEO local : toutes les réponses aux questions des TPE, artisans et commerçants avant de créer leur site internet.",
};

export default function FaqPage() {
  return (
    <main className="flex-1">
      <FAQ />
    </main>
  );
}
