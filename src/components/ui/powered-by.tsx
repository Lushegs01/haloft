import { PLATFORM_NAME, PLATFORM_URL } from "@/lib/constants";

/**
 * Platform credit — "Powered by CampOS".
 *
 * Sits wherever the product signs its own name: beside the copyright in the
 * site footer, at the foot of the auth panel, and under the admin sidebar.
 * Three surfaces, one component, so the wording and the weighting never
 * drift apart between them.
 *
 * It carries no colour or size of its own. Callers pass those through
 * `className` so the credit matches whatever micro-type it sits next to —
 * the footer's 12.5px, the auth panel's 12px, the sidebar's 10.5px — and
 * inherits that surface's foreground rather than assuming a dark
 * background. What the component does own is the relationship between the
 * two halves: "Powered by" recedes, the platform name carries the weight,
 * because the name is the part worth reading.
 *
 * Becomes a link the moment PLATFORM_URL is set, and stays plain text
 * until then.
 */
export function PoweredBy({ className = "" }: { className?: string }) {
  const credit = (
    <>
      <span className="opacity-65">Powered by</span>{" "}
      <span className="font-medium">{PLATFORM_NAME}</span>
    </>
  );

  if (!PLATFORM_URL) {
    return <p className={className}>{credit}</p>;
  }

  return (
    <a
      href={PLATFORM_URL}
      target="_blank"
      rel="noreferrer noopener"
      className={`transition-opacity hover:opacity-100 ${className}`}
    >
      {credit}
    </a>
  );
}
