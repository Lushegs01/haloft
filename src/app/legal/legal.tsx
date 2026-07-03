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
    <header className="mb-10">
      <h1
        className="text-3xl lg:text-4xl font-extrabold text-foreground mb-2"
        style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
      >
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
      <div className="mt-4 rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-sm text-muted-foreground">
        This is a plain-language summary provided in good faith. It is not
        legal advice and should be reviewed by a qualified legal professional
        before launch.
      </div>
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
    <section className="mb-8">
      <h2 className="text-xl font-bold text-foreground mb-3">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export const CONTACT_EMAIL = "support@haloft.homes";
