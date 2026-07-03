/**
 * HaloftLogo — renders the real Haloft brand mark.
 *
 * Variants:
 *  - "icon"    : icon mark only (arc + chevron + dot)
 *  - "full"    : icon + "Haloft" wordmark side-by-side
 *  - "stacked" : icon above wordmark (auth pages / splash)
 *
 * The icon colours match the actual logo:
 *   navy  #1e3a6e  (left of arc + chevron)
 *   teal  #3db8a3  (right of arc)
 *   dot   #e86530  (orange accent)
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
  const iconWidth = size;
  const iconHeight = size;

  const IconMark = (
    <svg
      width={iconWidth}
      height={iconHeight}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="haloftArc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a6e" />
          <stop offset="100%" stopColor="#3db8a3" />
        </linearGradient>
      </defs>
      {/* Arc — navy to teal gradient, open at bottom */}
      <path
        d="M 38,120 A 62,62 0 1,1 162,120"
        stroke="url(#haloftArc)"
        strokeWidth="16"
        strokeLinecap="round"
      />
      {/* Chevron / house mark in navy */}
      <path
        d="M 46,116 L 100,62 L 154,116"
        stroke="#1e3a6e"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Orange accent dot */}
      <circle cx="100" cy="62" r="10" fill="#e86530" />
    </svg>
  );

  const WordMark = (
    <span
      className="font-bold tracking-tight select-none"
      style={{
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontSize: size * 0.65,
        color: textColor,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}
    >
      Haloft
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
