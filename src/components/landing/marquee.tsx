import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: ReactNode[];
  className?: string;
  itemClassName?: string;
  separatorClassName?: string;
  fast?: boolean;
}

function MarqueeRow({
  items,
  itemClassName,
  separatorClassName,
  hidden,
}: {
  items: ReactNode[];
  itemClassName?: string;
  separatorClassName?: string;
  hidden?: boolean;
}) {
  return (
    <span className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span key={i} className="flex shrink-0 items-center">
          <span className={cn("px-7 sm:px-10", itemClassName)}>{item}</span>
          <span
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80", separatorClassName)}
            aria-hidden="true"
          />
        </span>
      ))}
    </span>
  );
}

/**
 * Marquee — infinite horizontal ticker. Pure CSS animation (server-safe),
 * pauses on hover, and freezes for users who prefer reduced motion.
 * Content is rendered twice; the second copy is hidden from screen readers.
 */
export function Marquee({
  items,
  className,
  itemClassName,
  separatorClassName,
  fast = false,
}: MarqueeProps) {
  return (
    <div className={cn("marquee", fast && "marquee-fast", className)}>
      <div className="marquee-track">
        <MarqueeRow
          items={items}
          itemClassName={itemClassName}
          separatorClassName={separatorClassName}
        />
        <MarqueeRow
          items={items}
          itemClassName={itemClassName}
          separatorClassName={separatorClassName}
          hidden
        />
      </div>
    </div>
  );
}
