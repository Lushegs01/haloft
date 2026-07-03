import Image from "next/image";

/**
 * HaloftLogo — renders the real Haloft brand mark (public/logo-mark.png,
 * extracted from the original brand JPG with the background removed).
 *
 * Variants:
 *  - "icon"    : icon mark only (ring + roofline chevron + orange dot)
 *  - "full"    : icon + "Haloft" wordmark side-by-side
 *  - "stacked" : icon above wordmark (auth pages / splash)
 *
 * Brand colours: navy #1e3a6e, teal #3db8a3, orange #e86530.
 */

interface HaloftLogoProps {
  variant?: "icon" | "full" | "stacked";
  /** Height of the icon mark in px (width scales automatically) */
  size?: number;
  /** Override wordmark colour; defaults to navy */
  textColor?: string;
  className?: string;
}

export function HaloftLogo({
  variant = "full",
  size = 32,
  textColor = "#1e3a6e",
  className = "",
}: HaloftLogoProps) {
  const IconMark = (
    <Image
      src="/logo-mark.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="select-none"
      style={{ width: size, height: size }}
    />
  );

  // Wordmark with the brand's orange dot above the "o"
  const WordMark = (
    <span
      className="font-bold tracking-tight select-none"
      style={{
        fontFamily: "var(--font-logo), var(--font-inter), system-ui, sans-serif",
        fontSize: size * 0.62,
        color: textColor,
        letterSpacing: "-0.01em",
        lineHeight: 1,
      }}
    >
      Hal
      <span className="relative inline-block">
        o
        <span
          aria-hidden="true"
          className="absolute rounded-full"
          style={{
            background: "#e86530",
            width: size * 0.1,
            height: size * 0.1,
            left: "50%",
            transform: "translateX(-50%)",
            top: -(size * 0.08),
          }}
        />
      </span>
      ft
    </span>
  );

  if (variant === "icon") {
    return <div className={className}>{IconMark}</div>;
  }

  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        {IconMark}
        {WordMark}
      </div>
    );
  }

  // "full" — side by side
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {IconMark}
      {WordMark}
    </div>
  );
}

/**
 * Logo for dark backgrounds (auth left panel, admin sidebar).
 * Wordmark renders in white; icon colours unchanged.
 */
export function HaloftLogoDark({
  variant = "full",
  size = 32,
  className = "",
}: Omit<HaloftLogoProps, "textColor">) {
  return (
    <HaloftLogo
      variant={variant}
      size={size}
      textColor="#ffffff"
      className={className}
    />
  );
}
