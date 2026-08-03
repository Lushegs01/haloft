import {
  CheckCircle2,
  BedDouble,
  CalendarCheck2,
  ShieldCheck,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

export function PropertyDetailPreview() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center text-teal-ink">The property page</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything a listing shows — and everything a scam hides
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Photos, room options, amenities, walk-time, and a transparent price
            breakdown — all in one page, before you commit to anything.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-teal-ink">
              <div className="absolute inset-0 bg-dots-light opacity-40" aria-hidden="true" />
              <div className="absolute inset-0 flex items-center justify-center gap-3 text-white/60">
                <BedDouble className="size-8" aria-hidden="true" />
              </div>
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-sm">
                <BadgeCheck className="size-4 text-teal-ink" aria-hidden="true" />
                Verified by Haloft
              </span>
              <span className="absolute bottom-4 right-4 rounded-full bg-navy/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                ~17 min walk to campus
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Water supply", ok: true },
                { label: "Electricity", ok: true },
                { label: "24/7 security", ok: true },
                { label: "Ensuite bathroom", ok: true },
                { label: "Furnished", ok: true },
                { label: "Wi-Fi", ok: false },
              ].map((a) => (
                <div
                  key={a.label}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                    a.ok
                      ? "border-teal-ink/25 bg-teal-ink/5 text-teal-ink"
                      : "border-border bg-white text-muted-foreground"
                  }`}
                >
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="flex flex-col rounded-3xl border border-border bg-white p-6 shadow-premium">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">
                Hostel
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                6 rooms available
              </span>
            </div>

            <h3 className="mt-4 font-display text-xl font-bold text-foreground">
              Ayo&apos;s Lodge — Room 14
            </h3>

            <dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
              {[
                { dt: "Monthly rent", dd: "₦45,000" },
                { dt: "Deposit (1 month)", dd: "₦45,000" },
                { dt: "Payment method", dd: "Paystack — card or transfer" },
                { dt: "Booking", dd: "Free to request, pay after verification" },
              ].map((r) => (
                <div key={r.dt} className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">{r.dt}</dt>
                  <dd className="text-right font-semibold text-foreground">{r.dd}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-teal-ink/5 px-3 py-2.5 text-xs text-teal-ink">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              Designed to reduce housing fraud — payment only after availability is confirmed.
            </div>

            <button
              type="button"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
            >
              <CalendarCheck2 className="size-4" aria-hidden="true" />
              Request this room
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Example preview — the live property page shows current rooms and prices.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
