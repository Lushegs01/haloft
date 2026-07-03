import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  SearchResults,
  SearchFilters,
  SearchSkeleton,
} from "@/components/search/search-results";
import { Search, SlidersHorizontal } from "lucide-react";

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
    .select("id, name, slug, university_id")
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
    minPrice: queryParams.minPrice ? parseInt(queryParams.minPrice as string, 10) : undefined,
    maxPrice: queryParams.maxPrice ? parseInt(queryParams.maxPrice as string, 10) : undefined,
    amenities: queryParams.amenities ? (queryParams.amenities as string).split(",") : undefined,
    search: queryParams.q as string | undefined,
  };

  return (
    <div className="flex flex-col min-h-full pb-16 md:pb-0">

      {/* Sticky search header */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <form action={`/${campus}/search`} className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  name="q"
                  defaultValue={filters.search ?? ""}
                  placeholder={`Search near ${campusData.name}…`}
                  className="w-full rounded-full border border-border bg-muted/50 pl-11 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:bg-background transition-all"
                />
              </div>
            </form>
            <div className="flex items-center gap-1 text-sm text-muted-foreground hidden md:flex shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              <span>{campusData.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Filters sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
            <SearchFilters
              campusSlug={campus}
              neighbourhoods={neighbourhoods ?? []}
              currentFilters={filters}
            />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<SearchSkeleton />}>
              <SearchResults
                campusId={campusData.id}
                campusSlug={campus}
                filters={filters}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
