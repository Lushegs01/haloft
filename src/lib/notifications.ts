import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBookingEvent, type BookingEmailEvent } from "@/lib/email";

/**
 * Delivery for the notification outbox.
 *
 * ── The problem this replaces ───────────────────────────────
 *
 * Booking creation and payment recording used to do their database work
 * and then `await` an HTTPS call to Resend before returning. Two things
 * follow from that, and both are bad:
 *
 *   - the student's checkout is as slow as the mail provider's worst
 *     minute, on a path where the money has already moved;
 *   - a mail failure surfaces as a failed action. The payment IS
 *     recorded, the room IS held, and the screen says something went
 *     wrong. That is the worst possible thing to tell someone who has
 *     just been charged.
 *
 * ── What happens now ────────────────────────────────────────
 *
 * The database enqueues the event in the SAME transaction that records
 * the money (see `enqueue_notification`, migration 014). Nothing can be
 * charged without its email being queued, and nothing can be queued for a
 * charge that rolled back. Delivery is a separate step:
 *
 *     transaction commits
 *          ↓
 *     outbox row exists
 *          ↓
 *     drain, after the response is sent (Next's `after`)
 *          ↓
 *     cron sweeps whatever that missed
 *
 * `after()` covers the common case in about a second; the cron is what
 * makes it reliable, because a serverless instance can be recycled
 * mid-callback and a queue nobody sweeps is just a slower way to lose
 * mail.
 *
 * Claiming uses FOR UPDATE SKIP LOCKED, so the drain and the cron can run
 * at the same time without double sending. Failures back off; after
 * max_attempts a row is marked dead and stays visible.
 */

interface OutboxRow {
  id: string;
  topic: string;
  event: string;
  subject_type: string;
  subject_id: string;
  payload: Record<string, unknown> | null;
  attempts: number;
}

const BOOKING_EVENTS: BookingEmailEvent[] = [
  "received",
  "confirmed",
  "paid",
  "cancelled",
];

function isBookingEmailEvent(event: string): event is BookingEmailEvent {
  return (BOOKING_EVENTS as string[]).includes(event);
}

/**
 * Sends one queued event. Returns an error string rather than throwing,
 * because the caller has to record the outcome either way.
 */
async function deliver(row: OutboxRow): Promise<string | null> {
  try {
    if (row.topic === "booking" && row.subject_type === "booking") {
      if (isBookingEmailEvent(row.event)) {
        await notifyBookingEvent(row.subject_id, row.event);
        return null;
      }
      // 'expired' has no student-facing template yet. Acknowledge it
      // rather than retrying forever against a template that does not
      // exist — the booking's cancellation is already visible in the
      // dashboard, and audit_logs has the transition.
      return null;
    }

    if (row.topic === "finance") {
      // Anomalies are worked from the finance queue in the admin, which
      // reads the database directly. There is nothing to send; the row
      // exists so the queue has a timestamped record of when the anomaly
      // was noticed.
      console.warn(
        `[outbox] finance anomaly on ${row.subject_type} ${row.subject_id}:`,
        row.payload
      );
      return null;
    }

    return `no handler for ${row.topic}/${row.event}`;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

export interface DrainResult {
  claimed: number;
  sent: number;
  failed: number;
}

/**
 * Claims up to `limit` events and delivers them.
 *
 * Safe to call concurrently with itself and with the cron: the claim is
 * what serialises, not this function.
 */
export async function drainNotifications(
  limit = 25,
  worker = "inline"
): Promise<DrainResult> {
  const result: DrainResult = { claimed: 0, sent: 0, failed: 0 };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // No service role key configured (local dev). Nothing to drain.
    return result;
  }

  const { data, error } = await admin.rpc("claim_notifications", {
    p_limit: limit,
    p_worker: worker,
  });

  if (error) {
    console.error(`[outbox] could not claim: ${error.message}`);
    return result;
  }

  const rows = (data ?? []) as unknown as OutboxRow[];
  result.claimed = rows.length;

  // Sequential on purpose: these are transactional emails at booking
  // volume, and a burst of parallel sends is how you get rate limited by
  // the mail provider on the day it matters.
  for (const row of rows) {
    const failure = await deliver(row);

    const { error: completeError } = await admin.rpc("complete_notification", {
      p_id: row.id,
      p_ok: failure === null,
      p_error: failure,
    });

    if (completeError) {
      console.error(`[outbox] could not settle ${row.id}: ${completeError.message}`);
    }

    if (failure === null) result.sent += 1;
    else result.failed += 1;
  }

  return result;
}

/**
 * Drains after the response has been sent.
 *
 * `after()` runs the callback once the response is flushed, so the
 * student's page is not waiting on Resend. If the instance is torn down
 * before it runs, the rows stay claimable and the cron picks them up —
 * which is exactly why the outbox exists and this is not just a
 * `void sendEmail()`.
 */
export function drainAfterResponse(limit = 10): void {
  try {
    // Registered synchronously: `after()` has to be called while the
    // request scope is still open, so this cannot be deferred behind a
    // dynamic import or a promise.
    after(async () => {
      try {
        await drainNotifications(limit, "after");
      } catch (e) {
        console.error("[outbox] drain after response failed:", e);
      }
    });
  } catch {
    // Called outside a request scope (a script, a test). The cron is the
    // safety net, so this is not worth surfacing.
  }
}
