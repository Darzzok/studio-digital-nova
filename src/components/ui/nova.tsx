import * as React from "react"

import { cn } from "@/lib/utils"

/*
  ============================================================================
  GRAMMAIRE NOVA — le vocabulaire graphique partagé par toutes les cartes
  ============================================================================
  Quatre signes, et rien d'autre :

    ligne fine  ·  numéro  ·  accent terracotta  ·  symbole Nova

  Chaque famille de cartes recombine ces quatre signes différemment. C'est
  cette recombinaison — et non un habillage commun — qui fait qu'un service,
  un tarif et un article se ressemblent sans être identiques.

  Tout est en CSS : les réactions au survol passent par `group-hover`, donc
  aucun coût JavaScript et rien qui tourne sur mobile, où le survol n'existe
  pas. Motion n'intervient que sur les entrées et les changements d'état.
============================================================================ */

/*
  ---------------------------------------------------------------------------
  PASTILLES D'ICÔNE
  ---------------------------------------------------------------------------
  Un aplat teinté seul est fade : sans contour, la pastille flotte et l'icône
  paraît délavée. Chaque ton porte donc trois choses — un filet dans sa propre
  teinte, un fond très légèrement plus dense, et un remplissage complet au
  survol de la carte, l'icône passant alors au papier ou à l'encre.

  C'est ce basculement tint → aplat qui fait vivre les cartes, et il ne coûte
  rien : une transition CSS, déclenchée par le `group` de la carte.
*/
const CHIP_BASE =
  "border transition-[transform,background-color,border-color,color] duration-500 ease-nova"

export const CHIP = {
  /** Encre — le ton neutre, désormais franc plutôt que gris pâle. */
  ink: `${CHIP_BASE} border-ink/25 bg-ink/8 text-ink group-hover:border-ink group-hover:bg-ink group-hover:text-paper`,
  /** Bleu minéral — la voix calme. */
  mineral: `${CHIP_BASE} border-mineral/35 bg-mineral/10 text-mineral group-hover:border-mineral group-hover:bg-mineral group-hover:text-paper`,
  /** Terracotta — l'accent, réservé aux offres et aux temps forts. */
  terracotta: `${CHIP_BASE} border-accent/45 bg-accent/12 text-accent-strong group-hover:border-accent group-hover:bg-accent group-hover:text-ink`,
  /** Sauge. */
  sage: `${CHIP_BASE} border-success/35 bg-success/10 text-success group-hover:border-success group-hover:bg-success group-hover:text-paper`,
  /** Ocre. */
  ochre: `${CHIP_BASE} border-warning/35 bg-warning/10 text-warning group-hover:border-warning group-hover:bg-warning group-hover:text-ink`,
} as const

/**
 * Le symbole Nova — une étoile à quatre branches, l'astérisque d'un texte
 * imprimé autant qu'une étoile nouvelle. À employer avec parcimonie : un seul
 * par carte, et seulement là où la carte doit être signée.
 */
function NovaMark({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("size-3", className)}
      {...props}
    >
      <path d="M12 1.5c.55 5.32 4.68 9.45 10 10-5.32.55-9.45 4.68-10 10-.55-5.32-4.68-9.45-10-10 5.32-.55 9.45-4.68 10-10Z" />
    </svg>
  )
}

/**
 * Le numéro de rang, en serif, suivi d'un filet qui s'étire au survol de la
 * carte. C'est l'ouverture éditoriale : on lit d'abord un chiffre, puis une
 * ligne, puis le titre.
 */
function CardIndex({
  value,
  tone = "light",
  className,
}: {
  /** Rang affiché — déjà formaté par l'appelant (« 01 », « I »…). */
  value: string
  tone?: "light" | "ink"
  className?: string
}) {
  const onInk = tone === "ink"

  return (
    // Le rang est un repère graphique, pas une information : masqué aux
    // technologies d'assistance, qui annonceraient sinon « 01 » avant chaque titre.
    <div aria-hidden className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "font-heading text-small leading-none tabular-nums transition-colors duration-500 ease-nova",
          onInk ? "text-on-ink-soft group-hover:text-on-ink" : "text-text-muted group-hover:text-text"
        )}
      >
        {value}
      </span>
      <span
        aria-hidden
        className={cn(
          "h-px flex-1 origin-left transition-transform duration-700 ease-editorial",
          onInk ? "bg-border-ink" : "bg-border"
        )}
      />
      {/*
        Le segment qui s'allonge au survol était terracotta : une ligne orange
        en haut de chaque carte, répétée des dizaines de fois sur une page.
        Le mouvement reste, la couleur passe à l'encre — le terracotta est
        gardé pour ce qui appelle une action.
      */}
      <span
        aria-hidden
        className={cn(
          "h-px w-0 transition-[width] duration-700 ease-editorial group-hover:w-6",
          onInk ? "bg-on-ink-soft" : "bg-border-strong"
        )}
      />
    </div>
  )
}

/**
 * Filet horizontal qui se dessine de gauche à droite au survol de la carte.
 * Sert de soulignement à un titre ou de séparateur vivant.
 */
function DrawRule({
  className,
  tone = "light",
}: {
  className?: string
  tone?: "light" | "ink"
}) {
  return (
    <span aria-hidden className={cn("relative block h-px w-full", className)}>
      <span
        className={cn(
          "absolute inset-0",
          tone === "ink" ? "bg-border-ink" : "bg-border"
        )}
      />
      <span className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-accent transition-transform duration-700 ease-editorial group-hover:scale-x-100" />
    </span>
  )
}

/**
 * Le coin signé : symbole Nova qui apparaît en haut à droite d'une carte au
 * survol. Réservé aux cartes qui portent une intention forte.
 */
function NovaCorner({ tone = "light" }: { tone?: "light" | "ink" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute right-5 top-5 opacity-0 transition-all duration-500 ease-nova group-hover:opacity-100",
        "translate-y-1 group-hover:translate-y-0",
        tone === "ink" ? "text-accent" : "text-accent"
      )}
    >
      <NovaMark className="size-2.5" />
    </span>
  )
}

export { NovaMark, CardIndex, DrawRule, NovaCorner }
