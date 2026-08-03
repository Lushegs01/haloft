import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ListingCard } from "@/data/marketplace";
import { PropertyCard } from "./property-card";

export function PropertyGrid({
  listings,
  source,
  campusSlug,
}: {
  listings: ListingCard[];
  source: "live" | "sample";
  campusSlug?: string;
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <PropertyCard key={l.id} listing={l} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        {source === "sample" && (
          <p className="text-xs text-muted-foreground">
            Preview cards — live listings load from each campus catalogue.
          </p>
        )}
        <Link
          href={campusSlug ? `/${campusSlug}/search` : "/#universities"}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-bold text-foreground transition-all hover:border-primary/40 hover:text-primary"
        >
          Browse all listings
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
