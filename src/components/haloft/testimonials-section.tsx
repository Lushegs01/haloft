import { MessageSquareQuote, Hourglass } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section className="bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center text-teal-ink">From students who stayed</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Reviews you can trust, because they&apos;re verified
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            We&apos;re not going to fake it: every review on Haloft is left by a
            student after a verified stay at the property. New campuses collect
            their first reviews as students move in.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-white/60 px-8 py-12 text-center"
            >
              <MessageSquareQuote className="size-8 text-border" aria-hidden="true" />
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                The first verified student reviews land here as soon as tenants
                complete their stays — no anonymous praise, no paid posts.
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">
                <Hourglass className="size-3.5" aria-hidden="true" />
                First reviews coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
