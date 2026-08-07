import { BadgeCheck, Check, Flag } from "lucide-react";
import { Facade } from "./facade";
import { Reveal, MaskReveal } from "./motion";

const CHECKS = [
  "The address is real, and the building matches it.",
  "Photos are of the rooms being offered, taken on the visit.",
  "Rent and what sits on top of it are recorded with whoever manages the place.",
  "Availability is confirmed at the time of listing.",
];

export function TrustSection() {
  return (
    <section className="chapter bg-[var(--night)] text-[var(--night-foreground)]" id="trust">
      <div className="shell">
        <div className="grid grid-cols-12 gap-y-14 lg:gap-x-12">
          {/* Statement */}
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <p className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/45">
                What verified means here
                <span aria-hidden="true" className="h-px w-16 bg-white/20" />
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <h2 className="mt-7 display-2 text-white">
                Less guesswork.
                <br />
                More{" "}
                <span className="editorial font-normal text-[#7fd4c6]">confidence</span>.
              </h2>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-7 max-w-[38ch] text-[15px] leading-[1.68] text-white/65">
                Verification is a specific thing on Haloft, not a badge we hand
                out. A home carries the mark once someone from the team has
                stood in the building.
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <ul className="mt-9 space-y-4 border-t border-white/12 pt-8">
                {CHECKS.map((check) => (
                  <li key={check} className="flex items-start gap-3.5">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-[#7fd4c6]"
                      aria-hidden="true"
                    />
                    <span className="max-w-[44ch] text-[14.5px] leading-[1.6] text-white/80">
                      {check}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-9 space-y-4 border-t border-white/12 pt-8 text-[13.5px] leading-[1.65] text-white/55">
                <p className="max-w-[48ch]">
                  Homes we haven&apos;t reached yet still appear — labelled as
                  not yet verified, so the gap is visible rather than papered
                  over.
                </p>
                <p className="flex max-w-[48ch] items-start gap-3">
                  <Flag className="mt-0.5 size-4 shrink-0 text-white/40" aria-hidden="true" />
                  If something on a listing is wrong, report it. We take the
                  listing down while we check.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Evidence */}
          <div className="col-span-12 lg:col-span-6">
            <div className="relative mx-auto w-full max-w-[32rem] lg:ml-auto lg:mr-0 lg:mt-10">
              <MaskReveal delay={0.12}>
                <div className="relative aspect-[5/4] overflow-hidden rounded-[18px] sm:aspect-[4/3] lg:aspect-[5/6]">
                  <Facade
                    variant="court"
                    sizes="(max-width: 1024px) 92vw, 44vw"
                  />
                </div>
              </MaskReveal>

              <Reveal
                delay={0.34}
                className="relative -mt-14 ml-4 w-[min(21rem,90%)] sm:-mt-16 lg:absolute lg:-left-10 lg:bottom-8 lg:ml-0 lg:mt-0"
              >
                <div className="rounded-[14px] border border-[var(--line)] bg-card p-4 shadow-lifted">
                  <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <BadgeCheck className="size-3.5 text-[var(--teal-deep)]" aria-hidden="true" />
                    Verification record
                  </p>
                  <p className="mt-2.5 text-[14.5px] font-semibold text-ink">
                    Aster Studio — Camp
                  </p>
                  <ul className="mt-3 space-y-2 border-t border-[var(--line)] pt-3">
                    {["Address confirmed on site", "Photos taken on the visit", "Rent recorded with the manager"].map(
                      (line) => (
                        <li key={line} className="flex items-start gap-2.5 text-[12.5px] text-ink-soft">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--teal-deep)]" aria-hidden="true" />
                          {line}
                        </li>
                      )
                    )}
                  </ul>
                  <p className="mt-3 border-t border-[var(--line)] pt-3 text-[11px] text-muted-foreground">
                    Interface shown with sample content.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
