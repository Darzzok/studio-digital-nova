import type { Transition, Variants } from "framer-motion"

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
