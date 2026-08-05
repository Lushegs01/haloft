import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, Search } from "lucide-react";
import { ListingTile } from "@/components/property/listing-tile";
import {
  getCampusBySlug,
  getFeaturedProperties,
  getNeighbourhoodsForCampus,
} from "@/lib/data/campus";
import { walkMinutes } from "@/lib/utils";

const PROPERTY_TYPES = [
  { value: "self_contained", label: "Self-contained" },
  { value: "single_room", label: "Single room" },
  { value: "hostel", label: "Hostel" },
  { value: "studio", label: "Studio" },
  { value: "apartment", label: "Apartment" },
  { value: "shared_house", label: "Shared flat" },
];

export default async function CampusHomePage({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const { campus } = await params;
  const campusData = await getCampusBySlug(campus);

  if (!campusData) {
    notFound();
  }

  // Both reads are cached and independent, so run them together rather
  // than paying two round-trips in sequence on a cold cache.
  const [featured, neighbourhoods] = await Promise.all([
    getFeaturedProperties(campusData.id),
    getNeighbourhoodsForCampus(campusData.id),
  ]);

  const campusLat = Number(campusData.latitude);
  const campusLng = Number(campusData.longitude);

  return (
    <div className="pb-24 md:pb-0">
      {/* ── Campus header ─────────────────────────────────── */}
      <section className="hairline-b bg-[var(--paper)]">
        <div className="shell py-12 lg:py-16">
          <div className="grid grid-cols-12 items-end gap-y-8 lg:gap-x-10">
            <div className="col-span-12 lg:col-span-7">
              <p className="label label-rule max-w-[20rem]">
                {campusData.city}, {campusData.state}
              </p>
              <h1 className="mt-6 display-2 max-w-[16ch] text-ink">
                Student homes around {campusData.universities.name}.
              </h1>
              <p className="lede mt-5">
                Everything below sits within reach of {campusData.name}, with
                the walk time measured from campus.
              </p>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <form action={`/${campus}/search`} className="lg:ml-auto lg:max-w-[24rem]">
                <label
                  htmlFor="campus-search"
                  className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Search this campus
                </label>
                <div className="mt-2.5 flex h-13 items-center gap-2.5 rounded-[12px] border border-[var(--line-strong)] bg-card px-4 transition-colors focus-within:border-[var(--teal-deep)]">
                  <Search className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="campus-search"
                    name="q"
                    placeholder="Area, landmark or home name"
                    autoComplete="off"
                    className="h-full w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted-foreground/80"
                  />
                  <button
                    type="submit"
                    className="shrink-0 text-[13px] font-medium text-[var(--teal-deep)] transition-opacity hover:opacity-70"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Type filters — a quiet row, not a carousel of cards */}
          <div className="mt-10 flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((type) => (
              <Link
                key={type.value}
                href={`/${campus}/search?type=${type.value}`}
                className="inline-flex h-10 items-center rounded-[9px] border border-[var(--line-strong)] px-3.5 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-[var(--ink-soft)] hover:text-ink"
              >
                {type.label}
              </Link>
            ))}
            <Link
              href={`/${campus}/search`}
              className="group inline-flex h-10 items-center gap-1.5 rounded-[9px] bg-[var(--navy)] px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              Everything
              <ArrowRight className="size-3.5 arrow-nudge" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured homes ────────────────────────────────── */}
      <section className="chapter-tight bg-[var(--paper)]">
        <div className="shell">
          <div className="flex items-end justify-between gap-6">
            <h2 className="display-3 text-ink">Featured this term</h2>
            <Link
              href={`/${campus}/search`}
              className="group hidden shrink-0 items-center gap-2 border-b border-[var(--line-strong)] pb-1.5 text-[13.5px] font-medium text-ink transition-colors hover:border-[var(--teal-deep)] sm:inline-flex"
            >
              See all homes
              <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-x-7 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((property, i) => (
                <ListingTile
                  key={property.id}
                  property={property}
                  campusSlug={campus}
                  index={i}
                  priority={i < 3}
                  walkMinutes={
                    Number.isFinite(campusLat) &&
                    Number.isFinite(campusLng) &&
                    property.latitude != null &&
                    property.longitude != null
                      ? walkMinutes(
                          Number(property.latitude),
                          Number(property.longitude),
                          campusLat,
                          campusLng
                        )
                      : null
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-[14px] border border-dashed border-[var(--line-strong)] px-6 py-16 text-center">
              <Building2 className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
              <p className="mt-4 text-[15px] font-medium text-ink">
                Nothing featured here yet
              </p>
              <p className="mx-auto mt-2 max-w-[42ch] text-[13.5px] text-muted-foreground">
                The team is still visiting homes around {campusData.name}.
                Browse everything that&apos;s already listed in the meantime.
              </p>
              <Link
                href={`/${campus}/search`}
                className="mt-6 inline-flex h-11 items-center rounded-[10px] border border-[var(--line-strong)] px-5 text-[13.5px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
              >
                Browse all homes
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Neighbourhoods ────────────────────────────────── */}
      {neighbourhoods && neighbourhoods.length > 0 && (
        <section className="chapter-tight hairline-t bg-[var(--paper-warm)]">
          <div className="shell">
            <div className="grid grid-cols-12 gap-y-8 lg:gap-x-10">
              <div className="col-span-12 lg:col-span-4">
                <p className="label label-rule max-w-[14rem]">Areas</p>
                <h2 className="mt-6 display-3 max-w-[14ch] text-ink">
                  Where students live around here
                </h2>
              </div>

              <ul className="col-span-12 border-t border-[var(--line)] lg:col-span-7 lg:col-start-6">
                {neighbourhoods.map((area) => (
                  <li key={area.id} className="border-b border-[var(--line)]">
                    <Link
                      href={`/${campus}/search?neighbourhood=${area.id}`}
                      className="group flex items-start justify-between gap-6 py-5"
                    >
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                          {area.name}
                        </p>
                        {area.description && (
                          <p className="mt-1.5 max-w-[52ch] text-[13px] leading-[1.6] text-muted-foreground">
                            {area.description}
                          </p>
                        )}
                      </div>
                      <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-[var(--teal-deep)]">
                        Browse
                        <ArrowRight className="size-3.5 arrow-nudge" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
