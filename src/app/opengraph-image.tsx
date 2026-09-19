import { ImageResponse } from "next/og"

import { CartePartage, TAILLE_CARTE } from "@/lib/og"
import { siteConfig } from "@/lib/site"

export const dynamic = "force-static"
export const alt = siteConfig.title
export const size = TAILLE_CARTE
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    <CartePartage accroche="Sites internet modernes pour TPE, artisans et commerçants" />,
    { ...size }
  )
}
