import { createAdminClient } from "@/lib/supabase/admin";
import { drainAfterResponse } from "@/lib/notifications";
import { logSecurityEvent } from "@/lib/security-log";
import type { PaystackChargeData } from "@/lib/paystack";

/**
 * Records a verified gateway charge against its booking.
 *
 * ── What this used to do, and why it changed ────────────────
 *
 * The old version validated the amount with `chargeAmount >= expected`,
 * upserted a payments row, and — if the insert collided with the
 * one-success-per-booking index — logged "booking paid twice" and
 * returned `{ ok: true }`. Three things were wrong with that:
 *
 *   1. An OVERPAYMENT passed the `>=` and was written down as an
 *      ordinary success. Nothing recorded that the student was owed the
 *      difference.
 *   2. A DUPLICATE charge was discarded. The database stayed consistent,
 *      which is what the unique index is for, but the second payment
 *      existed at Paystack and nowhere in Haloft.
 *   3. An UNDERPAID or wrong-currency charge was rejected without a row,
 *      so money that had genuinely moved left no trace on our side.
 *
 * ── What it does now ────────────────────────────────────────
 *
 * Everything — classification, insertion, the ledger decomposition, the
 * refund obligation, the queued email — happens inside
 * `record_gateway_charge` (migration 014), in ONE transaction. This
 * function's job is to unpack the Paystack payload, call it, and read the
 * outcome. It cannot half-succeed, because there is no longer a sequence
 * of statements here to half-succeed.
 *
 * Idempotent by reference: the webhook and the browser callback both
 * report the same charge and the second one is told `already_recorded`.
 */

export type ChargeOutcome =
  | "recorded"
  | "already_recorded"
  | "unattributable"
  | "rejected";

export interface RecordChargeResult {
  ok: boolean;
  outcome: ChargeOutcome;
  /** True when this charge pays for the booking. */
  settled: boolean;
  paymentId?: string;
  bookingId?: string;
  status?: string;
  anomaly?: string | null;
  reason?: string;
}

interface ChargeRpcResult {
  outcome: string;
  payment_id?: string;
  booking_id?: string;
  status?: string;
  settles_booking?: boolean;
  anomaly?: string | null;
  reconciliation_status?: string;
  amount?: number;
  expected_amount?: number;
  surplus?: number;
  shortfall?: number;
  reason?: string;
}

export async function recordSuccessfulCharge(
  data: PaystackChargeData
): Promise<RecordChargeResult> {
  if (data.status !== "success") {
    return {
      ok: false,
      outcome: "rejected",
      settled: false,
      reason: "charge is not successful",
    };
  }

  const admin = createAdminClient();

  // Paystack reports its own cut in `fees`, in kobo. Without it the
  // ledger would book the whole charge as ours and overstate revenue by
  // roughly 1.5% of everything, forever.
  const gatewayFee = Number.isFinite(Number(data.fees)) ? Number(data.fees) : 0;

  const { data: result, error } = await admin.rpc("record_gateway_charge", {
    p_provider: "paystack",
    p_reference: data.reference,
    p_booking_id: data.metadata?.booking_id ?? null,
    p_amount_minor: data.amount,
    p_currency: data.currency,
    p_channel: data.channel,
    p_paid_at: data.paid_at ?? new Date().toISOString(),
    p_gateway_fee_minor: gatewayFee,
    p_metadata: {
      provider: "paystack",
      channel: data.channel,
      gateway_response: data.gateway_response ?? null,
      customer_email: data.customer?.email ?? null,
    } as never,
  });

  if (error) {
    console.error(
      `[payments] record_gateway_charge failed for ${data.reference}: ${error.message}`
    );
    return {
      ok: false,
      outcome: "rejected",
      settled: false,
      reason: error.message,
    };
  }

  const outcome = result as unknown as ChargeRpcResult;

  if (outcome.outcome === "unattributable") {
    // The charge is on the books as a payment_exception, so finance can
    // see it. Loud, because it means metadata went missing or a booking
    // was deleted under a live checkout.
    console.error(
      `[payments] charge ${data.reference} could not be attached to a booking ` +
        `(${outcome.reason}) — parked in payment_exceptions`
    );
    await logSecurityEvent({
      action: "payment.anomaly",
      result: "error",
      resourceType: "payment",
      resourceId: data.reference,
      detail: { reason: outcome.reason, amount: outcome.amount },
    });
    return {
      ok: false,
      outcome: "unattributable",
      settled: false,
      reason: outcome.reason,
    };
  }

  const settled = outcome.settles_booking === true;

  if (outcome.outcome === "recorded") {
    await logSecurityEvent({
      action: outcome.anomaly ? "payment.anomaly" : "payment.recorded",
      result: "allowed",
      resourceType: "payment",
      resourceId: outcome.payment_id ?? data.reference,
      detail: {
        booking_id: outcome.booking_id,
        status: outcome.status,
        anomaly: outcome.anomaly,
        amount: outcome.amount,
        expected: outcome.expected_amount,
        surplus: outcome.surplus,
        shortfall: outcome.shortfall,
        settles_booking: settled,
      },
    });

    if (outcome.anomaly) {
      console.error(
        `[payments] ${outcome.anomaly} on ${data.reference}: charged ${outcome.amount}, ` +
          `booking ${outcome.booking_id} expects ${outcome.expected_amount}. ` +
          `Recorded as '${outcome.status}', reconciliation '${outcome.reconciliation_status}'.`
      );
    }

    // The emails for this charge are already queued in the same
    // transaction that recorded it. Deliver them once the response is on
    // its way out; the cron sweeps anything this misses.
    drainAfterResponse();
  }

  return {
    ok: true,
    outcome: outcome.outcome === "already_recorded" ? "already_recorded" : "recorded",
    settled,
    paymentId: outcome.payment_id,
    bookingId: outcome.booking_id,
    status: outcome.status,
    anomaly: outcome.anomaly ?? null,
  };
}

/**
 * The campus a charge belongs to, resolved through the database.
 *
 * The payment callback used to read `charge.metadata.campus_slug` and
 * redirect to it. The charge itself was verified against Paystack, so
 * this was never a way to fake a payment — but the destination of a
 * post-payment redirect was still being taken from a field that travels
 * with the transaction rather than from the booking, and metadata is the
 * wrong authority when the database holds the fact.
 *
 * Walks reference → payment (or intent) → booking → property → campus.
 * The intent branch matters: a charge that failed verification has no
 * payments row, and the student should still land on their own campus.
 *
 * Returns null when nothing can be resolved, so the caller can fall back
 * to the default campus rather than to whatever a string said.
 */
export async function campusSlugForReference(
  reference: string
): Promise<string | null> {
  try {
    const admin = createAdminClient();

    const { data: payment } = await admin
      .from("payments")
      .select("bookings(properties(campuses(slug)))")
      .eq("transaction_reference", reference)
      .maybeSingle();

    const fromPayment = payment?.bookings?.properties?.campuses?.slug;
    if (fromPayment) return fromPayment;

    const { data: intent } = await admin
      .from("payment_intents")
      .select("bookings(properties(campuses(slug)))")
      .eq("reference", reference)
      .maybeSingle();

    return intent?.bookings?.properties?.campuses?.slug ?? null;
  } catch (e) {
    console.error(`[payments] could not resolve campus for ${reference}:`, e);
    return null;
  }
}
