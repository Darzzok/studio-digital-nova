export const siteConfig = {
  name: "Studio Digital Nova",
  description: "Studio Digital Nova",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://studio-digital-nova.com",
} as const;

export const siteRoutes = ["/", "/blog", "/faq", "/mentions-legales", "/confidentialite"] as const;
