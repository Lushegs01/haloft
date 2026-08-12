"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { drainAfterResponse } from "@/lib/notifications";
import { limitBy, TOO_MANY_REQUESTS } from "@/lib/rate-limit";
import { logSecurityEventAsync } from "@/lib/security-log";
import { fail, MESSAGES } from "@/lib/errors";
import { z } from "zod";

/**
 * A calendar date, not merely something shaped like one.
 *
 * The schema used to be `/^\d{4}-\d{2}-\d{2}$/`, which accepts
 * 2026-02-31 and 2026-13-01 quite happily. Postgres would then reject
 * them — the database was the real validation layer and did its job — but
 * the student got a generic failure from a constraint violation instead
 * of "that date doesn't exist", and every bad value cost a round trip.
 *
 * Parsing back out and comparing is the check that matters: `new Date`
 * rolls 2026-02-31 forward to 2026-03-03 rather than failing, so the only
 * way to know the input was real is to see whether it survived the trip.
 */
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker to choose a move-in date.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.toISOString().slice(0, 10) === value;
  }, "That date doesn't exist. Please check the day and month.")
  .refine((value) => {
    const year = Number(value.slice(0, 4));
    return year >= 2000 && year <= 2100;
  }, "Please choose a move-in date in this century.");

const bookingSchema = z.object({
  roomId: z.string().uuid(),
  propertyId: z.string().uuid(),
  campusSlug: z
    .string()
    .min(1)
    .max(64)
    // Only ever used to build a revalidation path, so it is constrained
    // to what a slug can be rather than trusted as one.
    .regex(/^[a-z0-9-]+$/, "Unknown campus."),
  checkInDate: calendarDate,
  specialRequests: z.string().max(2000).optional(),
});

// Sentinel messages raised by create_booking/cancel_booking in the database
const bookingErrorMessages: Record<string, string> = {
  AUTH_REQUIRED: "You must be signed in to book a room.",
  INVALID_DATES: "Move-out date must be after move-in date.",
  CHECK_IN_PAST: "Move-in date cannot be in the past.",
  CHECK_IN_TOO_FAR: "Move-in dates can be set up to a year ahead.",
  ROOM_NOT_FOUND: "This room could not be found.",
  ROOM_PROPERTY_MISMATCH: "This room does not belong to the selected property.",
  ROOM_UNAVAILABLE: "This room is no longer available.",
  BOOKING_NOT_FOUND: "Booking not found.",
  BOOKING_NOT_CANCELLABLE: "This booking cannot be cancelled.",
  BOOKING_PAID:
    "This booking has already been paid for. Contact our team to cancel and arrange a refund.",
};

/**
 * Result shapes are explicit unions so a caller can narrow on `error`.
 * Without the `error?: undefined` arm, TypeScript refuses `result.error`
 * on the success branch and every call site ends up casting.
 */
export type BookingActionResult =
  | { success: true; booking?: unknown; error?: undefined }
  | { success?: undefined; booking?: undefined; error: string };

function friendlyBookingError(
  error: { code?: string; message: string },
  context: string
): { error: string } {
  // 23P01 = exclusion constraint (overlapping booking), 23514 = check constraint
  if (error.code === "23P01") {
    return { error: bookingErrorMessages.ROOM_UNAVAILABLE };
  }
  if (error.code === "23514") {
    return { error: bookingErrorMessages.INVALID_DATES };
  }

  const known = bookingErrorMessages[error.message];
  if (known) return { error: known };

  // Anything unrecognised is a bug or a database detail. It gets a
  // correlation id and a generic sentence, not error.message.
  return fail({ message: MESSAGES.generic, cause: error, context });
}

export async function createBooking(
  formData: FormData
): Promise<BookingActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: bookingErrorMessages.AUTH_REQUIRED };
  }

  // Bookings lock inventory, so this is the limit that protects supply
  // rather than just CPU. Counted per user AND per address — see
  // src/lib/rate-limit.ts for why a campus NAT needs both.
  const limit = await limitBy("booking", { userId: user.id });
  if (!limit.ok) {
    logSecurityEventAsync({
      action: "rate_limit.exceeded",
      result: "denied",
      actorId: user.id,
      resourceType: "booking",
      detail: { limit: "booking", scope: limit.scope },
    });
    return { error: TOO_MANY_REQUESTS };
  }

  const parsed = bookingSchema.safeParse({
    roomId: formData.get("roomId"),
    propertyId: formData.get("propertyId"),
    campusSlug: formData.get("campusSlug"),
    checkInDate: formData.get("checkInDate"),
    specialRequests: formData.get("specialRequests") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? MESSAGES.invalidInput };
  }

  const { roomId, propertyId, campusSlug, checkInDate, specialRequests } =
    parsed.data;

  // Availability, pricing, the booking insert, the room reservation, the
  // reservation clock and the queued email all happen atomically in the
  // database under a row lock. The tenancy is a fixed year and the total
  // is read from the room, so neither the term nor the amount can be set
  // by the client — see create_booking in 015_booking_expiry.sql.
  const { data: booking, error } = await supabase.rpc("create_booking", {
    p_room_id: roomId,
    p_property_id: propertyId,
    p_check_in_date: checkInDate,
    p_special_requests: specialRequests || null,
  });

  if (error) {
    return friendlyBookingError(error, "createBooking");
  }

  logSecurityEventAsync({
    action: "booking.created",
    result: "allowed",
    actorId: user.id,
    resourceType: "booking",
    resourceId: booking?.id,
    detail: { room_id: roomId, property_id: propertyId, check_in: checkInDate },
  });

  // The confirmation email is already queued in the same transaction as
  // the booking. Delivering it happens after the response, so a slow mail
  // provider cannot make a successful booking feel like a failed one.
  drainAfterResponse();

  revalidatePath(`/${campusSlug}/dashboard`);
  revalidatePath(`/${campusSlug}/property`);

  return { success: true, booking };
}

export async function cancelBooking(
  bookingId: string,
  campusSlug: string
): Promise<BookingActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const parsed = z
    .object({
      bookingId: z.string().uuid(),
      campusSlug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
    })
    .safeParse({ bookingId, campusSlug });

  if (!parsed.success) {
    return { error: bookingErrorMessages.BOOKING_NOT_FOUND };
  }

  const limit = await limitBy("bookingCancel", { userId: user.id });
  if (!limit.ok) {
    return { error: TOO_MANY_REQUESTS };
  }

  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: parsed.data.bookingId,
  });

  if (error) {
    return friendlyBookingError(error, "cancelBooking");
  }

  logSecurityEventAsync({
    action: "booking.cancelled",
    result: "allowed",
    actorId: user.id,
    resourceType: "booking",
    resourceId: parsed.data.bookingId,
  });

  drainAfterResponse();

  revalidatePath(`/${parsed.data.campusSlug}/dashboard`);

  return { success: true };
}
