"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Check } from "lucide-react"
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion"
import type { MotionValue } from "framer-motion"

import { Icon } from "@/components/ui/icon"
import { NovaMark } from "@/components/ui/nova"
import { cn } from "@/lib/utils"

/*
  ============================================================================
  FRISE — un seul langage visuel pour toutes les progressions du site
  ============================================================================
  Un composant, deux régimes :

  · SNAPPÉ    — la progression suit `activeIndex` par paliers ressortés.
                C'est le mode du configurateur de contact.
  · SCRUBBÉ   — on passe une MotionValue `progress` (0→1) pilotée par le
                scroll : le rail se dessine en continu et un marqueur le
                parcourt. C'est le mode de la section « Ma méthode ».

  … et deux orientations : horizontale (desktop) et verticale (mobile), avec
  exactement le même balisage — seul l'axe change.

  Le rail est fait de deux blocs : un trait de fond et un trait d'encre mis à
  l'échelle en `scaleX`. Il a d'abord été un SVG dont le `pathLength` suivait
  la progression — mais avec un viewBox déformé, le tiret calculé en unités
  utilisateur sortait en pointillés entre les repères.

  Tout ce qui bouge est `transform` ou `opacity`. Le marqueur se déplace en
  pixels mesurés (ResizeObserver) plutôt qu'en pourcentage de `left`, pour
  rester sur le compositeur.
============================================================================ */

export type FriezeStep = {
  /** Clé stable — le libellé ou le numéro de l'étape. */
  key: string
  /** Libellé affiché près de la pastille. */
  label: string
  /** Icône de la pastille. À défaut, le rang de l'étape est affiché. */
  icon?: LucideIcon
}

type Orientation = "horizontal" | "vertical"

type FriezeProps = {
  /**
   * Identifiant de la frise. Sert d'espace de noms au `layoutId` de l'anneau :
   * sans lui, les deux frises de la page se partageraient le même anneau, qui
   * traverserait l'écran de l'une à l'autre.
   */
  id: string
  steps: FriezeStep[]
  activeIndex: number
  /** Rang maximum atteignable au clic. Par défaut, toutes les étapes. */
  reachableIndex?: number
  onSelect?: (index: number) => void
  /** Préfixe de l'`aria-label` des pastilles. */
  labelPrefix?: string
  className?: string
  orientation?: Orientation
  /**
   * Progression continue 0→1. Fournie, elle prend la main sur `activeIndex`
   * pour dessiner le rail et fait apparaître le marqueur voyageur.
   */
  progress?: MotionValue<number>
}

/** Taille du rail en pixels — nécessaire pour déplacer le marqueur en `transform`. */
function useRailSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height }
      )
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return size
}

