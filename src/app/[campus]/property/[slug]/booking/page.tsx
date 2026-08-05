import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";
import { AppToaster } from "@/components/ui/app-toaster";

// Reads the signed-in student and live room availability before letting
// anyone request a room — always rendered per request.
export const dynamic = "force-dynamic";

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

  // Fetch the room without filtering on availability. Submitting a booking
  // flips the room to 'reserved', and the server action revalidates this
  // route — filtering here would 404 the student the instant their booking
  // succeeds. Availability is enforced authoritatively by create_booking().
  const { data: room } = await supabase
    .from("room_listings")
    .select("*")
    .eq("id", roomId)
    .eq("property_id", property.id)
    .single();

  if (!room) {
    notFound();
  }

  const isBookable = room.is_available === true && room.status === "available";

  return (
    <>
      <AppToaster />
      <BookingForm
      room={room}
      propertySlug={slug}
      campusSlug={campus}
      propertyTitle={property.title}
        isBookable={isBookable}
      />
    </>
  );
}
