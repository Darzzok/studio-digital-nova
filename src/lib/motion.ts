"use client"

import { useReducedMotion } from "framer-motion"
import type { Transition, Variants } from "framer-motion"

import { useIsMobile } from "@/hooks/use-is-mobile"

/** Shared easing curve — every animation in the design system uses this. */
export const EASE_NOVA: Transition["ease"] = [0.22, 1, 0.36, 1]

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

/** Snappy spring for interactive state changes (toggles, tabs, selection). */
export const snapTransition: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
}

/** Micro-interaction hover transition — matches the 150ms button/card hover. */
export const hoverTransition: Transition = { duration: 0.15, ease: EASE_NOVA }

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }
type FloatOptions = { stiffness?: number; damping?: number; mass?: number; opacityDuration?: number }

/**
 * Fabrique de variants "floatIn" — identique à chaque copie locale historique, mais
 * consciente de mobile/tablette et de prefers-reduced-motion : sur ces contextes, la
 * transition passe à durée 0 (apparition immédiate, sans fondu ni décalage), sans jamais
 * toucher au timing desktop. Les appels `floatIn(delay, from, options)` existants dans
 * chaque section restent inchangés — seule la définition de la fabrique change.
 */
export function useFloatIn(defaults?: FloatOptions) {
  const reduce = Boolean(useReducedMotion())
  const isMobile = useIsMobile()
  const skip = reduce || isMobile

  return function floatIn(delay: number, from: FloatFrom, options?: FloatOptions) {
    const {
      stiffness = defaults?.stiffness ?? 110,
      damping = defaults?.damping ?? 15,
      mass = defaults?.mass ?? 1,
      opacityDuration = defaults?.opacityDuration ?? 0.4,
    } = options ?? {}

    return {
      hidden: {
        opacity: 0,
        x: from.x ?? 0,
        y: from.y ?? 0,
        rotate: from.rotate ?? 0,
        scale: from.scale ?? 1,
      },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        transition: skip
          ? { duration: 0, delay: 0 }
          : {
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
