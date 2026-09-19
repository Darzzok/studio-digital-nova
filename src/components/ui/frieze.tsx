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

  Le rail est un SVG : un trait de fond, un trait d'accent dont le
  `pathLength` est lié à la progression, et des repères qui s'allument au
  passage. `vector-effect: non-scaling-stroke` garantit un filet d'un pixel
  quelle que soit la déformation du viewBox.

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

/** Repère perpendiculaire au rail : s'allume quand la progression le dépasse. */
function RailTick({
  progress,
  at,
  vertical,
}: {
  progress: MotionValue<number>
  at: number
  vertical: boolean
}) {
  const opacity = useTransform(progress, [at - 0.04, at], [0, 1])

  return (
    <motion.span
      aria-hidden
      className={cn(
        "pointer-events-none absolute bg-ink",
        vertical ? "left-1/2 h-px w-1.5 -translate-x-1/2" : "top-1/2 h-1.5 w-px -translate-y-1/2"
      )}
      style={{
        opacity,
        ...(vertical ? { top: `${at * 100}%` } : { left: `${at * 100}%` }),
      }}
    />
  )
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
        <div
          className={cn(
            "pointer-events-none absolute",
            vertical
              ? "inset-y-[1.125rem] left-[1.125rem] w-px"
              : "inset-x-[1.125rem] top-[1.125rem] h-px sm:inset-x-[1.375rem] sm:top-[1.375rem]"
          )}
        >
          <div ref={railRef} className="relative h-full w-full">
            <svg
              aria-hidden
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox={vertical ? "0 0 1 100" : "0 0 100 1"}
              preserveAspectRatio="none"
            >
              <line
                x1={vertical ? 0.5 : 0}
                y1={vertical ? 0 : 0.5}
                x2={vertical ? 0.5 : 100}
                y2={vertical ? 100 : 0.5}
                stroke="var(--color-border)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              {/*
                Le chemin parcouru se trace à l'encre. En terracotta, il
                formait une nouvelle ligne orange en haut d'une carte, alors
                que l'accent est réservé à ce qui appelle une action — ici,
                l'anneau de l'étape en cours.
              */}
              <motion.line
                x1={vertical ? 0.5 : 0}
                y1={vertical ? 0 : 0.5}
                x2={vertical ? 0.5 : 100}
                y2={vertical ? 100 : 0.5}
                stroke="var(--color-ink)"
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
                style={{ pathLength: drawn }}
              />
            </svg>

            {/* Repères d'étape, allumés au passage de la progression. */}
            {steps.map((step, index) => (
              <RailTick
                key={`tick-${step.key}`}
                progress={drawn}
                at={index / lastIndex}
                vertical={vertical}
              />
            ))}

            {/* Marqueur voyageur — un simple losange d'encre cerclé de terracotta. */}
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
              : "flex items-start justify-between"
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
                  L'intitulé s'affiche à toutes les tailles. Masqué sous
                  640 px, la frise se réduisait à quatre ronds numérotés : on
                  voyait qu'on avançait, pas vers quoi.
                */}
                {!vertical && (
                  <span
                    className={cn(
                      "text-center text-[10px] uppercase leading-tight tracking-[0.08em] transition-colors duration-500 ease-nova sm:text-eyebrow",
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
