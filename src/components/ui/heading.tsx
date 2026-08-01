import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const headingVariants = cva("font-heading text-text", {
  variants: {
    variant: {
      display: "text-display",
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
    },
  },
  defaultVariants: {
    variant: "h1",
  },
})

const defaultTag = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
} as const

type HeadingVariant = keyof typeof defaultTag

function Heading({
  className,
  variant = "h1",
  as,
  ...props
}: React.ComponentProps<"h1"> &
  VariantProps<typeof headingVariants> & { as?: React.ElementType }) {
  const Tag = as ?? defaultTag[(variant ?? "h1") as HeadingVariant]

  return (
    <Tag
      data-slot="heading"
      className={cn(headingVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Heading, headingVariants }
