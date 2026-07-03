"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const rating = z.coerce.number().int().min(1).max(5);

const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  campusSlug: z.string(),
  overall: rating,
  cleanliness: rating,
  location: rating,
  value: rating,
  management: rating,
  comment: z.string().max(2000).optional(),
});

// Sentinel messages from the reviews integrity trigger (migration 004)
const errorMessages: Record<string, string> = {
  REVIEW_BOOKING_INVALID:
    "You can only review a property after completing a stay there.",
  REVIEW_PRIVILEGED_COLUMNS: "That change isn't allowed.",
};

export async function submitReview(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to leave a review." };
  }

  const parsed = reviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    campusSlug: formData.get("campusSlug"),
    overall: formData.get("overall"),
    cleanliness: formData.get("cleanliness"),
    location: formData.get("location"),
    value: formData.get("value"),
    management: formData.get("management"),
    comment: formData.get("comment") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please give a rating from 1 to 5 in every category." };
  }
  const d = parsed.data;

  // Resolve the booking's property (the DB trigger also verifies the
  // booking is the student's own completed stay).
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, property_id, student_id, status")
    .eq("id", d.bookingId)
    .single();

  if (!booking || booking.student_id !== user.id) {
    return { error: "Booking not found." };
  }
  if (booking.status !== "completed") {
    return { error: "You can only review a completed stay." };
  }

  const { error } = await supabase.from("reviews").insert({
    student_id: user.id,
    booking_id: d.bookingId,
    property_id: booking.property_id,
    overall_rating: d.overall,
    cleanliness_rating: d.cleanliness,
    location_rating: d.location,
    value_rating: d.value,
    management_rating: d.management,
    comment: d.comment?.trim() || null,
  });

  if (error) {
    // 23505 = unique(student_id, booking_id) — already reviewed
    if (error.code === "23505") {
      return { error: "You've already reviewed this booking." };
    }
    return {
      error: errorMessages[error.message] ?? "Could not submit your review. Please try again.",
    };
  }

  revalidatePath(`/${d.campusSlug}/dashboard`);
  return { success: true };
}
