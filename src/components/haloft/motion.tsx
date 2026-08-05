import type { CSSProperties, ReactNode } from "react";

/**
 * Entrance primitives.
 *
 * These are Server Components. They emit a `data-reveal` attribute and a
 * delay custom property; one small client observer (see reveal-observer)
 * adds `is-in` when the element comes into view, and CSS does the rest.
 * Nothing here hydrates, and the animation runs on the compositor.
 *
 * Visibility is never gated on script: the hidden state lives behind a
 * `.js-reveal` class set on <html> before first paint, so if JS never
 * arrives the content is simply there.
 */

type Tag = "div" | "section" | "li" | "article" | "figure" | "header" | "ul" | "ol";

function delayStyle(delay: number, y?: number): CSSProperties {
  const style: Record<string, string> = {};
  if (delay) style["--reveal-delay"] = `${Math.round(delay * 1000)}ms`;
  if (y !== undefined) style["--reveal-y"] = `${y}px`;
  return style as CSSProperties;
}

export function Reveal({
  children,
  delay = 0,
  y,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  /** Seconds, to match how the sections were authored. */
  delay?: number;
  y?: number;
  className?: string;
  as?: Tag;
}) {
  return (
    <Component data-reveal="" className={className} style={delayStyle(delay, y)}>
      {children}
    </Component>
  );
}

/**
 * A group whose children arrive in sequence. The stagger is expressed as
 * a per-child delay so the whole group still needs only one observer.
 */
export function Stagger({
  children,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Seconds between children. Applied by StaggerItem via its index. */
  step?: number;
  as?: Tag;
}) {
  return <Component className={className}>{children}</Component>;
}

export function StaggerItem({
  children,
  className,
  index = 0,
  step = 0.07,
  y,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Position in the group — drives the delay. */
  index?: number;
  step?: number;
  y?: number;
  as?: Tag;
}) {
  return (
    <Component
      data-reveal=""
      className={className}
      style={delayStyle(index * step, y)}
    >
      {children}
    </Component>
  );
}

export function MaskReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div data-reveal="mask" className={className} style={delayStyle(delay)}>
      {children}
    </div>
  );
}

/**
 * Display headline that arrives line by line. Each entry is its own line,
 * so where the headline breaks stays a design decision rather than a
 * consequence of the container width.
 */
export function LinesIn({
  lines,
  className,
  lineClassName,
  delay = 0,
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
}) {
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className={`reveal-line ${lineClassName ?? ""}`}>
          <span style={delayStyle(delay + i * 0.075)}>{line}</span>
        </span>
      ))}
    </span>
  );
}
