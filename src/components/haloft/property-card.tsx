import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Footprints } from "lucide-react";
import type { ListingCard } from "@/data/marketplace";
import { Elevation } from "./elevation";
import { formatNaira, propertyTypeLabel } from "./format";

const RATIOS = {
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
  square: "aspect-[1/1]",
  tall: "aspect-[3/4]",
} as const;

const ELEVATIONS = ["tower", "terrace", "court"] as const;

export function PropertyCard({
  listing,
  ratio = "landscape",
  emphasis = false,
  index = 0,
  className = "",
}: {
  listing: ListingCard;
  ratio?: keyof typeof RATIOS;
  /** The one card in a group that carries more weight. */
  emphasis?: boolean;
  index?: number;
  className?: string;
}) {
  // Sample cards stand in for an empty catalogue — there is no property
  // behind them, so they must not pretend to be a link.
  const isSample = listing.source === "sample";
  const typeLabel = propertyTypeLabel(listing.propertyType);
  const elevation = ELEVATIONS[index % ELEVATIONS.length];

  // The catalogue sometimes repeats the property type inside the amenity
  // list ("Self-contained · Self-contained · Water"). Drop the duplicate.
  const amenities = listing.amenities.filter(
    (a) => a.toLowerCase() !== typeLabel.toLowerCase()
  );

  const body = (
    <>
      <div
        className={`relative overflow-hidden rounded-[14px] bg-[var(--paper-warm)] ${RATIOS[ratio]}`}
      >
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={`${listing.title} in ${listing.neighbourhood}`}
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 32vw"
            className="img-zoom object-cover"
          />
        ) : (
          <Elevation variant={elevation} className="img-zoom" />
        )}

        {listing.verified && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.94)] px-2.5 py-1 text-[11px] font-medium text-[var(--teal-deep)] shadow-[0_1px_3px_rgba(16,24,32,0.08)]">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Verified
          </span>
        )}

        {isSample ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-[rgba(17,28,39,0.74)] px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.1em] text-white">
            Sample listing
          </span>
        ) : (
          !listing.imageUrl && (
            <span className="absolute bottom-3 left-3 rounded-full bg-[rgba(255,255,255,0.92)] px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
              Photo added after the visit
            </span>
          )
        )}
      </div>

      <div className={emphasis ? "mt-5" : "mt-4"}>
        <div className="flex items-baseline justify-between gap-4">
          <h3
            className={`min-w-0 truncate font-semibold tracking-[-0.018em] text-ink ${
              emphasis ? "text-[19px]" : "text-[15.5px]"
            }`}
          >
            {listing.title}
          </h3>
          <p
            className={`shrink-0 font-semibold text-ink tabular ${
              emphasis ? "text-[18px]" : "text-[15px]"
            }`}
          >
            {formatNaira(listing.pricePerMonth)}
            <span className="ml-1 text-[11.5px] font-normal text-muted-foreground">
              /mo
            </span>
          </p>
        </div>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted-foreground">
          <span className="truncate">{listing.neighbourhood}</span>
          {listing.walkMinutes > 0 && (
            <>
              <span aria-hidden="true" className="text-[var(--line-strong)]">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Footprints className="size-3.5 text-[var(--teal-deep)]" aria-hidden="true" />
                {listing.walkMinutes} min walk
              </span>
            </>
          )}
        </p>

        <p className="mt-2.5 truncate border-t border-[var(--line)] pt-2.5 text-[12.5px] text-muted-foreground">
          {typeLabel}
          {amenities.length > 0 && (
            <>
              <span aria-hidden="true" className="mx-2 text-[var(--line-strong)]">
                ·
              </span>
              {amenities.slice(0, emphasis ? 4 : 3).join(" · ")}
            </>
          )}
        </p>
      </div>
    </>
  );

  if (isSample) {
    return <article className={`group block ${className}`}>{body}</article>;
  }

  return (
    <article className={`group block ${className}`}>
      <Link
        href={`/${listing.campusSlug}/property/${listing.slug}`}
        className="block rounded-[14px] outline-offset-4"
      >
        {body}
      </Link>
    </article>
  );
}
