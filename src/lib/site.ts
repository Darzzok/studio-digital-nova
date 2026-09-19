export const siteConfig = {
  name: "Studio Digital Nova",
  shortName: "Studio Digital Nova",
  // 57 caractères : tient entier dans les résultats Google (limite ~60).
  title: "Studio Digital Nova — Sites internet pour TPE et artisans",
  description:
    "Sites internet modernes et rapides pour TPE, artisans et commerçants. Devis gratuit, tarifs clairs dès 690 €, livraison en quelques jours.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiodigitalnova.fr",
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
  /** Alimente `sameAs` dans les données structurées : relie l'entité à ses profils. */
  social: {
    linkedin: "https://www.linkedin.com/in/geoffrey-marechal-677417428",
    facebook: "https://www.facebook.com/profile.php?id=61592909174137",
  } as Record<string, string>,
} as const;

export const siteRoutes = ["/", "/audit-gratuit", "/blog", "/faq", "/mentions-legales", "/confidentialite"] as const;
