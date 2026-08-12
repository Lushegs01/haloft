"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import { limitBy, TOO_MANY_REQUESTS } from "@/lib/rate-limit";
import { logSecurityEventAsync } from "@/lib/security-log";
import { fail, MESSAGES } from "@/lib/errors";
import { z } from "zod";

/**
 * The finance queue's write side.
 *
 * Recording a refund is not a database update — it is a refund at
 * Paystack, and then a record of it here. This action is the second half:
 * it books the movement, discharges the obligation the anomaly raised,
 * and moves the payment out of the queue. The money itself is moved in
 * the Paystack dashboard, and the reference from that refund is what
 * `reference` carries, so the two sides can be tied together later.
 *
 * Everything transactional lives in `record_refund` /
 * `resolve_payment_reconciliation` (migration 014) so the ledger stays
 * balanced whatever happens here.
 */

const uuid = z.string().uuid();

const refundSentinels: Record<string, string> = {
  ADMIN_ONLY: MESSAGES.unauthorized,
  PAYMENT_NOT_FOUND: MESSAGES.notFound,
  INVALID_AMOUNT: "Enter a refund amount greater than zero.",
  REFUND_EXCEEDS_PAYMENT: "That is more than this payment has left to refund.",
  INVALID_RECONCILIATION_STATUS: "That is not a status this payment can move to.",
  BOOKING_NOT_FOUND: MESSAGES.notFound,
  PAYOUT_EXCEEDS_PAYABLE: "That is more than this booking owes the landlord.",
};

export async function recordRefund(formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: MESSAGES.unauthorized };

  const limit = await limitBy("adminMutation", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  const parsed = z
    .object({
      paymentId: uuid,
      amount: z.coerce.number().positive().max(1_000_000_000),
      reference: z.string().max(200).optional(),
      notes: z.string().max(2000).optional(),
    })
    .safeParse({
      paymentId: formData.get("paymentId"),
      amount: formData.get("amount"),
      reference: (formData.get("reference") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? MESSAGES.invalidInput };
  }

  const { error } = await supabase.rpc("record_refund", {
    p_payment_id: parsed.data.paymentId,
    p_amount: parsed.data.amount,
    p_reference: parsed.data.reference,
    p_notes: parsed.data.notes,
  });

  if (error) {
    const known = refundSentinels[error.message];
    if (known) return { error: known };
    return fail({
      message: "Could not record that refund.",
      cause: error,
      context: "recordRefund",
      detail: { paymentId: parsed.data.paymentId, amount: parsed.data.amount },
    });
  }

  logSecurityEventAsync({
    action: "payment.refunded",
    result: "allowed",
    actorId: user.id,
    resourceType: "payment",
    resourceId: parsed.data.paymentId,
    detail: { amount: parsed.data.amount, reference: parsed.data.reference },
  });

  revalidatePath("/admin/finance");
  return { success: true };
}

export async function resolveReconciliation(formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: MESSAGES.unauthorized };

  const parsed = z
    .object({
      paymentId: uuid,
      status: z.enum(["pending_review", "pending_refund", "resolved", "written_off"]),
      notes: z.string().max(2000).optional(),
    })
    .safeParse({
      paymentId: formData.get("paymentId"),
      status: formData.get("status"),
      notes: (formData.get("notes") as string) || undefined,
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? MESSAGES.invalidInput };
  }

  const { error } = await supabase.rpc("resolve_payment_reconciliation", {
    p_payment_id: parsed.data.paymentId,
    p_status: parsed.data.status,
    p_notes: parsed.data.notes,
  });

  if (error) {
    const known = refundSentinels[error.message];
    if (known) return { error: known };
    return fail({
      message: MESSAGES.updateFailed,
      cause: error,
      context: "resolveReconciliation",
      detail: { paymentId: parsed.data.paymentId, status: parsed.data.status },
    });
  }

  logSecurityEventAsync({
    action: "payment.reconciled",
    result: "allowed",
    actorId: user.id,
    resourceType: "payment",
    resourceId: parsed.data.paymentId,
    detail: { to: parsed.data.status },
  });

  revalidatePath("/admin/finance");
  return { success: true };
}

export async function recordLandlordPayout(formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: MESSAGES.unauthorized };

  const parsed = z
    .object({
      bookingId: uuid,
      amount: z.coerce.number().positive().max(1_000_000_000),
      reference: z.string().max(200).optional(),
      notes: z.string().max(2000).optional(),
    })
    .safeParse({
      bookingId: formData.get("bookingId"),
      amount: formData.get("amount"),
      reference: (formData.get("reference") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? MESSAGES.invalidInput };
  }

  const { error } = await supabase.rpc("record_landlord_payout", {
    p_booking_id: parsed.data.bookingId,
    p_amount: parsed.data.amount,
    p_reference: parsed.data.reference,
    p_notes: parsed.data.notes,
  });

  if (error) {
    const known = refundSentinels[error.message];
    if (known) return { error: known };
    return fail({
      message: "Could not record that payout.",
      cause: error,
      context: "recordLandlordPayout",
      detail: { bookingId: parsed.data.bookingId, amount: parsed.data.amount },
    });
  }

  logSecurityEventAsync({
    action: "payout.recorded",
    result: "allowed",
    actorId: user.id,
    resourceType: "booking",
    resourceId: parsed.data.bookingId,
    detail: { amount: parsed.data.amount, reference: parsed.data.reference },
  });

  revalidatePath("/admin/finance");
  return { success: true };
}
