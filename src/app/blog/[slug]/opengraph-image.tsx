import { ImageResponse } from "next/og"

import { ARTICLES, getArticleBySlug, type ArticleCategory } from "@/lib/articles"

export const dynamic = "force-static"
export const alt = "Illustration de l'article"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }))
}

/** Équivalent hex des tokens CSS de CATEGORY_GRADIENT (lib/articles.ts) — Satori ne résout pas les var(--...). */
const CATEGORY_GRADIENT_HEX: Record<ArticleCategory, { from: string; to: string }> = {
  "Création de site": { from: "#1f4e79", to: "#a8783f" },
  SEO: { from: "#a8783f", to: "#2f6f6b" },
  Webdesign: { from: "#1f4e79", to: "#2f6f6b" },
  Marketing: { from: "#2f6f6b", to: "#1f4e79" },
  "Conseils TPE": { from: "#a8783f", to: "#1f4e79" },
}

type Props = { params: Promise<{ slug: string }> }

export default async function Image({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  const gradient = article ? CATEGORY_GRADIENT_HEX[article.category] : { from: "#1f4e79", to: "#a8783f" }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#eef1f5",
          backgroundImage: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.16)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            N
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#ffffff" }}>
            Studio Digital Nova
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {article && (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {article.category}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#ffffff",
              maxWidth: 1000,
            }}
          >
            {article?.title ?? "Blog Studio Digital Nova"}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
