import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-3xl border border-border bg-surface p-8 shadow-sm transition-transform duration-150 ease-nova hover:-translate-y-1.5",
        className
      )}
      {...props}
    />
  )
}

export { Card }
