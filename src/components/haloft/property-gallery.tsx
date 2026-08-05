import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ListingCard } from "@/data/marketplace";
import { PropertyCard } from "./property-card";
import { Reveal, StaggerItem, Stagger } from "./motion";

/* The grid deliberately breaks rhythm: spans and image ratios change
   down the page so the eye moves rather than scanning a tiled sheet. */
const LAYOUT = [
  { span: "lg:col-span-5", ratio: "portrait", offset: "", emphasis: true },
  { span: "lg:col-span-4", ratio: "landscape", offset: "lg:mt-16", emphasis: false },
  { span: "lg:col-span-3", ratio: "tall", offset: "lg:mt-6", emphasis: false },
  { span: "lg:col-span-4", ratio: "landscape", offset: "", emphasis: false },
  { span: "lg:col-span-3", ratio: "tall", offset: "lg:mt-12", emphasis: false },
  { span: "lg:col-span-5", ratio: "landscape", offset: "lg:mt-3", emphasis: false },
] as const;

export function PropertyGallery({
  listings,
  source,
  campusSlug,
}: {
  listings: ListingCard[];
  source: "live" | "sample";
  campusSlug: string;
}) {
  if (listings.length === 0) return null;

  return (
    <section className="chapter bg-[var(--paper)]" id="homes">
      <div className="shell">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal>
              <p className="label label-rule max-w-[15rem]">Homes on Haloft</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 display-2 max-w-[16ch] text-ink">
                Places students would actually want to live.
              </h2>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="shrink-0">
            <Link
              href={`/${campusSlug}/search`}
              className="group inline-flex items-center gap-2 border-b border-[var(--line-strong)] pb-1.5 text-[14px] font-medium text-ink transition-colors hover:border-[var(--teal-deep)]"
            >
              Browse every home
              <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        {source === "sample" && (
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-[46ch] text-[13px] leading-relaxed text-muted-foreground">
              These are sample homes used to show the format while the live
              catalogue for this campus is being built. Nothing below is
              offered for booking.
            </p>
          </Reveal>
        )}

        {/* One DOM, two layouts: a snapping rail on small screens, an
            asymmetric 12-column composition from lg up. */}
        <Stagger
          className="rail scrollbar-hide -mx-5 mt-12 flex gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:mt-16 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8 lg:gap-y-16 lg:overflow-x-visible lg:px-0 lg:pb-0"
          step={0.06}
        >
          {listings.slice(0, 6).map((listing, i) => {
            const layout = LAYOUT[i % LAYOUT.length];
            return (
              <StaggerItem
                key={listing.id}
                as="div"
                className={`w-[76vw] max-w-[21rem] shrink-0 sm:w-[52vw] lg:w-auto lg:max-w-none lg:shrink ${layout.span} ${layout.offset}`}
              >
                <PropertyCard
                  listing={listing}
                  ratio={layout.ratio}
                  emphasis={layout.emphasis}
                  index={i}
                />
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
