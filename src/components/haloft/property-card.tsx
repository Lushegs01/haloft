import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Footprints,
  Star,
  BadgeCheck,
  BedDouble,
  DollarSign,
} from "lucide-react";
import type { ListingCard } from "@/data/marketplace";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  hostel: "Hostel",
  apartment: "Apartment",
  shared_house: "Shared house",
  single_room: "Single room",
  self_contained: "Self-contained",
  studio: "Studio",
};

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PropertyCard({ listing }: { listing: ListingCard }) {
  const typeLabel = PROPERTY_TYPE_LABELS[listing.propertyType] ?? "Property";

  // Sample cards are placeholders shown when the catalogue is empty — there
  // is no property behind them, so linking to /campus/property/<slug> only
  // leads to a dead page. Render them as plain, non-clickable cards.
  const isSample = listing.source === "sample";

  const cardClass =
    "group flex flex-col overflow-hidden rounded-2xl border border-border bg-white" +
    (isSample
      ? ""
      : " transition-all duration-300 hover:-translate-y-1 hover:shadow-premium");

  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-navy to-teal-ink"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-dots bg-dots-light opacity-40" />
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-coral/25 blur-2xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BedDouble className="size-10 text-white/50" aria-hidden="true" />
            </div>
          </div>
        )}

        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-sm">
          {typeLabel}
        </span>

        {listing.verified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-teal-ink px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Verified
          </span>
        )}

        {listing.source === "sample" && (
          <span className="absolute bottom-3 right-3 rounded-full bg-navy/80 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            Sample listing
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-display text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {listing.neighbourhood}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {listing.walkMinutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Footprints className="size-3.5 text-teal-ink" aria-hidden="true" />
              ~{listing.walkMinutes} min walk
            </span>
          )}
          {listing.rating !== null && (
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {listing.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">
                ({listing.reviewCount})
              </span>
            </span>
          )}
        </div>

        {listing.amenities.length > 0 && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {listing.amenities.slice(0, 4).join(" · ")}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-border/70 pt-3">
          <p className="text-lg font-extrabold text-foreground">
            {formatNaira(listing.pricePerMonth)}
            <span className="text-xs font-medium text-muted-foreground">/month</span>
          </p>
          {isSample ? (
            <span className="text-xs font-medium text-muted-foreground">
              Example pricing
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-ink">
              <DollarSign className="size-3.5" aria-hidden="true" />
              View home
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (isSample) {
    return <div className={cardClass}>{body}</div>;
  }

  return (
    <Link
      href={`/${listing.campusSlug}/property/${listing.slug}`}
      className={cardClass}
    >
      {body}
    </Link>
  );
}
