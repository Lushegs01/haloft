import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Footprints, Star } from "lucide-react";
import { Facade, facadeForIndex } from "@/components/haloft/facade";
import { formatNaira, propertyTypeLabel } from "@/components/haloft/format";
import type { PropertyListing } from "@/types/database";

/**
 * The listing tile used everywhere a catalogue row is shown — campus
 * home, search results, related homes. One component so the card never
 * drifts between surfaces.
 */
export function ListingTile({
  property,
  campusSlug,
  walkMinutes,
  index = 0,
  priority = false,
}: {
  property: PropertyListing;
  campusSlug: string;
  /** Minutes on foot to campus, when both coordinates are known. */
  walkMinutes?: number | null;
  index?: number;
  priority?: boolean;
}) {
  const title = property.title ?? "Student home";
  const place = property.neighbourhood_name ?? property.address ?? "Near campus";
  const rooms = property.available_rooms ?? 0;

  return (
    <article className="group">
      <Link
        href={`/${campusSlug}/property/${property.slug}`}
        className="block rounded-[14px] outline-offset-4"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-[var(--paper-warm)]">
          {property.media_url ? (
            <Image
              src={property.media_url}
              alt={`${title}, ${place}`}
              fill
              priority={priority}
              className="img-zoom object-cover"
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw"
            />
          ) : (
            <Facade
              variant={facadeForIndex(index)}
              className="img-zoom"
              priority={priority}
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw"
            />
          )}

          {property.is_verified ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.94)] px-2.5 py-1 text-[11px] font-medium text-[var(--teal-deep)]">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Verified
            </span>
          ) : (
            <span className="absolute left-3 top-3 rounded-full bg-[rgba(255,255,255,0.94)] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Not yet verified
            </span>
          )}

          {!property.media_url && (
            <span className="absolute bottom-3 left-3 rounded-full bg-[rgba(255,255,255,0.92)] px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
              Photo added after the visit
            </span>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="min-w-0 truncate text-[15.5px] font-semibold tracking-[-0.018em] text-ink">
              {title}
            </h3>
            <p className="shrink-0 text-[15px] font-semibold text-ink tabular">
              {formatNaira(Number(property.min_price ?? 0))}
              <span className="ml-1 text-[11.5px] font-normal text-muted-foreground">
                /year
              </span>
            </p>
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 text-[13px] text-muted-foreground">
            <span className="truncate">{place}</span>
            {walkMinutes != null && (
              <>
                <span aria-hidden="true" className="text-[var(--line-strong)]">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Footprints className="size-3.5 text-[var(--teal-deep)]" aria-hidden="true" />
                  {walkMinutes} min walk
                </span>
              </>
            )}
          </p>

          <p className="mt-2.5 flex items-center gap-2.5 truncate border-t border-[var(--line)] pt-2.5 text-[12.5px] text-muted-foreground">
            <span>{propertyTypeLabel(property.property_type)}</span>
            <span aria-hidden="true" className="text-[var(--line-strong)]">·</span>
            <span>
              {rooms} {rooms === 1 ? "room" : "rooms"} free
            </span>
            {property.avg_rating ? (
              <>
                <span aria-hidden="true" className="text-[var(--line-strong)]">·</span>
                <span className="inline-flex items-center gap-1">
                  <Star
                    className="size-3.5 fill-current text-[var(--sand-deep)]"
                    aria-hidden="true"
                  />
                  {property.avg_rating}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </Link>
    </article>
  );
}
