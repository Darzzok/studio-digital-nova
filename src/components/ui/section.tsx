import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Container } from "@/components/ui/container"

/* Le rythme vertical est fluide et centralisé dans `--section-y*`. */
const sectionVariants = cva("w-full", {
  variants: {
    spacing: {
      sm: "section-y-sm",
      default: "section-y",
      lg: "section-y-lg",
    },
  },
  defaultVariants: {
    spacing: "default",
  },
})

function Section({
  className,
  spacing,
  container = true,
  children,
  ...props
}: React.ComponentProps<"section"> &
  VariantProps<typeof sectionVariants> & { container?: boolean }) {
  return (
    <section
      data-slot="section"
      className={cn(sectionVariants({ spacing, className }))}
      {...props}
    >
      {container ? <Container>{children}</Container> : children}
    </section>
  )
}

export { Section, sectionVariants }
