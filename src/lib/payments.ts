import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBookingEvent } from "@/lib/email";
import { channelToMethod, chargeCoversBooking } from "@/lib/payments-logic";
import type { PaystackChargeData } from "@/lib/paystack";

/**
 * Records a verified successful Paystack charge against its booking.
 * Idempotent: safe to call from both the webhook and the browser
 * callback for the same charge — the unique reference index (007) makes
 * the second write a no-op, and the one-success-per-booking index
 * rejects a duplicate payment under a different reference.
 *
 * Amounts are validated against the booking server-side; the charge
 * itself was created with the secret key, so a mismatch means a bug or
 * tampering and the charge is not recorded.
 */
export async function recordSuccessfulCharge(
  data: PaystackChargeData
): Promise<{ ok: boolean; reason?: string }> {
  if (data.status !== "success") {
    return { ok: false, reason: "charge is not successful" };
  }

  const bookingId = data.metadata?.booking_id;
  if (!bookingId) {
    return { ok: false, reason: "charge has no booking_id metadata" };
  }

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("id, total_amount, currency, status")
    .eq("id", bookingId)
    .is("deleted_at", null)
    .single();

  if (!booking) {
    return { ok: false, reason: `booking ${bookingId} not found` };
  }

  if (!chargeCoversBooking(data.amount, data.currency, booking.total_amount)) {
    const expectedKobo = Math.round(Number(booking.total_amount) * 100);
    return {
      ok: false,
      reason: `amount mismatch: charged ${data.amount} ${data.currency}, booking expects ${expectedKobo} NGN`,
    };
  }

  const { data: inserted, error } = await admin
    .from("payments")
    .upsert(
      {
        booking_id: bookingId,
        amount: data.amount / 100,
        currency: "NGN",
        payment_method: channelToMethod(data.channel),
        status: "success",
        transaction_reference: data.reference,
        paid_at: data.paid_at ?? new Date().toISOString(),
        metadata: {
          provider: "paystack",
          channel: data.channel,
          gateway_response: data.gateway_response ?? null,
          customer_email: data.customer?.email ?? null,
        },
      },
      { onConflict: "transaction_reference", ignoreDuplicates: true }
    )
    .select();

  if (error) {
    // 23505 = the booking already has a successful payment under a
    // different reference; treat as recorded (needs manual refund review)
    if (error.code === "23505") {
      console.error(
        `Paystack: booking ${bookingId} paid twice — reference ${data.reference} not recorded, review for refund`
      );
      return { ok: true };
    }
    return { ok: false, reason: error.message };
  }

  // A non-empty result means this call inserted the row (not an
  // idempotent duplicate from webhook+callback both firing), so the
  // "payment received" email is sent exactly once.
  if (inserted && inserted.length > 0) {
    await notifyBookingEvent(bookingId, "paid");
  }

  return { ok: true };
}
