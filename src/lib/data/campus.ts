import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/client";
import { sanitizeSearchTerm } from "@/lib/utils";

// Cache tags — admin writes call revalidateTag() with these so the
// public catalog updates immediately instead of waiting out the TTL.
export const CACHE_TAGS = {
  properties: "properties",
  campuses: "campuses",
} as const;

export async function getCampusBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("campuses")
        .select("*, universities(name, slug, country_id, countries(code, currency_code, currency_symbol, timezone, locale))")
        .eq("slug", slug)
        .eq("is_active", true)
        .is("deleted_at", null)
        .single();
      if (error || !data) return null;
      return data;
    },
    ["campus-by-slug", slug],
    { tags: [CACHE_TAGS.campuses], revalidate: 3600 }
  )();
}

export async function getActiveCampuses() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("campuses")
    .select("*, universities(name, slug, country_id)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name");

  if (error || !data) return [];
  return data;
}

export async function getNeighbourhoodsForCampus(campusId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("neighbourhoods")
    .select("*")
    .eq("campus_id", campusId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name");

  if (error || !data) return [];
  return data;
}

export const PROPERTIES_PAGE_SIZE = 24;

export interface PropertyFilters {
  neighbourhoodId?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  search?: string;
}

/**
 * Returns one page of published properties plus the total count for the
 * filter set, so callers can render pagination. `page` is 1-based.
 */
export async function getCampusProperties(
  campusId: string,
  filters?: PropertyFilters,
  page = 1
) {
  return unstable_cache(
    () => queryCampusProperties(campusId, filters, page),
    ["campus-properties", campusId, JSON.stringify(filters ?? {}), String(page)],
    { tags: [CACHE_TAGS.properties], revalidate: 300 }
  )();
}

async function queryCampusProperties(
  campusId: string,
  filters: PropertyFilters | undefined,
  page: number
) {
  const supabase = createClient();
  const from = (Math.max(1, page) - 1) * PROPERTIES_PAGE_SIZE;
  const to = from + PROPERTIES_PAGE_SIZE - 1;

  let query = supabase
    .from("property_listings")
    .select("*", { count: "exact" })
    .eq("campus_id", campusId)
    .eq("status", "published")
    .order("featured_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.neighbourhoodId) {
    query = query.eq("neighbourhood_id", filters.neighbourhoodId);
  }
  if (filters?.propertyType) {
    query = query.eq("property_type", filters.propertyType as "hostel" | "apartment" | "shared_house" | "single_room" | "self_contained" | "studio");
  }
  if (filters?.minPrice !== undefined) {
    query = query.gte("min_price", filters.minPrice);
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte("max_price", filters.maxPrice);
  }
  if (filters?.amenities && filters.amenities.length > 0) {
    query = query.contains("amenities", filters.amenities);
  }
  if (filters?.search) {
    const search = sanitizeSearchTerm(filters.search);
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`
      );
    }
  }

  const { data, error, count } = await query;
  if (error || !data) return { properties: [], total: 0, page, pageSize: PROPERTIES_PAGE_SIZE };
  return { properties: data, total: count ?? data.length, page, pageSize: PROPERTIES_PAGE_SIZE };
}

export async function getPropertyBySlug(campusId: string, slug: string) {
  return unstable_cache(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("property_listings")
        .select("*")
        .eq("campus_id", campusId)
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error || !data) return null;
      return data;
    },
    ["property-by-slug", campusId, slug],
    { tags: [CACHE_TAGS.properties], revalidate: 300 }
  )();
}

export async function getPropertyRooms(propertyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("room_listings")
    .select("*")
    .eq("property_id", propertyId)
    .eq("is_available", true)
    .eq("status", "available")
    .order("price_per_month", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getPropertyMedia(entityType: string, entityId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("entity_type", entityType as "property" | "room" | "university" | "campus" | "inspection")
    .eq("entity_id", entityId)
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getPropertyReviews(propertyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles:public_profiles(full_name, avatar_url)")
    .eq("property_id", propertyId)
    .eq("is_approved", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
