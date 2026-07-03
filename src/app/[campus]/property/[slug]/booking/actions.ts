"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const bookingSchema = z.object({
  roomId: z.string().uuid(),
  propertyId: z.string().uuid(),
  campusSlug: z.string(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  specialRequests: z.string().optional(),
});

// Sentinel messages raised by create_booking/cancel_booking in the database
const bookingErrorMessages: Record<string, string> = {
  AUTH_REQUIRED: "You must be signed in to book a room.",
  INVALID_DATES: "Move-out date must be after move-in date.",
  CHECK_IN_PAST: "Move-in date cannot be in the past.",
  ROOM_NOT_FOUND: "This room could not be found.",
  ROOM_PROPERTY_MISMATCH: "This room does not belong to the selected property.",
  ROOM_UNAVAILABLE: "This room is no longer available.",
  BOOKING_NOT_FOUND: "Booking not found.",
  BOOKING_NOT_CANCELLABLE: "This booking cannot be cancelled.",
  BOOKING_PAID:
    "This booking has already been paid for. Contact our team to cancel and arrange a refund.",
};

function friendlyBookingError(error: { code?: string; message: string }) {
  // 23P01 = exclusion constraint (overlapping booking), 23514 = check constraint
  if (error.code === "23P01") {
    return bookingErrorMessages.ROOM_UNAVAILABLE;
  }
  if (error.code === "23514") {
    return bookingErrorMessages.INVALID_DATES;
  }
  return (
    bookingErrorMessages[error.message] ??
    "Could not complete this request. Please try again."
  );
}

export async function createBooking(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to book a room." };
  }

  const raw = {
    roomId: formData.get("roomId") as string,
    propertyId: formData.get("propertyId") as string,
    campusSlug: formData.get("campusSlug") as string,
    checkInDate: formData.get("checkInDate") as string,
    checkOutDate: formData.get("checkOutDate") as string,
    specialRequests: formData.get("specialRequests") as string,
  };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid booking data. Please check your inputs." };
  }

  const { roomId, propertyId, campusSlug, checkInDate, checkOutDate, specialRequests } =
    parsed.data;

  if (checkOutDate <= checkInDate) {
    return { error: bookingErrorMessages.INVALID_DATES };
  }

  // Availability check, pricing, booking insert, and room reservation happen
  // atomically in the database under a row lock — see create_booking in
  // db/migrations/002_booking_integrity.sql.
  const { data: booking, error } = await supabase.rpc("create_booking", {
    p_room_id: roomId,
    p_property_id: propertyId,
    p_check_in_date: checkInDate,
    p_check_out_date: checkOutDate,
    p_special_requests: specialRequests || null,
  });

  if (error) {
    return { error: friendlyBookingError(error) };
  }

  revalidatePath(`/${campusSlug}/dashboard`);
  revalidatePath(`/${campusSlug}/property`);

  return { success: true, booking };
}

export async function cancelBooking(bookingId: string, campusSlug: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  if (!z.string().uuid().safeParse(bookingId).success) {
    return { error: bookingErrorMessages.BOOKING_NOT_FOUND };
  }

  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    return { error: friendlyBookingError(error) };
  }

  revalidatePath(`/${campusSlug}/dashboard`);

  return { success: true };
}
