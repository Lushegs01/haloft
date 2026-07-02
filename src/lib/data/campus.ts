import { createClient } from "@/lib/supabase/client";
import { sanitizeSearchTerm } from "@/lib/utils";
import type { Database } from "@/types/database";

export async function getCampusBySlug(slug: string) {
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

export async function getCampusProperties(
  campusId: string,
  filters?: {
    neighbourhoodId?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    search?: string;
  }
) {
  const supabase = createClient();
  let query = supabase
    .from("property_listings")
    .select("*")
    .eq("campus_id", campusId)
    .eq("status", "published")
    .order("featured_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

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

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}

export async function getPropertyBySlug(campusId: string, slug: string) {
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
