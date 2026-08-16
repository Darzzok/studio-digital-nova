import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
  Boutons à angles nets, en encre plutôt qu'en couleur d'accent : le terracotta
  reste rare. Le retour au clic (translate + réduction) remplace l'ombre
  grossissante — plus sobre, plus tactile.
*/
const buttonVariants = cva(
  "group/btn inline-flex h-13 w-fit shrink-0 items-center justify-center gap-2.5 rounded-lg px-7 text-small font-semibold tracking-[0.01em] whitespace-nowrap transition-[transform,background-color,box-shadow,border-color,color] duration-200 ease-nova outline-none select-none hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-45 disabled:hover:translate-y-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Encre pleine — l'action principale du site. */
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md",
        /** Papier teinté — action de second rang sur fond clair. */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-border",
        /** Filet seul — la variante la plus discrète, l'accent au survol. */
        outline:
          "border border-border-strong bg-transparent text-text hover:border-accent hover:text-accent-strong",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

function Button({
  className,
  variant = "primary",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
