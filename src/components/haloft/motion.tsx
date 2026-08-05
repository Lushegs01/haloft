"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Entrance primitives.
 *
 * Motion here does one job: telling the eye what arrived and in what
 * order. Everything moves a short distance, once, and the layout is
 * designed to read perfectly with motion switched off.
 *
 * Note on reduced motion: the *visibility* of content is never gated on
 * the reduced-motion flag. `useReducedMotion` resolves on the client, so
 * branching the `initial` state on it would ship server HTML with
 * `opacity: 0` that never animates back for those users. Instead every
 * element keeps the same enter/exit states and reduced motion collapses
 * the duration to zero.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "figure" | "header";
}) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05, margin: "0px 0px -6% 0px" }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 0.62, ease: EASE, delay }
      }
    >
      {children}
    </Component>
  );
}

/** Wraps a group whose children should arrive in sequence. */
export function Stagger({
  children,
  className,
  step = 0.07,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  as?: "div" | "ul" | "section";
}) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  const variants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduced ? 0 : step,
        delayChildren: reduced ? 0 : 0.04,
      },
    },
  };

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.02, margin: "0px 0px -6% 0px" }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  y = 14,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  as?: "div" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  const variants: Variants = {
    hidden: { opacity: 0, y },
    show: {
      opacity: 1,
      y: 0,
      transition: reduced ? { duration: 0 } : { duration: 0.6, ease: EASE },
    },
  };

  return (
    <Component className={className} variants={variants}>
      {children}
    </Component>
  );
}

/**
 * Masked image reveal — the crop opens rather than the image fading in,
 * which reads as photography being placed rather than a box appearing.
 */
export function MaskReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(12% 0% 0% 0%)", opacity: 0 }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
      viewport={{ once: true, amount: 0.05, margin: "0px 0px -6% 0px" }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.9, ease: EASE, delay }
      }
    >
      {children}
    </motion.div>
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
  const reduced = useReducedMotion();

  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className={`block overflow-hidden ${lineClassName ?? ""}`}>
          <motion.span
            className="block"
            initial={{ y: "108%" }}
            animate={{ y: "0%" }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.85, ease: EASE, delay: delay + i * 0.075 }
            }
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
