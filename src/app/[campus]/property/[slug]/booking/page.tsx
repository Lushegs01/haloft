import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ campus: string; slug: string }>;
  searchParams: Promise<{ room?: string }>;
}) {
  const { campus, slug } = await params;
  const { room: roomId } = await searchParams;

  if (!roomId) {
    notFound();
  }

  const supabase = await createClient();

  const { data: campusData } = await supabase
    .from("campuses")
    .select("id")
    .eq("slug", campus)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!campusData) {
    notFound();
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id, title, slug")
    .eq("campus_id", campusData.id)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!property) {
    notFound();
  }

  const { data: room } = await supabase
    .from("room_listings")
    .select("*")
    .eq("id", roomId)
    .eq("property_id", property.id)
    .eq("status", "available")
    .eq("is_available", true)
    .single();

  if (!room) {
    notFound();
  }

  return (
    <BookingForm
      room={room}
      propertySlug={slug}
      campusSlug={campus}
      propertyTitle={property.title}
    />
  );
}
