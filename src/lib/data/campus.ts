import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/client";
import { sanitizeSearchTerm } from "@/lib/utils";

/**
 * The read path for every public page.
 *
 * Two layers, doing different jobs:
 *
 *  - `unstable_cache` is the cross-request cache. A page view that hits it
 *    costs zero Postgres queries, which is what lets one campus serve
 *    thousands of students off a handful of origin renders.
 *  - React's `cache` dedupes within a single render, so the layout, the
 *    page and `generateMetadata` asking for the same campus is one call,
 *    not three.
 *
 * Everything here reads with the anon key and no cookies. That is
 * deliberate: it keeps these calls outside Next's dynamic-request scope so
 * the routes can be statically rendered and revalidated, and RLS already
 * exposes exactly this data to anonymous readers (see the *_public_read
 * policies in 001_initial_schema.sql). Anything user-specific — bookings,
 * favourites, the dashboard — must keep using the cookie-bound server
 * client instead.
 */

// Cache tags — admin writes call revalidateTag() with these so the
// public catalog updates immediately instead of waiting out the TTL.
export const CACHE_TAGS = {
  properties: "properties",
  campuses: "campuses",
} as const;

/** Campuses and neighbourhoods change on the order of once a term. */
const SLOW_TTL = 3600;
/** Listings change when the ops team publishes; the tag covers urgency. */
const CATALOG_TTL = 600;
/** Room availability moves with bookings, which also bust the tag. */
const ROOMS_TTL = 120;

export const getCampusBySlug = cache(async (slug: string) =>
  unstable_cache(
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
    { tags: [CACHE_TAGS.campuses], revalidate: SLOW_TTL }
  )()
);

export const getActiveCampuses = cache(async () =>
  unstable_cache(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("campuses")
        .select("*, universities(name, slug, country_id)")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("name");

      if (error || !data) return [];
      return data;
    },
    ["active-campuses"],
    { tags: [CACHE_TAGS.campuses], revalidate: SLOW_TTL }
  )()
);

export const getNeighbourhoodsForCampus = cache(async (campusId: string) =>
  unstable_cache(
    async () => {
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
    },
    ["neighbourhoods", campusId],
    { tags: [CACHE_TAGS.campuses], revalidate: SLOW_TTL }
  )()
);

/** The campus home page's hand-picked row. */
export const getFeaturedProperties = cache(async (campusId: string, limit = 6) =>
  unstable_cache(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("property_listings")
        .select("*")
        .eq("campus_id", campusId)
        .eq("status", "published")
        .not("featured_order", "is", null)
        .order("featured_order", { ascending: true })
        .limit(limit);

      if (error || !data) return [];
      return data;
    },
    ["featured-properties", campusId, String(limit)],
    { tags: [CACHE_TAGS.properties], revalidate: CATALOG_TTL }
  )()
);

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
export const getCampusProperties = cache(
  async (campusId: string, filters?: PropertyFilters, page = 1) =>
    unstable_cache(
      () => queryCampusProperties(campusId, filters, page),
      ["campus-properties", campusId, stableFilterKey(filters), String(page)],
      { tags: [CACHE_TAGS.properties], revalidate: CATALOG_TTL }
    )()
);

/**
 * Cache key for a filter set. Key order must not depend on the order the
 * caller happened to build the object in, or two identical searches get
 * two cache entries — and a free-text search is lowercased and trimmed
 * for the same reason.
 */
function stableFilterKey(filters?: PropertyFilters): string {
  if (!filters) return "{}";
  const normalised: Record<string, unknown> = {};
  for (const key of Object.keys(filters).sort() as Array<keyof PropertyFilters>) {
    const value = filters[key];
    if (value === undefined || value === "" || value === null) continue;
    if (key === "amenities" && Array.isArray(value)) {
      normalised[key] = [...value].sort();
    } else if (key === "search" && typeof value === "string") {
      normalised[key] = value.trim().toLowerCase();
    } else {
      normalised[key] = value;
    }
  }
  return JSON.stringify(normalised);
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

export const getPropertyBySlug = cache(async (campusId: string, slug: string) =>
  unstable_cache(
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
    { tags: [CACHE_TAGS.properties], revalidate: CATALOG_TTL }
  )()
);

/** Title/description for <head>, kept separate so metadata does not pull
 *  the whole listing row through the cache. */
export const getPropertyMeta = cache(async (campusId: string, slug: string) =>
  unstable_cache(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("properties")
        .select("title, meta_title, meta_description, description")
        .eq("campus_id", campusId)
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error || !data) return null;
      return data;
    },
    ["property-meta", campusId, slug],
    { tags: [CACHE_TAGS.properties], revalidate: CATALOG_TTL }
  )()
);

export const getPropertyRooms = cache(async (propertyId: string) =>
  unstable_cache(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("room_listings")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_available", true)
        .eq("status", "available")
        .order("annual_rent", { ascending: true });

      if (error || !data) return [];
      return data;
    },
    ["property-rooms", propertyId],
    { tags: [CACHE_TAGS.properties], revalidate: ROOMS_TTL }
  )()
);

export const getPropertyMedia = cache(
  async (entityType: string, entityId: string) =>
    unstable_cache(
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("media")
          .select("url, alt_text, is_featured, display_order")
          .eq("entity_type", entityType as "property" | "room" | "university" | "campus" | "inspection")
          .eq("entity_id", entityId)
          .is("deleted_at", null)
          .order("display_order", { ascending: true });

        if (error || !data) return [];
        return data;
      },
      ["entity-media", entityType, entityId],
      { tags: [CACHE_TAGS.properties], revalidate: CATALOG_TTL }
    )()
);

export const getPropertyReviews = cache(async (propertyId: string, limit = 20) =>
  unstable_cache(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reviews")
        .select("id, overall_rating, comment, created_at, profiles:public_profiles(full_name, avatar_url)")
        .eq("property_id", propertyId)
        .eq("is_approved", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data;
    },
    ["property-reviews", propertyId, String(limit)],
    { tags: [CACHE_TAGS.properties], revalidate: CATALOG_TTL }
  )()
);

/** Published slugs for a campus — used to prerender listing pages. */
export const getPublishedPropertySlugs = cache(async (campusId: string) =>
  unstable_cache(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("property_listings")
        .select("slug")
        .eq("campus_id", campusId)
        .eq("status", "published")
        .limit(500);

      if (error || !data) return [];
      return data.flatMap((row) => (row.slug ? [row.slug] : []));
    },
    ["published-property-slugs", campusId],
    { tags: [CACHE_TAGS.properties], revalidate: CATALOG_TTL }
  )()
);
