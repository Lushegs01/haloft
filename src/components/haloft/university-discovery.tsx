"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { UniversityCard } from "@/data/marketplace";

export function UniversityDiscovery({
  universities,
  source,
}: {
  universities: UniversityCard[];
  source: "live" | "sample";
}) {
  const [query, setQuery] = useState("");
  const inputId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter((u) =>
      `${u.name} ${u.shortName} ${u.city} ${u.state}`.toLowerCase().includes(q)
    );
  }, [query, universities]);

  const liveCount = universities.filter((u) => u.status === "live").length;

  return (
    <section className="chapter bg-[var(--paper-sage)]" id="universities">
      <div className="shell">
        <div className="grid grid-cols-12 gap-y-10 lg:gap-x-12">
          <div className="col-span-12 lg:col-span-5">
            <p className="label label-rule max-w-[16rem]">Campus first</p>
            <h2 className="mt-6 display-2 max-w-[12ch] text-ink">
              Start with your university.
            </h2>
            <p className="lede mt-6">
              Every housing search begins with where you study. Pick a campus
              and Haloft only shows you what sits around it.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <label htmlFor={inputId} className="sr-only">
              Search your university
            </label>
            <div className="flex h-[62px] items-center gap-3 rounded-[14px] border border-[var(--line-strong)] bg-card px-5 transition-colors focus-within:border-[var(--teal-deep)]">
              <Search className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                id={inputId}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your university"
                autoComplete="off"
                className="h-full w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted-foreground/80"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="shrink-0 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>

            <p className="mt-3 text-[12.5px] text-muted-foreground">
              {source === "sample"
                ? "Campus list shown for demonstration while the catalogue is set up."
                : `${liveCount} campus${liveCount === 1 ? "" : "es"} live · more opening each term`}
            </p>

            <ul className="mt-8 grid grid-cols-1 border-t border-[var(--line)] sm:grid-cols-2 sm:gap-x-10">
              {results.map((uni) => {
                const isLive = uni.status === "live";
                const inner = (
                  <>
                    <div className="min-w-0">
                      <p className="flex items-baseline gap-2.5">
                        <span className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                          {uni.shortName}
                        </span>
                        <span className="truncate text-[12.5px] text-muted-foreground">
                          {uni.city}
                        </span>
                      </p>
                      <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
                        {uni.name}
                      </p>
                    </div>
                    {isLive ? (
                      <span className="ml-3 inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-[var(--teal-deep)]">
                        Browse
                        <ArrowRight className="size-3.5 arrow-nudge" aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="ml-3 shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Opening soon
                      </span>
                    )}
                  </>
                );

                return (
                  <li key={uni.id} className="border-b border-[var(--line)]">
                    {isLive ? (
                      <Link
                        href={`/${uni.slug}/search`}
                        className="group flex items-center justify-between py-5 transition-colors hover:text-ink"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between py-5 opacity-70">
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {results.length === 0 && (
              <p className="border-b border-[var(--line)] py-8 text-[14px] text-muted-foreground">
                No campus matches &ldquo;{query}&rdquo; yet. Haloft opens one
                university at a time — tell us where you study and we&apos;ll
                prioritise it.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
