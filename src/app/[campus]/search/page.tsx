import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  SearchResults,
  SearchFilters,
  SearchSkeleton,
} from "@/components/search/search-results";

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
    <div className="flex flex-col min-h-full">
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Search accommodation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {campusData.name}
          </p>
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
