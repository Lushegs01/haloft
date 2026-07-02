"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type BookingAction = "confirm" | "complete" | "cancel";

// Sentinel messages raised by admin_update_booking_status in the database
const errorMessages: Record<string, string> = {
  AUTH_REQUIRED: "You must be signed in.",
  ADMIN_ONLY: "You do not have permission to manage bookings for this property.",
  BOOKING_NOT_FOUND: "Booking not found.",
  INVALID_TRANSITION: "This booking cannot move to that status from its current one.",
  INVALID_ACTION: "Unknown booking action.",
};

export async function updateBookingStatus(bookingId: string, action: BookingAction) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: errorMessages.AUTH_REQUIRED };
  }

  if (!z.string().uuid().safeParse(bookingId).success) {
    return { error: errorMessages.BOOKING_NOT_FOUND };
  }

  // Permission check, status transition, and room-state sync happen
  // atomically in the database — see admin_update_booking_status in
  // db/migrations/006_media_storage_and_booking_admin.sql.
  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: bookingId,
    p_action: action,
  });

  if (error) {
    return {
      error:
        errorMessages[error.message] ??
        "Could not update the booking. Please try again.",
    };
  }

  revalidatePath("/admin/bookings");
  return { success: true };
}
