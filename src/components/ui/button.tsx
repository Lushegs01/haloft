import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Haloft buttons: medium radius (10px), generous horizontal padding,
 * a single strong fill for the primary action and restrained treatments
 * for everything else. No pills, no glow.
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal-deep)] disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] active:translate-y-px",
        outline:
          "border-[var(--line-strong)] bg-transparent text-foreground hover:border-foreground/35 hover:bg-foreground/[0.035] active:translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_7%)] active:translate-y-px",
        ghost:
          "text-foreground hover:bg-foreground/[0.05] active:translate-y-px",
        teal:
          "bg-[var(--teal-deep)] text-white hover:bg-[color-mix(in_oklab,var(--teal-deep),black_10%)] active:translate-y-px",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/16 focus-visible:outline-destructive",
        link: "h-auto rounded-none px-0 text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        xs: "h-7 gap-1 rounded-[7px] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[9px] px-3.5 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-[15px]",
        xl: "h-14 px-8 text-[15px] font-semibold",
        icon: "size-11",
        "icon-xs": "size-7 rounded-[7px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-[9px]",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
