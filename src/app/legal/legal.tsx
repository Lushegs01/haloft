import type { ReactNode } from "react";

/**
 * Shared presentational helpers for the legal pages. These are
 * plain-language, good-faith drafts — have a Nigerian lawyer review
 * them before relying on them, especially the NDPR and refund sections.
 */

export function LegalHeader({
  title,
  updated,
}: {
  title: string;
  updated: string;
}) {
  return (
    <header className="mb-12">
      <p className="label label-rule max-w-[12rem]">Legal</p>
      <h1 className="mt-6 display-2 text-ink">{title}</h1>
      <p className="mt-3 text-[13.5px] text-muted-foreground">
        Last updated: {updated}
      </p>
      <p className="mt-6 border-l-2 border-[var(--sand-deep)]/40 pl-4 text-[13.5px] leading-[1.65] text-muted-foreground">
        This is a plain-language summary written in good faith. It is not legal
        advice, and a qualified legal professional should review it before it
        is relied on.
      </p>
    </header>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[var(--line)] py-8">
      <h2 className="display-4 text-ink">{title}</h2>
      <div className="mt-4 space-y-3.5 text-[15px] leading-[1.7] text-ink-soft">
        {children}
      </div>
    </section>
  );
}

export { CONTACT_EMAIL } from "@/lib/constants";
