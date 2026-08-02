export const siteConfig = {
  name: "Studio Digital Nova",
  description:
    "Sites internet modernes et rapides pour TPE, artisans et commerçants. Devis gratuit, tarifs clairs dès 690 €, livraison en quelques jours.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://studio-digital-nova.com",
} as const;

export const siteRoutes = ["/", "/blog", "/faq", "/mentions-legales", "/confidentialite"] as const;
