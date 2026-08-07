"use client"

import { forwardRef } from "react"
import Link from "next/link"
import { Mail } from "lucide-react"
import type { LucideProps } from "lucide-react"
import { motion } from "framer-motion"

import { Container } from "@/components/ui/container"
import { Icon } from "@/components/ui/icon"
import { useFloatIn } from "@/lib/motion"
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

const NAV_ITEMS = [
  { label: "Mes services", href: "/#services" },
  { label: "À propos", href: "/#a-propos" },
  { label: "Ma méthode", href: "/#ma-methode" },
  { label: "Tarifs", href: "/#tarifs" },
  { label: "Cas client", href: "/#cas-client" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
]

const CONTACT_ITEMS = [
  { icon: Mail, label: "contact@studiodigitalnova.fr", href: "mailto:contact@studiodigitalnova.fr" },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/geoffrey-marechal-677417428",
    external: true,
  },
]

const LEGAL_LINKS = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
]

function Footer() {
  const floatIn = useFloatIn()

  return (
    <footer data-slot="footer" className="w-full border-t border-border bg-surface">
      <Container className="py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            className="flex flex-col gap-4 lg:col-span-2 lg:pr-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0, { x: -140, rotate: -4 })}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-10 items-center justify-center rounded-xl text-base font-extrabold text-primary-foreground shadow-sm"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--color-primary), var(--color-accent-purple))",
                }}
              >
                N
              </span>
              <span className="text-h3 font-heading font-bold text-text">Studio Digital Nova</span>
            </div>
            <p className="max-w-sm text-body text-text-secondary">
              Je crée des sites vitrines modernes, rapides et optimisés pour{" "}
              <strong className="font-semibold text-text">convertir vos visiteurs en clients</strong>.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.1, { y: 90 })}
          >
            <p className="text-small font-semibold text-text">Navigation</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="-my-1.5 inline-block py-1.5 text-body text-text-secondary transition-colors duration-150 ease-nova hover:text-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.2, { x: 140, rotate: 4 })}
          >
            <p className="text-small font-semibold text-text">Contact</p>
            <ul className="mt-4 flex flex-col gap-3">
              {CONTACT_ITEMS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="-my-1.5 flex items-center gap-2.5 py-1.5 text-body text-text-secondary transition-colors duration-150 ease-nova hover:text-primary"
                  >
                    <Icon icon={item.icon} className="size-4 shrink-0" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.3, { y: 40 })}
        >
          <p className="text-small text-text-secondary">
            © {new Date().getFullYear()} Studio Digital Nova. Tous droits réservés.
          </p>
          <ul className="flex items-center gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="-my-2 inline-block py-2 text-small text-text-secondary transition-colors duration-150 ease-nova hover:text-primary"
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
