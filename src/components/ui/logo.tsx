/**
 * Haloft identity.
 *
 * The mark is the brand geometry drawn as vector rather than raster: an
 * open arch (the halo) with the roofline chevron and its orange keystone
 * dot at the apex. Drawing it inline keeps it crisp at every size, lets
 * it recolour for dark surfaces, and removes an image request from every
 * page.
 *
 * Because the gradient lives in <defs>, each mark on a page needs its own
 * id. Callers that render more than one logo in a document pass a
 * distinct `markId`.
 */

type LogoTone = "brand" | "light" | "ink";

interface HaloftMarkProps {
  size?: number;
  tone?: LogoTone;
  /** Unique per document — see note above. */
  markId?: string;
  className?: string;
}

export function HaloftMark({
  size = 32,
  tone = "brand",
  markId = "haloft-mark",
  className = "",
}: HaloftMarkProps) {
  const gradientId = `${markId}-arch`;
  const stroke = tone === "brand" ? `url(#${gradientId})` : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="presentation"
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size, display: "block" }}
    >
      {tone === "brand" && (
        <defs>
          <linearGradient id={gradientId} x1="6" y1="88" x2="94" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#182f4d" />
            <stop offset="48%" stopColor="#1f5a6b" />
            <stop offset="100%" stopColor="#2fa694" />
          </linearGradient>
        </defs>
      )}

      {/* The arch — a circle opened at the base */}
      <path
        d="M15 78.3A45 45 0 1 1 85 78.3"
        stroke={stroke}
        strokeWidth="9.6"
        strokeLinecap="round"
      />
      {/* The roofline */}
      <path
        d="M15 78.3 50 43.6 85 78.3"
        stroke={stroke}
        strokeWidth="9.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Keystone */}
      <circle cx="50" cy="43.6" r="6.4" fill="#e86530" />
    </svg>
  );
}

interface HaloftLogoProps {
  /** "icon" = mark only, "full" = mark + wordmark, "stacked" = mark above wordmark */
  variant?: "icon" | "full" | "stacked";
  /** Height of the mark in px; the wordmark scales from it */
  size?: number;
  /** Wordmark colour. Defaults to brand navy. */
  textColor?: string;
  tone?: LogoTone;
  markId?: string;
  className?: string;
}

function Wordmark({ size, color }: { size: number; color: string }) {
  return (
    <span
      className="relative select-none font-display font-semibold"
      style={{
        fontSize: size * 0.66,
        lineHeight: 1,
        letterSpacing: "-0.035em",
        color,
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
            width: size * 0.115,
            height: size * 0.115,
            right: -(size * 0.03),
            top: -(size * 0.055),
          }}
        />
      </span>
      ft
    </span>
  );
}

export function HaloftLogo({
  variant = "full",
  size = 32,
  textColor,
  tone = "brand",
  markId = "haloft-mark",
  className = "",
}: HaloftLogoProps) {
  const wordColor =
    textColor ?? (tone === "light" ? "#ffffff" : "var(--logo-navy, #1a2a44)");
  const mark = (
    <HaloftMark size={size} tone={tone} markId={markId} />
  );

  if (variant === "icon") {
    return <span className={`inline-flex ${className}`}>{mark}</span>;
  }

  if (variant === "stacked") {
    return (
      <span className={`inline-flex flex-col items-center gap-3 ${className}`}>
        {mark}
        <Wordmark size={size} color={wordColor} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark}
      <Wordmark size={size} color={wordColor} />
    </span>
  );
}

/** Logo for dark surfaces — the mark keeps its gradient, the wordmark goes white. */
export function HaloftLogoDark({
  variant = "full",
  size = 32,
  markId = "haloft-mark-dark",
  className = "",
}: Omit<HaloftLogoProps, "textColor" | "tone">) {
  return (
    <HaloftLogo
      variant={variant}
      size={size}
      textColor="#ffffff"
      markId={markId}
      className={className}
    />
  );
}
