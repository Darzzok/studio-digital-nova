import { readFile } from "node:fs/promises"
import path from "node:path"

import { ImageResponse } from "next/og"
import sharp from "sharp"

import { ARTICLES, getArticleBySlug } from "@/lib/articles"
import { BandeauMarque } from "@/lib/og"

/*
  Les couvertures sont désormais hébergées localement, en WebP. Satori ne sait
  ni aller chercher un chemin relatif, ni décoder le WebP : on lit donc le
  fichier et on le convertit en JPEG à la volée, au moment du build.

  Au passage, on divise la définition par deux et on compresse : la carte de
  partage fait 1200×630, inutile d'y encoder une image de 1600 pixels de large.
  Les fichiers générés passaient jusqu'à 1,5 Mo, ce qui décourage les robots
  d'aperçu de LinkedIn et Facebook.
*/
async function couvertureEnJpeg(chemin: string): Promise<string | null> {
  try {
    const brut = await readFile(path.join(process.cwd(), "public", chemin))
    const jpeg = await sharp(brut)
      .resize(1200, 630, { fit: "cover" })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`
  } catch {
    // Couverture illisible : la carte se rabat sur le fond d'encre seul.
    return null
  }
}

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
  const couverture = article ? await couvertureEnJpeg(article.image.url) : null

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0b1726",
          fontFamily: "sans-serif",
        }}
      >
        {couverture && (
          <img
            // Rendu par Satori dans un PNG : l'attribut n'a pas de portée
            // réelle ici, mais il documente l'intention et satisfait la règle.
            alt=""
            src={couverture}
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
            backgroundImage: "linear-gradient(180deg, rgba(11,23,38,0.42) 0%, rgba(11,23,38,0.2) 35%, rgba(11,23,38,0.96) 100%)",
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
            <BandeauMarque />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {article && (
              <div
                style={{
                  display: "flex",
                  fontSize: 26,
                  fontWeight: 600,
                  color: "rgba(252,251,248,0.78)",
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
                color: "#fcfbf8",
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
