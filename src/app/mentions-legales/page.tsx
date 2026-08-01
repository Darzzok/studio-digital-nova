import type { Metadata } from "next";

import { LegalContent } from "./legal-content";

export const metadata: Metadata = {
  title: "Mentions légales",
};

export default function MentionsLegalesPage() {
  return (
    <main className="flex-1">
      <LegalContent />
    </main>
  );
}
