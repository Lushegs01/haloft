import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { SearchFilters, SearchSkeleton } from "@/components/search/search-results";
import { SearchResults } from "@/components/search/results";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ campus: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { campus } = await params;
  const queryParams = await searchParams;

  const supabase = await createClient();

  const { data: campusData } = await supabase
    .from("campuses")
    .select("id, name, slug, university_id, latitude, longitude")
    .eq("slug", campus)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!campusData) {
    notFound();
  }

  const { data: neighbourhoods } = await supabase
    .from("neighbourhoods")
    .select("*")
    .eq("campus_id", campusData.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name");

  const filters = {
    neighbourhoodId: queryParams.neighbourhood as string | undefined,
    propertyType: queryParams.type as string | undefined,
    minPrice: queryParams.minPrice
      ? parseInt(queryParams.minPrice as string, 10)
      : undefined,
    maxPrice: queryParams.maxPrice
      ? parseInt(queryParams.maxPrice as string, 10)
      : undefined,
    amenities: queryParams.amenities
      ? (queryParams.amenities as string).split(",")
      : undefined,
    search: queryParams.q as string | undefined,
  };
  const page = Math.max(
    1,
    parseInt((queryParams.page as string) ?? "1", 10) || 1
  );

  return (
    <div className="pb-24 md:pb-0">
      {/* Search bar — the one thing that must always be reachable */}
      <div className="hairline-b bg-[var(--paper)]">
        <div className="shell py-6 lg:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-3 text-ink">Homes near {campusData.name}</h1>
              {filters.search && (
                <p className="mt-2 text-[13.5px] text-muted-foreground">
                  Showing matches for &ldquo;{filters.search}&rdquo;
                </p>
              )}
            </div>

            <form
              action={`/${campus}/search`}
              className="w-full lg:max-w-[26rem]"
              role="search"
            >
              {/* Keep the active filters when the query changes */}
              {Object.entries(queryParams).map(([key, value]) =>
                key === "q" || key === "page" || value === undefined ? null : (
                  <input
                    key={key}
                    type="hidden"
                    name={key}
                    value={Array.isArray(value) ? value.join(",") : value}
                  />
                )
              )}
              <label htmlFor="search-q" className="sr-only">
                Search homes near {campusData.name}
              </label>
              <div className="flex h-12 items-center gap-2.5 rounded-[11px] border border-[var(--line-strong)] bg-card px-4 transition-colors focus-within:border-[var(--teal-deep)]">
                <Search
                  className="size-[18px] shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="search-q"
                  name="q"
                  defaultValue={filters.search ?? ""}
                  placeholder="Area, landmark or home name"
                  autoComplete="off"
                  className="h-full w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-muted-foreground/80"
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
      </div>

      <div className="shell py-9 lg:py-12">
        <div className="grid grid-cols-12 gap-y-8 lg:gap-x-12">
          <aside className="col-span-12 lg:col-span-3">
            <SearchFilters
              campusSlug={campus}
              neighbourhoods={neighbourhoods ?? []}
              currentFilters={filters}
            />
          </aside>

          <div className="col-span-12 min-w-0 lg:col-span-9">
            <Suspense
              key={JSON.stringify({ filters, page })}
              fallback={<SearchSkeleton />}
            >
              <SearchResults
                campusId={campusData.id}
                campusSlug={campus}
                campusLat={campusData.latitude}
                campusLng={campusData.longitude}
                filters={filters}
                page={page}
                queryParams={queryParams}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
