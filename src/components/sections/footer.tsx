"use client"

import { forwardRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Mail } from "lucide-react"
import type { LucideProps } from "lucide-react"
import { motion } from "framer-motion"

import { Container } from "@/components/ui/container"
import { Icon } from "@/components/ui/icon"
import { useFloatIn } from "@/lib/motion"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"

/** Lucide a retiré les logos de marques de son set — icône "in" recréée dans le même style (traits). */
const Linkedin = forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-linkedin", className)}
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
)
Linkedin.displayName = "Linkedin"

/** Même remarque pour Facebook : icône « f » redessinée au trait, dans le style Lucide. */
const Facebook = forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-facebook", className)}
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
)
Facebook.displayName = "Facebook"

const NAV_ITEMS = [
  { label: "Mes services", href: "/#services" },
  { label: "À propos", href: "/#a-propos" },
  { label: "Ma méthode", href: "/#ma-methode" },
  { label: "Tarifs", href: "/#tarifs" },
  { label: "Audit gratuit", href: "/audit-gratuit/" },
  { label: "Cas client", href: "/#cas-client" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
]

/*
  Le maillage interne part d'ici. Les neuf pages d'offre étaient réunies en une
  seule colonne, ce qui déséquilibrait tout le pied de page : elles sont
  désormais séparées entre prestations et secteurs.
*/
const PRESTATION_ITEMS = [
  { label: "Création de site vitrine", href: "/creation-site-vitrine/" },
  { label: "Création de site one page", href: "/creation-site-one-page/" },
  { label: "Refonte de site internet", href: "/refonte-site-internet/" },
  { label: "Référencement naturel", href: "/referencement-seo/" },
  { label: "Maintenance et hébergement", href: "/maintenance-site-internet/" },
  { label: "Tarifs et prix", href: "/tarifs-creation-site-internet/" },
]

const SECTEUR_ITEMS = [
  { label: "Site pour restaurant", href: "/site-internet-restaurant/" },
  { label: "Site pour artisan", href: "/site-internet-artisan/" },
  { label: "Site pour TPE", href: "/site-internet-tpe/" },
]

const RESEAUX = [
  { icon: Linkedin, label: "LinkedIn", href: siteConfig.social.linkedin },
  { icon: Facebook, label: "Facebook", href: siteConfig.social.facebook },
]

const LEGAL_LINKS = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
]

function Footer() {
  const floatIn = useFloatIn()

  return (
    <footer data-slot="footer" className="relative w-full border-t border-border bg-surface">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent" />
      <Container className="py-20">
        {/*
          Quatre blocs : la marque et le contact d'un côté, les trois colonnes de
          liens de l'autre. En dessous de `lg`, les colonnes se répartissent sur
          deux rangs plutôt que de s'empiler une par une.
        */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-12">
          <motion.div
            className="col-span-2 flex flex-col gap-5 sm:col-span-3 lg:col-span-4 lg:pr-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={floatIn(0, { y: 48 })}
          >
            {/*
              Version SOMBRE du logo, et non la version claire du pack : le pied
              de page de ce site est sur `bg-surface` (#fcfbf8), un fond clair.
              La version blanche y serait invisible.
            */}
            <Image
              src="/brand/logo-studio-digital-nova-header.webp"
              alt="Studio Digital Nova"
              width={847}
              height={218}
              /*
                `self-start` est indispensable : dans un conteneur `flex-col`,
                un enfant est étiré sur toute la largeur par défaut et `w-auto`
                suit l'étirement — le logo se retrouvait en 344×36 au lieu de
                140×36.
              */
              className="h-9 w-auto self-start"
            />
            <p className="measure max-w-sm text-body text-text-secondary">
              Je crée des sites vitrines modernes, rapides et optimisés pour{" "}
              <strong className="font-semibold text-text">convertir vos visiteurs en clients</strong>.
            </p>

            <a
              href="mailto:contact@studiodigitalnova.fr"
              className="group -my-1.5 flex min-h-11 w-fit max-w-full items-center gap-2.5 py-1.5 text-small text-text-secondary transition-colors duration-200 ease-nova hover:text-accent-strong"
            >
              <Icon
                icon={Mail}
                className="size-4 shrink-0 text-text-muted transition-colors duration-200 ease-nova group-hover:text-accent"
              />
              <span className="truncate">contact@studiodigitalnova.fr</span>
            </a>

            <ul className="flex items-center gap-3">
              {RESEAUX.map((reseau) => (
                <li key={reseau.label}>
                  <a
                    href={reseau.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={reseau.label}
                    title={reseau.label}
                    className="flex size-10 items-center justify-center rounded-md border border-border text-text-secondary transition-[color,border-color,background-color,transform] duration-300 ease-nova hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-paper"
                  >
                    <Icon icon={reseau.icon} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="lg:col-span-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={floatIn(0.08, { y: 48 })}
          >
            <p className="text-eyebrow uppercase text-text-muted">Navigation</p>
            <ul className="mt-5 flex flex-col gap-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="-my-1.5 flex min-h-11 items-center py-1.5 text-small text-text-secondary transition-colors duration-200 ease-nova hover:text-accent-strong"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="lg:col-span-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={floatIn(0.16, { y: 48 })}
          >
            <p className="text-eyebrow uppercase text-text-muted">Prestations</p>
            <ul className="mt-5 flex flex-col gap-3">
              {PRESTATION_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="-my-1.5 flex min-h-11 items-center py-1.5 text-small text-text-secondary transition-colors duration-200 ease-nova hover:text-accent-strong"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="lg:col-span-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={floatIn(0.24, { y: 48 })}
          >
            <p className="text-eyebrow uppercase text-text-muted">Secteurs</p>
            <ul className="mt-5 flex flex-col gap-3">
              {SECTEUR_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="-my-1.5 flex min-h-11 items-center py-1.5 text-small text-text-secondary transition-colors duration-200 ease-nova hover:text-accent-strong"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={floatIn(0.32, { y: 32 })}
        >
          <p className="text-small text-text-muted">
            © {new Date().getFullYear()} Studio Digital Nova. Tous droits réservés.
          </p>
          <ul className="flex items-center gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="-my-2 flex min-h-11 items-center py-2 text-small text-text-secondary transition-colors duration-200 ease-nova hover:text-accent-strong"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </Container>
    </footer>
  )
}

export { Footer }
