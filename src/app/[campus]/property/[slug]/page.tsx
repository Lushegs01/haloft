import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PropertyDetailPage } from "@/components/property/property-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campus: string; slug: string }>;
}) {
  const { campus, slug } = await params;
  const supabase = await createClient();

  const { data: campusData } = await supabase
    .from("campuses")
    .select("id")
    .eq("slug", campus)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!campusData) return { title: "Not Found" };

  const { data: property } = await supabase
    .from("properties")
    .select("title, meta_title, meta_description, description")
    .eq("campus_id", campusData.id)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  return {
    title: property?.meta_title ?? property?.title ?? "Property",
    description: property?.meta_description ?? property?.description ?? "",
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ campus: string; slug: string }>;
}) {
  const { campus, slug } = await params;
  const supabase = await createClient();

  const { data: campusData } = await supabase
    .from("campuses")
    .select("id, name, slug, latitude, longitude")
    .eq("slug", campus)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!campusData) {
    notFound();
  }

  const { data: property } = await supabase
    .from("property_listings")
    .select("*")
    .eq("campus_id", campusData.id)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!property || !property.id) {
    notFound();
  }

  const { data: rooms } = await supabase
    .from("room_listings")
    .select("*")
    .eq("property_id", property.id)
    .eq("status", "available")
    .eq("is_available", true)
    .order("price_per_month", { ascending: true });

  const { data: media } = await supabase
    .from("media")
    .select("url, alt_text, is_featured")
    .eq("entity_type", "property")
    .eq("entity_id", property.id)
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, overall_rating, comment, created_at, profiles:public_profiles(full_name, avatar_url)")
    .eq("property_id", property.id)
    .eq("is_approved", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <PropertyDetailPage
      property={property}
      rooms={rooms ?? []}
      media={media ?? []}
      reviews={reviews ?? []}
      campusSlug={campusData.slug}
      campusName={campusData.name}
      campusLat={campusData.latitude}
      campusLng={campusData.longitude}
    />
  );
}
