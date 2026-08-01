import type { Metadata } from "next";

import { BlogContent } from "./blog-content";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Conseils pratiques, guides et ressources pour développer votre présence en ligne et faire évoluer votre activité.",
};

export default function BlogPage() {
  return (
    <main className="flex-1">
      <BlogContent />
    </main>
  );
}
