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
  { label: "Blog", href: "/blog/" },
  { label: "FAQ", href: "/faq/" },
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
  { label: "Mentions légales", href: "/mentions-legales/" },
  { label: "Confidentialité", href: "/confidentialite/" },
]

function Footer() {
  const floatIn = useFloatIn()

  return (
    /*
      Fond bleu nuit — le même `--nova-ink` que les boutons principaux. Le pied
      de page ferme le site sur la couleur de la marque au lieu de se fondre
      dans l'ivoire, et tout y est centré.
    */
    <footer data-slot="footer" className="relative w-full bg-surface-ink text-on-ink">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/55 to-transparent" />
      <Container className="py-16 sm:py-20">
        <motion.div
          className="flex flex-col items-center gap-5 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={floatIn(0, { y: 40 })}
        >
          {/*
            Version claire du logo : le fond est désormais sombre. Les
            dimensions intrinsèques sont celles du fichier, et seule la hauteur
            est imposée — un `w-auto` dans un conteneur `flex-col` s'étire si
            l'élément n'est pas sorti du flux d'étirement, d'où `mx-auto`.
          */}
          <Image
            src="/brand/logo-studio-digital-nova-footer.webp"
            alt="Studio Digital Nova"
            width={467}
            height={129}
            className="mx-auto h-10 w-auto"
          />
          <p className="measure max-w-md text-body text-on-ink-soft">
            Je crée des sites vitrines modernes, rapides et optimisés pour{" "}
            <strong className="font-semibold text-on-ink">convertir vos visiteurs en clients</strong>.
          </p>

          <a
            href="mailto:contact@studiodigitalnova.fr"
            className="group -my-1.5 flex min-h-11 max-w-full items-center gap-2.5 py-1.5 text-small text-on-ink-soft transition-colors duration-200 ease-nova hover:text-accent"
          >
            <Icon icon={Mail} className="size-4 shrink-0 text-on-ink-soft transition-colors duration-200 ease-nova group-hover:text-accent" />
            <span className="truncate">contact@studiodigitalnova.fr</span>
          </a>

          <ul className="flex items-center justify-center gap-3">
            {RESEAUX.map((reseau) => (
              <li key={reseau.label}>
                <a
                  href={reseau.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={reseau.label}
                  title={reseau.label}
                  className="flex size-11 items-center justify-center rounded-md border border-border-ink text-on-ink-soft transition-[color,border-color,background-color,transform] duration-300 ease-nova hover:-translate-y-0.5 hover:border-paper hover:bg-paper hover:text-ink"
                >
                  <Icon icon={reseau.icon} className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        <div aria-hidden className="mx-auto mt-14 h-px w-full max-w-xs bg-border-ink" />

        {/*
          Trois colonnes de liens, centrées. Sous 640 px elles s'empilent ;
          au-dessus elles se répartissent à parts égales.
        */}
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-9 text-center sm:grid-cols-3">
          {[
            { titre: "Navigation", liens: NAV_ITEMS, ancre: true, delai: 0.08 },
            { titre: "Prestations", liens: PRESTATION_ITEMS, ancre: false, delai: 0.16 },
            { titre: "Secteurs", liens: SECTEUR_ITEMS, ancre: false, delai: 0.24 },
          ].map((colonne) => (
            <motion.div
              key={colonne.titre}
              className="flex flex-col items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={floatIn(colonne.delai, { y: 40 })}
            >
              <p className="text-eyebrow uppercase text-on-ink-soft">{colonne.titre}</p>
              {/*
                Sous 640 px, les dix-sept liens empilés faisaient un pied de
                page interminable. Ils passent sur deux colonnes : la hauteur
                est divisée par deux et rien n'est masqué derrière un dépliant.
              */}
              <ul className="mt-5 grid w-full grid-cols-2 gap-x-4 gap-y-1 text-center sm:flex sm:w-auto sm:flex-col sm:items-center sm:gap-2.5">
                {colonne.liens.map((item) => (
                  <li key={item.href}>
                    {colonne.ancre ? (
                      <a
                        href={item.href}
                        className="-my-1.5 flex min-h-11 items-center justify-center py-1.5 text-small text-on-ink-soft transition-colors duration-200 ease-nova hover:text-accent"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="-my-1.5 flex min-h-11 items-center justify-center py-1.5 text-small text-on-ink-soft transition-colors duration-200 ease-nova hover:text-accent"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-14 flex flex-col items-center gap-4 border-t border-border-ink pt-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={floatIn(0.32, { y: 28 })}
        >
          <ul className="flex flex-wrap items-center justify-center gap-x-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="-my-2 flex min-h-11 items-center py-2 text-small text-on-ink-soft transition-colors duration-200 ease-nova hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-small text-on-ink-soft">
            © {new Date().getFullYear()} Studio Digital Nova. Tous droits réservés.
          </p>
        </motion.div>
      </Container>
    </footer>
  )
}

export { Footer }
