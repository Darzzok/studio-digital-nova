"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dialog } from "@base-ui/react/dialog"
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion"
import { ArrowRight, Gauge, Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Icon } from "@/components/ui/icon"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Mes services", href: "/#services" },
  { label: "À propos", href: "/#a-propos" },
  { label: "Ma méthode", href: "/#ma-methode" },
  { label: "Tarifs", href: "/#tarifs" },
  { label: "Cas client", href: "/#cas-client" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
]

function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const reduce = Boolean(useReducedMotion())
  const isMobile = useIsMobile()
  const skip = reduce || isMobile
  const initial = "hidden"
  const withSkip = (transition: Record<string, unknown>) => (skip ? { duration: 0, delay: 0 } : transition)
  const pathname = usePathname()
  // Le hero de l'accueil est une photo sombre : tant qu'on n'a pas scrollé, le header
  // doit rester lisible en clair plutôt qu'en texte sombre par défaut.
  const overDarkHero = pathname === "/" && !scrolled

  // Piloté par le scroll de Motion : plus de setState à chaque frame, on ne
  // re-rend qu'au franchissement du seuil.
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 8
    setScrolled((current) => (current === next ? current : next))
  })

  return (
    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
      <header
        data-slot="header"
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color,height] duration-300 ease-nova",
          scrolled
            ? "border-b border-border bg-background/88 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <Container
          className={cn(
            "flex items-center justify-between gap-4 transition-[height] duration-300 ease-nova xl:gap-6",
            scrolled ? "h-16" : "h-20"
          )}
        >
          <motion.a
            href="/"
            aria-label="Studio Digital Nova"
            className="flex shrink-0 items-center gap-2.5"
            initial={initial}
            animate="visible"
            variants={{
              hidden: { opacity: 0, x: -80, y: -20, rotate: -6 },
              visible: {
                opacity: 1,
                x: 0,
                y: 0,
                rotate: 0,
                transition: withSkip({
                  type: "spring",
                  stiffness: 130,
                  damping: 15,
                  mass: 0.8,
                  delay: 0.15,
                  opacity: { duration: 0.35, delay: 0.15 },
                }),
              },
            }}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-md text-eyebrow transition-colors duration-300 ease-nova",
                overDarkHero
                  ? "bg-paper text-ink"
                  : "bg-ink text-paper"
              )}
            >
              SDN
            </span>
            <span
              className={cn(
                "font-heading text-[1.0625rem] tracking-[0.005em] transition-colors duration-300 ease-nova",
                overDarkHero ? "text-on-ink" : "text-ink"
              )}
            >
              Studio Digital Nova
            </span>
          </motion.a>

          <nav className="hidden items-center gap-5 xl:flex">
            {NAV_ITEMS.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className={cn(
                  "group relative shrink-0 whitespace-nowrap py-1 text-small font-medium transition-colors duration-200 ease-nova",
                  overDarkHero ? "text-on-ink-soft hover:text-on-ink" : "text-text-secondary hover:text-text"
                )}
                initial={initial}
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: -28 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: withSkip({
                      type: "spring",
                      stiffness: 150,
                      damping: 16,
                      mass: 0.7,
                      delay: 0.4 + index * 0.07,
                      opacity: { duration: 0.3, delay: 0.4 + index * 0.07 },
                    }),
                  },
                }}
              >
                {/* Filet qui se déploie sous le libellé — pas de pastille. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 ease-nova group-hover:scale-x-100"
                />
                {item.label}
              </motion.a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {/*
              L'audit est un appel à l'action, pas une rubrique : il sort du
              menu pour devenir un bouton. En retrait par rapport au devis —
              filet seul contre encre pleine — pour ne pas lui voler la vedette.
            */}
            <motion.div
              initial={initial}
              animate="visible"
              variants={{
                hidden: { opacity: 0, x: 80, y: -20, rotate: 6 },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  transition: withSkip({
                    type: "spring",
                    stiffness: 130,
                    damping: 15,
                    mass: 0.8,
                    delay: 0.68,
                    opacity: { duration: 0.35, delay: 0.68 },
                  }),
                },
              }}
            >
              <Link href="/audit-gratuit/" className="group hidden lg:inline-flex">
                <Button
                  variant="outline"
                  className={cn(
                    "h-11 px-5",
                    overDarkHero &&
                      "border-border-ink text-on-ink hover:border-accent hover:text-accent"
                  )}
                >
                  <Icon icon={Gauge} />
                  Audit gratuit
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={initial}
              animate="visible"
              variants={{
                hidden: { opacity: 0, x: 80, y: -20, rotate: 6 },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  transition: withSkip({
                    type: "spring",
                    stiffness: 130,
                    damping: 15,
                    mass: 0.8,
                    delay: 0.75,
                    opacity: { duration: 0.35, delay: 0.75 },
                  }),
                },
              }}
            >
              <Link href="/#contact" className="group hidden sm:inline-flex">
                <Button
                  variant="primary"
                  className={cn(
                    "h-11 px-6",
                    overDarkHero && "bg-paper text-ink hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  Demander un devis
                  <Icon
                    icon={ArrowRight}
                    className="transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
                  />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={initial}
              animate="visible"
              variants={{
                hidden: { opacity: 0, x: 80, y: -20, rotate: 6 },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  transition: withSkip({
                    type: "spring",
                    stiffness: 130,
                    damping: 15,
                    mass: 0.8,
                    delay: 0.75,
                    opacity: { duration: 0.35, delay: 0.75 },
                  }),
                },
              }}
            >
              <Dialog.Trigger
                aria-label="Ouvrir le menu"
                className={cn(
                  "flex size-11 items-center justify-center rounded-md border transition-colors duration-200 ease-nova hover:border-accent hover:text-accent xl:hidden",
                  overDarkHero
                    ? "border-border-ink bg-white/8 text-on-ink backdrop-blur-md"
                    : "border-border-strong bg-surface text-text"
                )}
              >
                <Icon icon={Menu} className="size-5" />
              </Dialog.Trigger>
            </motion.div>
          </div>
        </Container>
      </header>

      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-[60] bg-ink/45 backdrop-blur-sm",
            "transition-opacity duration-300 ease-nova",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-[60] flex w-full max-w-xs flex-col gap-2 border-l border-border bg-background p-6 outline-none sm:max-w-sm",
            "transition-transform duration-300 ease-editorial",
            "data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full"
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-md bg-ink text-eyebrow text-paper">
                SDN
              </span>
              <span className="font-heading text-[1.0625rem] text-ink">
                Studio Digital Nova
              </span>
            </span>
            <Dialog.Close
              aria-label="Fermer le menu"
              className="flex size-10 items-center justify-center rounded-md text-text-secondary transition-colors duration-200 ease-nova hover:bg-secondary hover:text-accent-strong"
            >
              <Icon icon={X} className="size-5" />
            </Dialog.Close>
          </div>

          <nav className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="group flex items-center justify-between border-b border-border py-3.5 text-body font-medium text-text transition-colors duration-200 ease-nova hover:text-accent-strong"
              >
                {item.label}
                <Icon
                  icon={ArrowRight}
                  className="size-3.5 -translate-x-1 text-text-muted opacity-0 transition-all duration-200 ease-nova group-hover:translate-x-0 group-hover:text-accent group-hover:opacity-100"
                />
              </a>
            ))}
          </nav>

          <Link
            href="/audit-gratuit/"
            onClick={() => setMobileOpen(false)}
            className="group mt-auto pt-6"
          >
            <Button variant="outline" className="w-full">
              <Icon icon={Gauge} />
              Audit gratuit
            </Button>
          </Link>

          <Link href="/#contact" onClick={() => setMobileOpen(false)} className="group mt-3">
            <Button variant="primary" className="w-full">
              Demander un devis
              <Icon
                icon={ArrowRight}
                className="transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
              />
            </Button>
          </Link>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { Header }
