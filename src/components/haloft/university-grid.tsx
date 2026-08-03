import Link from "next/link";
import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import type { UniversityCard } from "@/data/marketplace";

export function UniversityGrid({
  universities,
  source,
}: {
  universities: UniversityCard[];
  source: "live" | "sample";
}) {
  return (
    <section id="universities" className="bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center text-teal-ink">Find your campus</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Every university deserves better housing options
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Haloft grows campus by campus. Pick yours to see verified homes and
            neighbourhood guides nearby.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {universities.slice(0, 6).map((u) => {
            const inner = (
              <div
                className={`relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${u.gradient} p-6 text-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-[1.02]`}
              >
                <div className="absolute inset-0 bg-dots-light opacity-40" aria-hidden="true" />
                <div className="relative flex items-start justify-between">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    {u.shortName}
                  </span>
                  {u.status === "live" ? (
                    <ArrowUpRight className="size-5" aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-5" aria-hidden="true" />
                  )}
                </div>
                <div className="relative">
                  <p className="font-display text-lg font-bold leading-snug">{u.name}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85">
                    <MapPin className="size-4" aria-hidden="true" />
                    {u.city}, {u.state}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-white/70">
                    {u.homesLabel}
                  </p>
                </div>
              </div>
            );

            if (u.status === "live") {
              return (
                <Link key={u.id} href={`/${u.slug}/search`} className="group">
                  {inner}
                </Link>
              );
            }
            return (
              <div key={u.id} className="group cursor-default" aria-disabled="true">
                {inner}
              </div>
            );
          })}
        </div>

        {source === "sample" && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Sample network view — campuses appear here as they open on Haloft.
          </p>
        )}
      </div>
    </section>
  );
}
