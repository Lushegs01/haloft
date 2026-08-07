import { ArrowUpRight } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/constants";
import { Facade } from "./facade";
import { Reveal } from "./motion";

const PROCESS = [
  {
    n: "01",
    title: "Tell us about the place",
    body: "Where it is, how many rooms are free, what you charge and what's included.",
  },
  {
    n: "02",
    title: "We come and see it",
    body: "Someone from the team visits, confirms the address, and photographs the rooms as they are.",
  },
  {
    n: "03",
    title: "It goes live to students",
    body: "Your listing appears in searches around that campus, with the details already recorded.",
  },
];

export function OwnerSection() {
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Listing a property on Haloft"
  )}`;

  return (
    <section className="chapter bg-[var(--sand-tint)]" id="for-owners">
      <div className="shell">
        <div className="grid grid-cols-12 gap-y-12 lg:gap-x-12">
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <p className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--sand-deep)]">
                For property owners
                <span aria-hidden="true" className="h-px w-14 bg-[rgba(157,85,24,0.3)]" />
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <h2 className="mt-7 display-2 max-w-[15ch] text-ink">
                Have a place students should know about?
              </h2>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-7 max-w-[42ch] text-[15px] leading-[1.68] text-ink-soft">
                Put your property in front of students actively searching
                around your university — instead of waiting for word to travel
                through a group chat.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href={mailto}
                  className="group inline-flex h-13 items-center gap-2 rounded-[10px] bg-[var(--navy)] px-6 text-[14.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                >
                  List your property
                  <ArrowUpRight className="size-4 arrow-nudge" aria-hidden="true" />
                </a>
                <p className="max-w-[24ch] text-[12.5px] leading-[1.55] text-[var(--sand-deep)]">
                  For landlords, hostel managers and property partners.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.22}>
              <figure className="relative mt-12 hidden aspect-[16/7] overflow-hidden rounded-[16px] lg:block">
                <Facade variant="terrace" sizes="46vw" />
              </figure>
            </Reveal>
          </div>

          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <Reveal delay={0.1}>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--sand-deep)]">
                How a listing gets on Haloft
              </p>
            </Reveal>

            <ol className="mt-6 border-t border-[rgba(157,85,24,0.22)]">
              {PROCESS.map((step, i) => (
                <Reveal
                  as="li"
                  key={step.n}
                  delay={0.14 + i * 0.06}
                  className="border-b border-[rgba(157,85,24,0.22)] py-6"
                >
                  <div className="flex gap-5">
                    <span className="shrink-0 pt-0.5 text-[12.5px] font-semibold text-[var(--sand-deep)] tabular">
                      {step.n}
                    </span>
                    <div>
                      <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-2 max-w-[34ch] text-[13.5px] leading-[1.62] text-ink-soft/80">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>

            <Reveal delay={0.34}>
              <p className="mt-6 max-w-[36ch] text-[12.5px] leading-[1.6] text-[var(--sand-deep)]">
                Haloft sources and manages every listing directly, so there is
                no self-service upload — a person handles yours.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
