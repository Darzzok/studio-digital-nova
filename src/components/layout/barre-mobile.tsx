"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Gauge } from "lucide-react"

import { Icon } from "@/components/ui/icon"
import { EASE_NOVA } from "@/lib/motion"

/* ==========================================================================
   BARRE D'ACTION MOBILE
   ==========================================================================
   Sous 640 px, l'entête ne montre que le logo et le burger : les deux boutons
   d'action y sont masqués. Un visiteur pouvait donc parcourir seize écrans
   sans jamais croiser un moyen de vous joindre.

   Cette barre n'apparaît qu'après le premier écran — elle ne recouvre pas
   l'accroche — et s'efface dès qu'on approche du pied de page, où les mêmes
   actions sont déjà présentes en grand.
   ========================================================================== */

function BarreMobile() {
  const [visible, setVisible] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const evaluer = () => {
      const passeLeHero = window.scrollY > window.innerHeight * 0.8
      const pied = document.querySelector("footer")
      const piedProche = pied
        ? pied.getBoundingClientRect().top < window.innerHeight + 120
        : false
      setVisible(passeLeHero && !piedProche)
    }
    evaluer()
    window.addEventListener("scroll", evaluer, { passive: true })
    window.addEventListener("resize", evaluer)
    return () => {
      window.removeEventListener("scroll", evaluer)
      window.removeEventListener("resize", evaluer)
    }
  }, [])

  return (
    <motion.div
      /*
        Toujours dans le DOM : `inert` et `translate-y` suffisent à la retirer
        du parcours clavier sans la démonter à chaque défilement.
      */
      inert={!visible}
      aria-hidden={!visible}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      initial={false}
      animate={{ y: visible ? 0 : "110%" }}
      transition={reduce ? { duration: 0 } : { duration: 0.32, ease: EASE_NOVA }}
    >
      <div className="flex items-stretch gap-2 px-4 pt-3">
        <Link
          href="/audit-gratuit/"
          tabIndex={visible ? undefined : -1}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-border-strong text-small font-medium text-text outline-none transition-colors duration-200 ease-nova focus-visible:ring-3 focus-visible:ring-ring/35 active:bg-secondary"
        >
          <Icon icon={Gauge} className="size-4" />
          Audit gratuit
        </Link>
        <Link
          href="/#contact"
          tabIndex={visible ? undefined : -1}
          className="flex min-h-12 flex-[1.25] items-center justify-center gap-2 rounded-lg bg-ink text-small font-medium text-paper outline-none transition-colors duration-200 ease-nova focus-visible:ring-3 focus-visible:ring-ring/35 active:bg-ink/90"
        >
          Demander un devis
          <Icon icon={ArrowRight} className="size-4" />
        </Link>
      </div>
    </motion.div>
  )
}

export { BarreMobile }
