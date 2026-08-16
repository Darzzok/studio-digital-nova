import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
  Le badge devient un surtitre éditorial : capitales espacées, filet fin,
  angles nets. C'est la signature typographique qui ouvre chaque section.
*/
const badgeVariants = cva(
  // Pas de `whitespace-nowrap` : les capitales espacées élargissent le libellé
  // d'environ un quart, un surtitre long doit pouvoir passer à la ligne.
  "inline-flex w-fit shrink-0 items-center gap-2 rounded-sm px-2.5 py-1.5 text-center text-eyebrow uppercase [&>svg]:size-3.5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Surtitre par défaut — encre sur papier teinté, filet discret. */
        primary: "border border-border-strong bg-surface-sunken text-text",
        /** Filet seul, texte minéral — le plus léger. */
        outline: "border border-border-strong bg-transparent text-text-secondary",
        /** Accent terracotta — réservé aux mises en avant rares. */
        accent: "border border-accent/40 bg-accent/8 text-accent-strong",
        /** Sur aplat d'encre. */
        ink: "border border-border-ink bg-white/8 text-on-ink",
        success: "border border-success/25 bg-success/10 text-success",
        warning: "border border-warning/25 bg-warning/10 text-warning",
        error: "border border-error/25 bg-error/10 text-error",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
