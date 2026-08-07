import { ImageResponse } from "next/og"

import { ARTICLES, getArticleBySlug } from "@/lib/articles"

export const dynamic = "force-static"
export const alt = "Illustration de l'article"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export default async function Image({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        {article && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image.url}
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: "linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.15) 35%, rgba(10,10,10,0.94) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 72,
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
                backgroundColor: "#0a0a0a",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 0.5,
                color: "#ffffff",
              }}
            >
              SDN
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 600,
                color: "#ffffff",
                textShadow: "0 2px 14px rgba(0,0,0,0.7)",
              }}
            >
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
                  textShadow: "0 2px 12px rgba(0,0,0,0.7)",
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
                textShadow: "0 2px 16px rgba(0,0,0,0.7)",
              }}
            >
              {article?.title ?? "Blog Studio Digital Nova"}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
