/**
 * Roofline — Haloft's signature glyph, taken from the logo geometry:
 * the roof chevron with the orange keystone dot at its apex. Used as a
 * structural marker (eyebrows, connectors, underlines), not decoration.
 */
export function Roofline({
  width = 40,
  stroke = "var(--logo-navy)",
  dot = "var(--logo-orange)",
  strokeWidth = 2.5,
  flat = false,
  className = "",
}: {
  width?: number;
  stroke?: string;
  dot?: string;
  strokeWidth?: number;
  /** Wide, low-pitch variant for underlining text */
  flat?: boolean;
  className?: string;
}) {
  if (flat) {
    const height = Math.round(width * 0.14);
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
      >
        <path
          d="M 3 12 L 50 3 L 97 12"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="3" r="2.4" fill={dot} />
      </svg>
    );
  }

  const height = Math.round(width * 0.45);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M 2 16 L 20 3 L 38 16"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="3" r="2.6" fill={dot} />
    </svg>
  );
}
