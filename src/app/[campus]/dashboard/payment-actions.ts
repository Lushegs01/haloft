"use server";

import { createClient } from "@/lib/supabase/server";
import { paystackInitialize } from "@/lib/paystack";
import { bookingReference } from "@/lib/payments-logic";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { z } from "zod";

/**
 * Starts a Paystack checkout for the student's own confirmed booking.
 * The amount always comes from the booking row — never from the client.
 * Returns the Paystack authorization URL for the browser to open.
 */
export async function initializePayment(bookingId: string, campusSlug: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "You must be signed in to pay for a booking." };
  }

  const limit = rateLimit(await clientKey("payment"), 15, 60_000);
  if (!limit.ok) {
    return { error: "Too many attempts. Please wait a moment and try again." };
  }

  if (!z.string().uuid().safeParse(bookingId).success) {
    return { error: "Booking not found." };
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, student_id, status, total_amount, currency, payments(id, status)")
    .eq("id", bookingId)
    .is("deleted_at", null)
    .single();

  if (!booking || booking.student_id !== user.id) {
    return { error: "Booking not found." };
  }
  if (booking.status !== "confirmed") {
    return {
      error: "This booking must be confirmed by our team before payment.",
    };
  }
  if (booking.payments?.some((p) => p.status === "success")) {
    return { error: "This booking has already been paid for." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return { error: "Payments are not configured yet. Please contact support." };
  }

  const reference = bookingReference(bookingId);

  try {
    const { authorizationUrl } = await paystackInitialize({
      email: user.email,
      amountKobo: Math.round(Number(booking.total_amount) * 100),
      reference,
      callbackUrl: `${siteUrl}/payment/callback`,
      metadata: { booking_id: bookingId, campus_slug: campusSlug },
    });
    return { url: authorizationUrl };
  } catch (e) {
    console.error("Paystack initialize failed:", e);
    return { error: "Could not start the payment. Please try again." };
  }
}
