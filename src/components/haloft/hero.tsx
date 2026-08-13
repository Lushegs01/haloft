import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Footprints } from "lucide-react";
import type { ListingCard, UniversityCard } from "@/data/marketplace";
import { HeroSearch } from "./hero-search";
import { Facade } from "./facade";
import { LinesIn, Reveal, MaskReveal } from "./motion";
import { formatNaira } from "./format";

export function Hero({
  universities,
  featured,
}: {
  universities: UniversityCard[];
  /** The listing whose photograph anchors the hero, when one exists. */
  featured?: ListingCard;
}) {
  const liveCount = universities.filter((u) => u.status === "live").length;

  return (
    <section className="relative pb-14 pt-8 sm:pt-10 lg:pb-24 lg:pt-12">
      {/* A single quiet architectural rule behind the image column */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 hidden h-[520px] w-[42%] rule-grid opacity-40 [mask-image:linear-gradient(to_bottom_left,black,transparent_68%)] lg:block"
      />

      <div className="shell relative">
        <div className="grid grid-cols-12 items-start gap-y-12 lg:gap-x-10">
          {/* ── Statement ─────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <p className="label label-rule max-w-[22rem]">
                Student housing, without the chaos
              </p>
            </Reveal>

            <h1 className="mt-7 display-1 text-ink">
              <LinesIn
                lines={[
                  "A better place",
                  "to find your",
                  <>
                    next{" "}
                    <span className="editorial font-normal text-[var(--teal-deep)]">
                      space
                    </span>
                    .
                  </>,
                ]}
                lineClassName="pb-[0.06em]"
              />
            </h1>

            <Reveal delay={0.18}>
              <p className="lede mt-7 max-w-[34rem]">
                Discover student-friendly rooms, hostels and apartments around
                your university — with clearer information, better options and
                fewer middlemen.
              </p>
            </Reveal>

            <Reveal delay={0.26}>
              <HeroSearch universities={universities} className="mt-9" />
            </Reveal>

            <Reveal delay={0.32}>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/#for-owners"
                  className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-ink underline decoration-[var(--line-strong)] decoration-1 underline-offset-[6px] transition-colors hover:decoration-[var(--teal-deep)]"
                >
                  List a property
                  <ArrowRight className="size-3.5 arrow-nudge" aria-hidden="true" />
                </Link>
                <p className="text-[13px] text-muted-foreground">
                  {liveCount > 0
                    ? `${liveCount} ${liveCount === 1 ? "campus" : "campuses"} live today. More opening each term.`
                    : "New campuses opening each term."}
                </p>
              </div>
            </Reveal>
          </div>

          {/* ── The place itself ──────────────────────────── */}
          <div className="col-span-12 lg:col-span-5">
            <div className="relative mx-auto w-full max-w-[30rem] lg:ml-auto lg:mr-0 lg:max-w-none">
              <MaskReveal delay={0.1}>
                <figure className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-[var(--paper-warm)] sm:aspect-[16/11] lg:aspect-[5/6]">
                  {featured?.imageUrl ? (
                    <Image
                      src={featured.imageUrl}
                      alt={`${featured.title}, ${featured.neighbourhood}`}
                      fill
                      priority
                      sizes="(max-width: 1024px) 92vw, 42vw"
                      className="object-cover"
                    />
                  ) : (
                    <Facade
                      variant="block"
                      priority
                      sizes="(max-width: 1024px) 92vw, 42vw"
                    />
                  )}

                  <figcaption className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[rgba(17,28,39,0.72)] px-3 py-1.5 text-[11.5px] font-medium text-white backdrop-blur-[2px]">
                    <BadgeCheck className="size-3.5 text-[#7fd4c6]" aria-hidden="true" />
                    {featured?.verified ? "Verified listing" : "Verification in progress"}
                  </figcaption>
                </figure>
              </MaskReveal>

              {/* Overlapping listing preview — one overlay, deliberately placed */}
              {featured && (
                <Reveal
                  delay={0.5}
                  y={20}
                  className="relative -mt-12 ml-1 w-[min(20rem,88%)] sm:-mt-14 lg:absolute lg:-bottom-10 lg:-left-12 lg:mt-0 lg:w-[18.5rem] xl:-left-16"
                >
                  <div className="rounded-[14px] border border-[var(--line)] bg-card p-4 shadow-lifted">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-ink">
                          {featured.title}
                        </p>
                        <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                          {featured.neighbourhood}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-[14px] font-semibold text-ink tabular">
                        {formatNaira(featured.pricePerMonth)}
                        <span className="block text-[11px] font-normal text-muted-foreground">
                          per month
                        </span>
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-3 border-t border-[var(--line)] pt-3 text-[12px] text-muted-foreground">
                      {featured.walkMinutes > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <Footprints className="size-3.5 text-[var(--teal-deep)]" aria-hidden="true" />
                          {featured.walkMinutes} min walk
                        </span>
                      )}
                      <span className="ml-auto text-[11px] uppercase tracking-[0.12em]">
                        {featured.source === "sample" ? "Sample" : "Available"}
                      </span>
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
