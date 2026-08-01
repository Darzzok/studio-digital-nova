"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Icon } from "@/components/ui/icon"
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
  const reduce = useReducedMotion()
  const initial = reduce ? false : "hidden"

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
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
              transition: {
                type: "spring",
                stiffness: 130,
                damping: 15,
                mass: 0.8,
                delay: 0.15,
                opacity: { duration: 0.35, delay: 0.15 },
              },
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
              className="group relative text-body font-medium text-text-secondary transition-colors duration-200 ease-nova hover:text-text"
              initial={initial}
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: -28 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 150,
                    damping: 16,
                    mass: 0.7,
                    delay: 0.4 + index * 0.07,
                    opacity: { duration: 0.3, delay: 0.4 + index * 0.07 },
                  },
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

        <motion.div
          className="shrink-0"
          initial={initial}
          animate="visible"
          variants={{
            hidden: { opacity: 0, x: 80, y: -20, rotate: 6 },
            visible: {
              opacity: 1,
              x: 0,
              y: 0,
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 130,
                damping: 15,
                mass: 0.8,
                delay: 0.75,
                opacity: { duration: 0.35, delay: 0.75 },
              },
            },
          }}
        >
          <a href="/#contact" className="hidden sm:inline-flex">
            <Button variant="primary" className="h-11 px-6 text-small">
              Demander un devis
              <Icon icon={ArrowRight} className="size-4" />
            </Button>
          </a>
        </motion.div>
      </Container>
    </header>
  )
}

export { Header }
