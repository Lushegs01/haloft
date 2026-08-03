import { Clock3 } from "lucide-react";
import type { ListingCard } from "@/data/marketplace";
import { PropertyGrid } from "./property-grid";

export function FeaturedSection({
  listings,
  source,
  campusSlug,
}: {
  listings: ListingCard[];
  source: "live" | "sample";
  campusSlug?: string;
}) {
  const featured = listings.slice(0, 6);

  return (
    <section id="listings" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow text-primary">Fresh listings</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Homes near campus, verified and priced straight
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Real properties, real walk-times, real prices. If a room is not
              available, you&apos;ll hear it from us — not find out after you pay.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4 text-teal-ink" aria-hidden="true" />
            Updated as landlords list and rooms book
          </div>
        </div>

        <div className="mt-12">
          <PropertyGrid listings={featured} source={source} campusSlug={campusSlug} />
        </div>
      </div>
    </section>
  );
}
