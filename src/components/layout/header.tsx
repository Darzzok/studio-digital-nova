"use client"

import { useEffect, useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Menu, X } from "lucide-react"

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
      <header
        data-slot="header"
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ease-nova",
          scrolled
            ? "border-b border-border bg-surface/90 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <Container className="flex h-20 items-center justify-between gap-6">
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
              className="flex size-10 items-center justify-center rounded-xl text-base font-extrabold text-primary-foreground shadow-sm"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--color-primary), var(--color-accent-purple))",
              }}
            >
              N
            </span>
            <span className="text-h3 font-heading font-bold text-text">Studio Digital Nova</span>
          </motion.a>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_ITEMS.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="group relative shrink-0 whitespace-nowrap text-body font-medium text-text-secondary transition-colors duration-200 ease-nova hover:text-text"
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
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-3 -inset-y-2 -z-10 rounded-full bg-primary opacity-0 transition-opacity duration-200 ease-nova group-hover:opacity-[0.06]"
                />
                {item.label}
              </motion.a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
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
              <a href="/#contact" className="group hidden sm:inline-flex">
                <Button variant="primary" className="h-11 px-6 text-small">
                  Demander un devis
                  <Icon
                    icon={ArrowRight}
                    className="size-4 transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
                  />
                </Button>
              </a>
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
                className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-text transition-colors duration-150 ease-nova hover:border-primary hover:text-primary lg:hidden"
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
            "fixed inset-0 z-[60] bg-text/40 backdrop-blur-sm",
            "transition-opacity duration-300 ease-nova",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-[60] flex w-full max-w-xs flex-col gap-2 bg-surface p-6 shadow-lg outline-none sm:max-w-sm",
            "transition-transform duration-300 ease-nova",
            "data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <span
                className="flex size-9 items-center justify-center rounded-xl text-sm font-extrabold text-primary-foreground shadow-sm"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--color-primary), var(--color-accent-purple))",
                }}
              >
                N
              </span>
              <span className="text-body font-heading font-bold text-text">Studio Digital Nova</span>
            </span>
            <Dialog.Close
              aria-label="Fermer le menu"
              className="flex size-10 items-center justify-center rounded-xl text-text-secondary transition-colors duration-150 ease-nova hover:bg-primary/10 hover:text-primary"
            >
              <Icon icon={X} className="size-5" />
            </Dialog.Close>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-3 text-body font-medium text-text-secondary transition-colors duration-150 ease-nova hover:bg-primary/5 hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a href="/#contact" onClick={() => setMobileOpen(false)} className="group mt-auto pt-6">
            <Button variant="primary" className="w-full">
              Demander un devis
              <Icon
                icon={ArrowRight}
                className="size-4 transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
              />
            </Button>
          </a>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { Header }
