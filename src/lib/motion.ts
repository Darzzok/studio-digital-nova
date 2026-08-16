"use client"

import { useReducedMotion } from "framer-motion"
import type { Transition, Variants } from "framer-motion"

import { useIsMobile } from "@/hooks/use-is-mobile"

/** Courbe partagée par toutes les animations du design system. */
export const EASE_NOVA: Transition["ease"] = [0.22, 1, 0.36, 1]

/** Courbe éditoriale — départ plus franc, arrivée très longue. */
export const EASE_EDITORIAL: Transition["ease"] = [0.32, 0.72, 0, 1]

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE_NOVA } },
}

export const slideVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_NOVA } },
}

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_NOVA } },
}

/** Spring nerveux pour les changements d'état interactifs (onglets, sélection). */
export const snapTransition: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
}

/** Micro-interaction de survol — accompagne le 200ms des boutons et cartes. */
export const hoverTransition: Transition = { duration: 0.2, ease: EASE_NOVA }

/** Spring de survol : léger, sans rebond visible. */
export const hoverSpring: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 26,
  mass: 0.7,
}

/** Ressenti tactile standard : on enfonce, on relâche. */
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.985, y: 0 },
  transition: hoverSpring,
} as const

/** Viewport par défaut des entrées au scroll. */
export const VIEWPORT_ONCE = { once: true, amount: 0.3 } as const

/**
 * Orchestration d'une grille : les enfants s'enchaînent tout seuls au lieu
 * d'un `delay: index * n` recalculé dans chaque section.
 */
export function staggerContainer(stagger = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
  }
}

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }
type FloatOptions = { stiffness?: number; damping?: number; mass?: number; opacityDuration?: number }

/**
 * Fabrique de variants "floatIn".
 *
 * Trois régimes, une seule API — les appels `floatIn(delay, from, options)`
 * existants dans chaque section sont inchangés :
 *
 *  - desktop : le spring complet (x / y / rotate / scale) ;
 *  - mobile & tablette : une variante allégée — uniquement un léger décalage
 *    vertical, jamais de translation horizontale ni de rotation. Le site n'est
 *    donc plus figé sous 1024px, et l'absence de transform x supprime la cause
 *    du débordement horizontal ;
 *  - prefers-reduced-motion : apparition immédiate, sans fondu ni décalage.
 */
export function useFloatIn(defaults?: FloatOptions) {
  const reduce = Boolean(useReducedMotion())
  const isMobile = useIsMobile()

  return function floatIn(delay: number, from: FloatFrom, options?: FloatOptions) {
    const {
      stiffness = defaults?.stiffness ?? 110,
      damping = defaults?.damping ?? 15,
      mass = defaults?.mass ?? 1,
      opacityDuration = defaults?.opacityDuration ?? 0.4,
    } = options ?? {}

    /*
      Chaque régime déclare TOUTES les propriétés animées, y compris celles
      qu'il n'utilise pas. Sans cela, un changement de régime en cours de vie
      (rotation de l'écran, passage sous 1024px, activation de « réduire les
      animations ») laisserait une propriété absente de `visible` figée sur sa
      valeur `hidden` — un élément resté à `translateX(-160px)`, hors cadre.
    */
    const settled = { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }

    if (reduce) {
      return {
        hidden: { opacity: 0, x: 0, y: 0, rotate: 0, scale: 1 },
        visible: { ...settled, transition: { duration: 0, delay: 0 } },
      }
    }

    if (isMobile) {
      // Le mouvement se résume à une montée courte : lisible sur petit écran,
      // sans créer de zone hors cadre. Les délais sont compressés de moitié.
      const y = from.y === undefined ? 18 : Math.max(-18, Math.min(18, from.y))

      return {
        hidden: { opacity: 0, x: 0, y, rotate: 0, scale: 1 },
        visible: {
          ...settled,
          transition: {
            type: "spring" as const,
            stiffness: 220,
            damping: 26,
            mass: 0.7,
            delay: delay * 0.5,
            opacity: { duration: 0.32, delay: delay * 0.5 },
          },
        },
      }
    }

    return {
      hidden: {
        opacity: 0,
        x: from.x ?? 0,
        y: from.y ?? 0,
        rotate: from.rotate ?? 0,
        scale: from.scale ?? 1,
      },
      visible: {
        ...settled,
        transition: {
          type: "spring" as const,
          stiffness,
          damping,
          mass,
          delay,
          opacity: { duration: opacityDuration, delay },
        },
      },
    }
  }
}

/**
 * Variante de survol conditionnelle : neutralisée si l'utilisateur a demandé
 * moins d'animation ou s'il est au doigt (où le survol n'existe pas).
 */
export function useHoverMotion() {
  const reduce = Boolean(useReducedMotion())
  const isMobile = useIsMobile()
  const disabled = reduce || isMobile

  return {
    disabled,
    whileHover: disabled ? undefined : pressable.whileHover,
    whileTap: disabled ? undefined : pressable.whileTap,
    transition: hoverSpring,
  }
}
