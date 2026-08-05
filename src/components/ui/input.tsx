import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[10px] border border-[var(--line-strong)] bg-card px-3.5 py-2 text-base text-foreground transition-colors outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground/80",
        "focus-visible:border-[var(--teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--teal-deep)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
        "aria-invalid:border-destructive aria-invalid:outline-destructive",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
