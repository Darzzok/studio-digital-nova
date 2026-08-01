import type { Metadata } from "next";

import { FAQ } from "@/components/sections";

export const metadata: Metadata = {
  title: "FAQ",
};

export default function FaqPage() {
  return (
    <main className="flex-1">
      <FAQ />
    </main>
  );
}
