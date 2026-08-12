"use server";

import { createClient } from "@/lib/supabase/server";
import { paystackInitialize } from "@/lib/paystack";
import { bookingReference } from "@/lib/payments-logic";
import { limitBy, TOO_MANY_REQUESTS } from "@/lib/rate-limit";
import { logSecurityEventAsync } from "@/lib/security-log";
import { fail } from "@/lib/errors";
import { z } from "zod";

const bookingIdSchema = z.string().uuid();

const intentErrors: Record<string, string> = {
  AUTH_REQUIRED: "You must be signed in to pay for a booking.",
  BOOKING_NOT_FOUND: "Booking not found.",
  BOOKING_NOT_CONFIRMED:
    "This booking must be confirmed by our team before payment.",
  BOOKING_PAID: "This booking has already been paid for.",
};

/**
 * Starts — or resumes — a Paystack checkout for the student's own
 * confirmed booking.
 *
 * ── Why an intent, rather than a fresh reference each time ──
 *
 * The old version minted `HLF-<booking>-<Date.now()>` on every click. A
 * student who opened the checkout, thought better of it, and came back
 * ten minutes later left two live transactions at Paystack for one
 * booking; a flaky connection could leave five. Only one of them could
 * ever be paid, but all of them sat in Paystack's dashboard as
 * abandoned transactions against the same booking, and reconciling that
 * by hand is exactly the work this system is supposed to remove.
 *
 * `create_payment_intent` (migration 014) holds at most one live intent
 * per booking, behind a partial unique index. Coming back reuses the same
 * reference and the same Paystack authorization URL — which is also
 * required, not merely tidy: Paystack refuses to initialize a reference
 * it has already seen, so a reused reference MUST reuse its stored URL.
 *
 * The amount still comes from the booking row, never from the client, and
 * the intent records what it was — so a price change between opening the
 * checkout and paying supersedes the intent instead of charging the old
 * figure.
 */
export type InitializePaymentResult =
  | { url: string; error?: undefined }
  | { url?: undefined; error: string };

export async function initializePayment(
  bookingId: string
): Promise<InitializePaymentResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: intentErrors.AUTH_REQUIRED };
  }

  const limit = await limitBy("payment", { userId: user.id, identifier: bookingId });
  if (!limit.ok) {
    logSecurityEventAsync({
      action: "rate_limit.exceeded",
      result: "denied",
      actorId: user.id,
      resourceType: "booking",
      resourceId: bookingId,
      detail: { limit: "payment", scope: limit.scope },
    });
    return { error: TOO_MANY_REQUESTS };
  }

  if (!bookingIdSchema.safeParse(bookingId).success) {
    return { error: intentErrors.BOOKING_NOT_FOUND };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return fail({
      message: "Payments are not configured yet. Please contact support.",
      cause: "NEXT_PUBLIC_SITE_URL is not set",
      context: "initializePayment",
    });
  }

  // Ownership, booking status and "already paid" are all checked inside
  // the function, under a row lock, so two tabs cannot both open a
  // checkout for a booking that is being paid right now.
  const { data: intent, error: intentError } = await supabase.rpc(
    "create_payment_intent",
    {
      p_booking_id: bookingId,
      p_reference: bookingReference(bookingId),
      p_provider: "paystack",
    }
  );

  if (intentError || !intent) {
    const known = intentErrors[intentError?.message ?? ""];
    if (known) {
      logSecurityEventAsync({
        action: "payment.initialized",
        result: "denied",
        actorId: user.id,
        resourceType: "booking",
        resourceId: bookingId,
        detail: { reason: intentError?.message },
      });
      return { error: known };
    }
    return fail({
      message: "Could not start the payment. Please try again.",
      cause: intentError,
      context: "initializePayment:create_payment_intent",
      detail: { bookingId },
    });
  }

  // A live intent that has already been through Paystack keeps its URL.
  if (intent.authorization_url) {
    return { url: intent.authorization_url };
  }

  try {
    const { authorizationUrl } = await paystackInitialize({
      email: user.email,
      amountKobo: Math.round(Number(intent.amount) * 100),
      reference: intent.reference,
      callbackUrl: `${siteUrl}/payment/callback`,
      // booking_id is what the webhook uses to attach the charge. The
      // campus is NOT carried here any more: the callback resolves it
      // from the booking, so the redirect cannot be steered by metadata.
      metadata: { booking_id: bookingId },
    });

    await supabase.rpc("attach_intent_authorization", {
      p_intent_id: intent.id,
      p_url: authorizationUrl,
    });

    logSecurityEventAsync({
      action: "payment.initialized",
      result: "allowed",
      actorId: user.id,
      resourceType: "booking",
      resourceId: bookingId,
      detail: { reference: intent.reference, amount: intent.amount },
    });

    return { url: authorizationUrl };
  } catch (e) {
    return fail({
      message: "Could not start the payment. Please try again.",
      cause: e,
      context: "initializePayment:paystack",
      detail: { bookingId, reference: intent.reference },
    });
  }
}
