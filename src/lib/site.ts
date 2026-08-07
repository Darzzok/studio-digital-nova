export const siteConfig = {
  name: "Studio Digital Nova",
  shortName: "Studio Digital Nova",
  title: "Studio Digital Nova — Création de sites internet pour TPE et artisans",
  description:
    "Sites internet modernes et rapides pour TPE, artisans et commerçants. Devis gratuit, tarifs clairs dès 690 €, livraison en quelques jours.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://studio-digital-nova.com",
  locale: "fr_FR",
  language: "fr",
  author: {
    name: "Geoffrey",
    email: "contact@studiodigitalnova.fr",
  },
  keywords: [
    "création de site internet",
    "site vitrine TPE",
    "site internet artisan",
    "développeur web freelance",
    "site internet pas cher",
    "référencement local SEO",
  ],
  /** Vide tant qu'aucun profil social n'est en ligne — à compléter dès leur création. */
  social: {} as Record<string, string>,
} as const;

export const siteRoutes = ["/", "/blog", "/faq", "/mentions-legales", "/confidentialite"] as const;
