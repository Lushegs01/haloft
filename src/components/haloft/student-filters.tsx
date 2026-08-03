import { SlidersHorizontal, Footprints, BadgeDollarSign, Users } from "lucide-react";

const FILTERS = [
  { icon: SlidersHorizontal, title: "Property type", body: "Hostel, self-contained, studio, single room, shared flat." },
  { icon: Footprints, title: "Walk-time", body: "Under 10, 20 or 30 minutes to the campus gate." },
  { icon: BadgeDollarSign, title: "Monthly budget", body: "Slide to your number — no hidden extras later." },
  { icon: Users, title: "Amenities that matter", body: "Water, power, security, Wi-Fi, ensuite, furnished." },
];

export function StudentFilters() {
  return (
    <section className="bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="eyebrow text-primary">Search that thinks like you</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Filters for the questions you actually ask
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              You don&apos;t ask “what&apos;s available?” — you ask “what&apos;s under
              ₦40k, with power, and not a 40-minute trek?” Haloft&apos;s search is
              built around that.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FILTERS.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-white p-6 card-hover">
                <f.icon className="size-5.5 text-teal-ink" aria-hidden="true" />
                <h3 className="mt-3 font-display text-[15px] font-bold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
