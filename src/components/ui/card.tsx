import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
  Une carte n'est plus un bloc unique répété : le ton, la densité, le filet
  d'accent et l'interactivité sont quatre axes indépendants. Une carte qui ne
  mène nulle part ne se soulève pas — le survol reste un signal, pas un décor.
*/
const cardVariants = cva(
  /*
    Le texte des cartes est centré par défaut, à un seul endroit. Les listes à
    puces font exception : leurs lignes restent alignées à gauche, mais le bloc
    de liste est centré dans la carte — sans quoi le bord gauche des puces
    devient irrégulier et la lecture en souffre. Voir l'utilitaire `card-list`.
  */
  "relative rounded-xl border text-center transition-[transform,box-shadow,border-color] duration-300 ease-nova",
  {
    variants: {
      tone: {
        /** Papier — la carte par défaut, posée sur l'ivoire. */
        paper: "border-border bg-surface text-text shadow-sm",
        /** Ivoire — une carte dans une section déjà blanche. */
        ivory: "border-border bg-surface-sunken text-text",
        /** Encre — aplat bleu nuit, pour les blocs qui doivent dominer. */
        ink: "border-border-ink bg-surface-ink text-on-ink",
        /** Filet seul — aucune surface, juste un trait. */
        outline: "border-border-strong bg-transparent text-text",
      },
      /*
        Sur mobile, une carte occupait un écran entier : l'accueil faisait
        seize écrans. Le rembourrage est réduit sous 640 px, où l'espace est
        compté, et retrouve sa générosité au-dessus.
      */
      padding: {
        none: "p-0",
        sm: "p-4 sm:p-5",
        md: "p-5 sm:p-7",
        lg: "p-6 sm:p-9",
      },
      /** Filet terracotta — ponctue une carte sans la colorer. */
      accent: {
        none: "",
        top: "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-accent before:content-['']",
        left: "before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-accent before:content-['']",
      },
      /** Réservé aux cartes réellement cliquables. */
      interactive: {
        true: "cursor-pointer outline-none hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-lift)] focus-visible:-translate-y-1 focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/35",
        false: "",
      },
    },
    compoundVariants: [
      {
        tone: "ink",
        interactive: true,
        class: "hover:border-accent/50",
      },
    ],
    defaultVariants: {
      tone: "paper",
      padding: "lg",
      accent: "none",
      interactive: false,
    },
  }
)

function Card({
  className,
  tone,
  padding,
  accent,
  interactive,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ tone, padding, accent, interactive, className }))}
      {...props}
    />
  )
}

export { Card, cardVariants }
