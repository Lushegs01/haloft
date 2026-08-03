import { ShieldCheck, CreditCard, Star, BadgeCheck } from "lucide-react";
import type { UniversityCard } from "@/data/marketplace";
import { HeroSearch } from "./hero-search";

export function Hero({ universities }: { universities: UniversityCard[] }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-dots opacity-60" />
        <div className="orb -top-40 right-[-10%] size-[480px] bg-teal/15" />
        <div className="orb -bottom-56 left-[-12%] size-[520px] bg-primary/10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow justify-center">
            <BadgeCheck className="size-3.5 text-teal-ink" aria-hidden="true" />
            Trusted student housing for Nigerian universities
          </p>

          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Find student housing you can{" "}
            <span className="relative whitespace-nowrap text-primary">
              actually trust
              <svg
                className="absolute -bottom-2 left-0 h-3 w-full text-coral/70"
                viewBox="0 0 220 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M3 9C60 3 160 3 217 9"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            No more wandering hostels or wiring money to strangers. Haloft shows
            you verified rooms near your university, with transparent prices,
            real student reviews, and secure payments — so you can focus on your
            degree, not your landlord.
          </p>
        </div>

        <div className="mt-10">
          <HeroSearch universities={universities} />
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Verified listings",
              body: "Every home is checked before it goes live.",
              color: "text-teal-ink",
            },
            {
              icon: CreditCard,
              title: "Secure payments",
              body: "Pay with Paystack — charged only when confirmed.",
              color: "text-primary",
            },
            {
              icon: Star,
              title: "Real student reviews",
              body: "Ratings come from tenants who actually stayed.",
              color: "text-coral-ink",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white/70 p-4 backdrop-blur-sm">
              <f.icon className={`mt-0.5 size-5 shrink-0 ${f.color}`} aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-foreground">{f.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
