import { MapPin, Footprints, Building2, Landmark } from "lucide-react";

const PINS = [
  { x: "24%", y: "38%", label: "Toll Gate", note: "~17 min walk" },
  { x: "58%", y: "22%", label: "Alabata Road", note: "~26 min walk" },
  { x: "44%", y: "66%", label: "Ashe Village", note: "~11 min walk" },
  { x: "74%", y: "52%", label: "Oke-Ijebu", note: "~35 min walk" },
];

export function MapPreview() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="eyebrow text-primary">Built for campuses</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Every listing tells you how far the walk really is
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Distance is measured from the actual campus gate to the actual
              front door — not a vague “near school”. Filter by walk-time and
              budget to see only the homes that fit your day.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                { icon: Footprints, text: "Walk-time in minutes, computed per listing", color: "text-teal-ink" },
                { icon: Building2, text: "Neighbourhoods vetted for student life — water, power, security", color: "text-primary" },
                { icon: Landmark, text: "Campus landmarks you know, not GPS roulette", color: "text-coral" },
              ].map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent">
                    <f.icon className={`size-4.5 ${f.color}`} aria-hidden="true" />
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-3xl border border-border bg-[#eef1e4] p-3 shadow-premium">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <svg
                viewBox="0 0 400 300"
                preserveAspectRatio="none"
                className="absolute inset-0 size-full"
                aria-hidden="true"
              >
                <rect width="400" height="300" fill="#eef1e4" />
                <path d="M0 90 L400 110" stroke="#ffffff" strokeWidth="10" fill="none" />
                <path d="M0 200 C120 180 260 240 400 190" stroke="#ffffff" strokeWidth="12" fill="none" />
                <path d="M150 0 C160 100 140 200 170 300" stroke="#ffffff" strokeWidth="8" fill="none" />
                <path d="M260 0 C250 80 280 160 240 300" stroke="#ffffff" strokeWidth="7" fill="none" />
                <path d="M60 0 L80 300" stroke="#ffffff" strokeWidth="5" fill="none" />
                <ellipse cx="300" cy="240" rx="70" ry="45" fill="#d9e4c8" />
                <ellipse cx="90" cy="60" rx="55" ry="38" fill="#d9e4c8" />
              </svg>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="flex flex-col items-center gap-1">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-navy text-white shadow-xl ring-4 ring-white">
                    <Landmark className="size-5 text-teal" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-foreground shadow">
                    Campus gate
                  </span>
                </span>
              </div>

              {PINS.map((pin, i) => (
                <div
                  key={pin.label}
                  className="absolute flex flex-col items-center gap-1"
                  style={{ left: pin.x, top: pin.y }}
                >
                  <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground shadow">
                    <MapPin className="size-3 text-primary" aria-hidden="true" />
                    {pin.label}
                  </span>
                  <span
                    className="size-2.5 animate-ping rounded-full bg-primary/40"
                    style={{ animationDelay: `${i * 400}ms` }}
                    aria-hidden="true"
                  />
                </div>
              ))}

              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow">
                <Footprints className="size-4 text-teal-ink" aria-hidden="true" />
                <span className="text-xs font-semibold text-foreground">
                  Walk-times measured from the gate
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
