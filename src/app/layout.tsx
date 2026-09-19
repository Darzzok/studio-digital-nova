import type { Metadata } from "next";
import { DM_Serif_Display, Manrope } from "next/font/google";
import "@/styles/globals.css";

import { BarreMobile } from "@/components/layout/barre-mobile";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/sections/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, personJsonLd, websiteJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

/** Manrope porte tout le corps de texte : humaniste, chaleureux, très lisible. */
const sans = Manrope({
  variable: "--font-sans-body",
  subsets: ["latin"],
  display: "swap",
});

/** DM Serif Display porte les titres — une seule graisse (400), par nature. */
const serif = DM_Serif_Display({
  variable: "--font-serif-heading",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author.name, url: siteConfig.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${sans.variable} ${serif.variable} h-full scroll-smooth antialiased`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={[organizationJsonLd(), personJsonLd(), websiteJsonLd()]} />
        {/*
          Lien d'évitement : au clavier, il évite de retraverser tout le menu
          à chaque page. Invisible tant qu'il n'a pas le focus.
        */}
        <a
          href="#contenu"
          className="sr-only rounded-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-3 focus:text-small focus:text-paper focus:outline-none focus:ring-3 focus:ring-ring/40"
        >
          Aller au contenu
        </a>
        <Header />
        {children}
        <Footer />
        <BarreMobile />
      </body>
    </html>
  );
}
