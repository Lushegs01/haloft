import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Facade } from "./facade";
import { Reveal, MaskReveal } from "./motion";

export function FinalCta({ campusSlug }: { campusSlug: string }) {
  return (
    <section className="relative bg-[var(--navy)] text-white">
      <div className="shell py-20 lg:py-28">
        <div className="grid grid-cols-12 items-center gap-y-12 lg:gap-x-12">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <h2 className="display-2 max-w-[16ch] text-white">
                Your next place might be closer than you{" "}
                <span className="editorial font-normal text-[#7fd4c6]">think</span>.
              </h2>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="mt-6 max-w-[42ch] text-[15.5px] leading-[1.65] text-white/65">
                Explore student accommodation around your university — priced,
                placed and described before you leave the house.
              </p>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href={`/${campusSlug}/search`}
                  className="group inline-flex h-14 items-center justify-center gap-2 rounded-[10px] bg-white px-7 text-[15px] font-semibold text-[var(--navy)] transition-colors hover:bg-[#f0f2ef]"
                >
                  Find a place
                  <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
                </Link>
                <Link
                  href="/#for-owners"
                  className="group inline-flex h-14 items-center justify-center gap-2 rounded-[10px] border border-white/25 px-7 text-[15px] font-medium text-white transition-colors hover:border-white/55"
                >
                  List a property
                  <ArrowUpRight className="size-4 arrow-nudge" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* The image breaks the top boundary of the band on purpose */}
          <div className="col-span-12 lg:col-span-5">
            <MaskReveal className="lg:-mt-44 xl:-mt-52">
              <figure className="relative aspect-[16/10] overflow-hidden rounded-[18px] ring-1 ring-white/10 sm:aspect-[16/9] lg:aspect-[4/5]">
                <Facade
                  variant="tower"
                  sizes="(max-width: 1024px) 92vw, 40vw"
                />
              </figure>
            </MaskReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