function Frieze({
  id,
  steps,
  activeIndex,
  reachableIndex,
  onSelect,
  labelPrefix = "Étape",
  className,
  orientation = "horizontal",
  progress,
}: FriezeProps) {
  const reduce = Boolean(useReducedMotion())
  const vertical = orientation === "vertical"
  const lastIndex = Math.max(steps.length - 1, 1)
  const reachable = reachableIndex ?? steps.length - 1

  const railRef = React.useRef<HTMLDivElement | null>(null)
  const rail = useRailSize(railRef)

  // Mode snappé : la progression est déduite du rang actif et ressortée.
  const snapped = useSpring(activeIndex / lastIndex, {
    stiffness: 90,
    damping: 22,
    mass: 0.9,
  })
  React.useEffect(() => {
    snapped.set(activeIndex / lastIndex)
  }, [activeIndex, lastIndex, snapped])

  const drawn = progress ?? snapped

  // Déplacement du marqueur, en pixels, sur l'axe du rail.
  const travel = useTransform(drawn, [0, 1], [0, vertical ? rail.height : rail.width])
  const markerVisible = useTransform(drawn, [0, 0.012], [0, 1])
  const endVisible = useTransform(drawn, [0.965, 1], [0, 1])

  return (
    <div className={cn(vertical ? "flex flex-col self-stretch" : "w-full", className)}>
      <div className={cn("relative", vertical ? "flex flex-1 gap-4" : "")}>
        {/*
          Rail — tendu du centre de la première pastille au centre de la
          dernière. Les décalages compensent la demi-hauteur d'une pastille.
        */}
        {/*
          Le trait est tendu d'un CENTRE de pastille à l'autre. Un retrait fixe
          de 18 px supposait les pastilles collées aux bords ; réparties à
          parts égales, la première a son centre à la moitié d'une colonne,
          soit 50/n pour cent — et le trait dépassait de part et d'autre.
        */}
        <div
          className={cn(
            "pointer-events-none absolute",
            vertical ? "left-[1.125rem] w-px" : "top-[1.125rem] h-px sm:top-[1.375rem]"
          )}
          style={
            vertical
              ? { top: `${50 / steps.length}%`, bottom: `${50 / steps.length}%` }
              : { left: `${50 / steps.length}%`, right: `${50 / steps.length}%` }
          }
        >
          {/*
            Trait plein, et non une ligne SVG à `pathLength`. Le viewBox est
            déformé (`preserveAspectRatio="none"`, 100 unités pour six cents
            pixels) : le tiret calculé en unités utilisateur se retrouvait
            étiré n'importe comment et le remplissage sortait en pointillés
            entre les repères. Deux blocs et un `scaleX` donnent un trait
            continu, exact, et animé sur le compositeur.
          */}
          <div ref={railRef} className="relative h-full w-full bg-border">
            <motion.div
              aria-hidden
              className="absolute inset-y-0 left-0 w-full origin-left bg-ink"
              style={{ scaleX: drawn }}
            />

            {/* Marqueur voyageur — réservé au régime scrubbé. */}
            {progress && !reduce && (
              <motion.span
                aria-hidden
                className={cn(
                  "absolute",
                  vertical ? "left-1/2 top-0 -ml-[3px]" : "left-0 top-1/2 -mt-[3px]"
                )}
                style={{
                  opacity: markerVisible,
                  ...(vertical ? { y: travel } : { x: travel }),
                }}
              >
                <span className="block size-1.5 rotate-45 bg-accent" />
              </motion.span>
            )}

            {/* Signature de fin de parcours. */}
            {progress && (
              <motion.span
                aria-hidden
                className={cn(
                  "absolute text-accent",
                  vertical ? "-bottom-3 left-1/2 -ml-[6px]" : "-right-3 top-1/2 -mt-[6px]"
                )}
                style={{ opacity: endVisible }}
              >
                <NovaMark className="size-3" />
              </motion.span>
            )}
          </div>
        </div>

        <ol
          className={cn(
            "relative",
            vertical
              ? "flex flex-1 shrink-0 flex-col items-center justify-between"
              : "flex items-start justify-between gap-1 sm:gap-2"
          )}
        >
          {steps.map((step, index) => {
            const isActive = index === activeIndex
            const isDone = index < activeIndex
            const isClickable = Boolean(onSelect) && index <= reachable && !isActive

            return (
              <li
                key={step.key}
                className={cn(
                  "flex min-w-0",
                  vertical
                    ? "items-center"
                    : "flex-1 flex-col items-center gap-2.5"
                )}
              >
                <button
                  type="button"
                  disabled={Boolean(onSelect) && !isClickable && !isActive}
                  onClick={() => isClickable && onSelect?.(index)}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${labelPrefix} ${index + 1} : ${step.label}`}
                  className={cn(
                    // La pastille mesure 36px, mais sa zone tactile est portée
                    // à 48px par un pseudo-élément — confort au doigt sans
                    // alourdir le dessin de la frise.
                    "group relative flex size-9 shrink-0 items-center justify-center rounded-full border text-small after:absolute after:-inset-1.5 after:content-['']",
                    "transition-[background-color,border-color,color,opacity,transform] duration-500 ease-nova",
                    !vertical && "sm:size-11 sm:after:inset-0",
                    isActive && "scale-105 border-ink bg-ink text-paper",
                    // Une étape franchie s'efface légèrement : l'attention
                    // reste sur l'étape courante.
                    isDone && "border-ink/35 bg-ink/8 text-ink opacity-80",
                    !isActive && !isDone && "border-border-strong bg-surface text-text-muted opacity-60",
                    isClickable && "cursor-pointer hover:opacity-100 hover:border-ink hover:text-ink",
                    !isClickable && !isActive && "cursor-default"
                  )}
                >
                  {/* Anneau d'accent qui glisse jusqu'à l'étape courante. */}
                  {isActive && !reduce && (
                    <motion.span
                      layoutId={`frieze-ring-${id}`}
                      aria-hidden
                      className="pointer-events-none absolute -inset-1.5 rounded-full border border-accent"
                      transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.8 }}
                    />
                  )}
                  {isActive && reduce && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-1.5 rounded-full border border-accent"
                    />
                  )}

                  {isDone ? (
                    <Icon icon={Check} className="size-3.5" />
                  ) : step.icon ? (
                    <Icon icon={step.icon} className="size-4" />
                  ) : (
                    <span className="font-heading text-small leading-none">{index + 1}</span>
                  )}
                </button>

                {/*
                  Quatre intitulés côte à côte demandent de la place :
                  « COORDONNÉES » fait à lui seul 60 points, et sous 640 px une
                  colonne n'en mesure plus que 54 — les mots se touchaient.
                  Ils s'affichent donc à partir de `sm` ; en dessous, c'est
                  l'étape en cours qui est nommée sous la barre de progression.
                */}
                {!vertical && (
                  <span
                    className={cn(
                      "hidden text-center text-eyebrow uppercase leading-tight transition-colors duration-500 ease-nova sm:block",
                      isActive ? "font-medium text-text" : "text-text-muted"
                    )}
                  >
                    {step.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

export { Frieze }
