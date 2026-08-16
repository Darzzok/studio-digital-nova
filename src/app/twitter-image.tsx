import { ImageResponse } from "next/og"

import { siteConfig } from "@/lib/site"

export const dynamic = "force-static"
export const alt = siteConfig.title
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          backgroundColor: "#0b1726",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 120,
            height: 120,
            borderRadius: 10,
            backgroundColor: "#d96c4f",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: 1,
            color: "#fcfbf8",
          }}
        >
          SDN
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: "#fcfbf8",
            textAlign: "center",
          }}
        >
          Studio Digital Nova
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "rgba(252,251,248,0.78)",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Sites internet modernes pour TPE, artisans et commerçants
        </div>
      </div>
    ),
    { ...size }
  )
}
