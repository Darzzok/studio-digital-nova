import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-lg border border-input bg-surface px-4 text-body text-text placeholder:text-text-muted transition-[border-color,box-shadow] duration-200 ease-nova outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-45",
        className
      )}
      {...props}
    />
  )
}

export { Input }
