import { ReceiptText, LockKeyhole, FileCheck2 } from "lucide-react";

const ROWS = [
  { label: "Rent — exactly what the landlord quoted", note: "Verified at listing time", icon: ReceiptText },
  { label: "Deposit — one month, stated upfront", note: "Never a surprise on arrival day", icon: LockKeyhole },
  { label: "Fees — shown before you pay, if any", note: "No 'management fee' ambushes", icon: FileCheck2 },
];

export function PriceBreakdown() {
  return (
    <section className="bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl border border-border bg-white p-8 shadow-premium">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <p className="font-display text-lg font-bold text-foreground">
                  Ayo&apos;s Lodge — Room 14
                </p>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">
                  Self-contained
                </span>
              </div>

              <dl className="space-y-4 pt-6 text-sm">
                {[
                  { k: "Monthly rent", v: "₦45,000" },
                  { k: "Deposit (1 month)", v: "₦45,000" },
                  { k: "Key & caution fee", v: "₦10,000 — included in the listing" },
                  { k: "Management fee", v: "None — this property has none" },
                ].map((r) => (
                  <div key={r.k} className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">{r.k}</dt>
                    <dd className="text-right font-bold text-foreground">{r.v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 rounded-2xl bg-teal-ink/5 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-ink">
                  Year one, all-in
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold text-foreground">
                  ₦595,000
                  <span className="text-sm font-medium text-muted-foreground">/year</span>
                </p>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Example breakdown. Every Haloft listing shows its full cost
                structure before you request a booking.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="eyebrow text-primary">Radical price transparency</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Know the full cost before you pay a naira
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Off-platform, the total price is a mystery that gets solved in
              your favour — theirs. On Haloft, every fee is listed on the
              property page and included in the total you see.
            </p>

            <ul className="mt-8 space-y-5">
              {ROWS.map((r) => (
                <li key={r.label} className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-coral-ink shadow-sm ring-1 ring-border">
                    <r.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{r.label}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{r.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
