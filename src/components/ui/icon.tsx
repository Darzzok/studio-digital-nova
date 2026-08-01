import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface IconProps extends React.ComponentProps<"svg"> {
  icon: LucideIcon
}

function Icon({ icon: LucideIconComponent, className, ...props }: IconProps) {
  return (
    <LucideIconComponent
      data-slot="icon"
      className={cn("size-5 shrink-0 text-current", className)}
      {...props}
    />
  )
}

export { Icon }
export type { IconProps }
