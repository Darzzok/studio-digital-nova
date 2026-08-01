import type { Metadata } from "next";

import { PrivacyContent } from "./privacy-content";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

export default function ConfidentialitePage() {
  return (
    <main className="flex-1">
      <PrivacyContent />
    </main>
  );
}
