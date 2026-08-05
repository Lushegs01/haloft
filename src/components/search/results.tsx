import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { getCampusProperties } from "@/lib/data/campus";
import { walkMinutes } from "@/lib/utils";
import { ListingTile } from "@/components/property/listing-tile";

interface SearchResultsProps {
  campusId: string;
  campusSlug: string;
  campusLat?: number | null;
  campusLng?: number | null;
  filters: {
    neighbourhoodId?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    search?: string;
  };
  page?: number;
  queryParams?: Record<string, string | string[] | undefined>;
}

export async function SearchResults({
  campusId,
  campusSlug,
  campusLat,
  campusLng,
  filters,
  page = 1,
  queryParams = {},
}: SearchResultsProps) {
  const { properties, total, pageSize } = await getCampusProperties(
    campusId,
    filters,
    page
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (key === "page" || value === undefined) continue;
      params.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return `/${campusSlug}/search${query ? `?${query}` : ""}`;
  };

  if (properties.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-[var(--line-strong)] px-6 py-20 text-center">
        <Building2 className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
        <p className="mt-4 text-[17px] font-medium tracking-[-0.02em] text-ink">
          Nothing matches that yet
        </p>
        <p className="mx-auto mt-2.5 max-w-[46ch] text-[13.5px] leading-[1.6] text-muted-foreground">
          Try widening the price range or dropping a filter. The catalogue
          grows as the team visits more homes around this campus.
        </p>
        <Link
          href={`/${campusSlug}/search`}
          className="mt-7 inline-flex h-11 items-center rounded-[10px] border border-[var(--line-strong)] px-5 text-[13.5px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[13.5px] text-muted-foreground">
        <span className="font-medium text-ink tabular">{total}</span>{" "}
        {total === 1 ? "home" : "homes"} near campus
        {totalPages > 1 && (
          <span className="text-muted-foreground/80">
            {" "}
            · page {page} of {totalPages}
          </span>
        )}
      </p>

      <div className="mt-7 grid grid-cols-1 gap-x-7 gap-y-11 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((property, index) => {
          const minutes =
            campusLat != null &&
            campusLng != null &&
            property.latitude != null &&
            property.longitude != null
              ? walkMinutes(
                  Number(property.latitude),
                  Number(property.longitude),
                  Number(campusLat),
                  Number(campusLng)
                )
              : null;

          return (
            <ListingTile
              key={property.id}
              property={property}
              campusSlug={campusSlug}
              walkMinutes={minutes}
              index={index}
              priority={index < 3}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav
          className="mt-14 flex items-center justify-between border-t border-[var(--line)] pt-6"
          aria-label="Search results pages"
        >
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              rel="prev"
              className="group inline-flex h-11 items-center gap-2 rounded-[10px] border border-[var(--line-strong)] px-4 text-[13.5px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Previous
            </Link>
          ) : (
            <span className="text-[13px] text-muted-foreground/60">Previous</span>
          )}

          <span className="text-[13px] text-muted-foreground tabular">
            {page} / {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              rel="next"
              className="group inline-flex h-11 items-center gap-2 rounded-[10px] border border-[var(--line-strong)] px-4 text-[13.5px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
            >
              Next
              <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
            </Link>
          ) : (
            <span className="text-[13px] text-muted-foreground/60">Next</span>
          )}
        </nav>
      )}
    </div>
  );
}
