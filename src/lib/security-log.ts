import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestContext } from "@/lib/request-context";

/**
 * Structured security logging.
 *
 * `audit_logs` records what a row looked like before and after. That
 * answers "what changed", and only for changes that succeeded. It cannot
 * answer the questions actually asked after an incident:
 *
 *   - who tried to publish that listing, and were they refused?
 *   - which address were the failed sign-ins coming from?
 *   - did anyone touch payments between 14:00 and 15:00?
 *
 * So attempts are logged as well as outcomes, and refusals as well as
 * successes — `result: "denied"` is the interesting half.
 *
 * Writes go through the service role into `security_events`, which has no
 * write policy for anyone else: a compromised admin session cannot edit
 * or delete its own trail.
 *
 * Logging never throws and never blocks. A failure to record is logged to
 * stdout and the caller carries on — the alternative is a broken audit
 * trail taking down a booking.
 */

export type SecurityResult = "allowed" | "denied" | "error";

/**
 * The actions worth a row. Keeping them in a union means a typo is a
 * build error rather than a category that silently never gets queried.
 */
export type SecurityAction =
  | "auth.signin"
  | "auth.signup"
  | "auth.signout"
  | "auth.password_reset"
  | "auth.magic_link"
  | "booking.created"
  | "booking.cancelled"
  | "booking.status_changed"
  | "payment.initialized"
  | "payment.recorded"
  | "payment.anomaly"
  | "payment.refunded"
  | "payment.reconciled"
  | "payout.recorded"
  | "property.created"
  | "property.updated"
  | "property.deleted"
  | "property.duplicated"
  | "property.bulk_status"
  | "property.verification_changed"
  | "landlord.verification_changed"
  | "room.created"
  | "room.updated"
  | "room.deleted"
  | "room.availability_changed"
  | "media.uploaded"
  | "media.deleted"
  | "media.featured"
  | "media.rejected"
  | "review.submitted"
  | "admin.role_changed"
  | "rate_limit.exceeded";

export interface SecurityEvent {
  action: SecurityAction;
  result: SecurityResult;
  actorId?: string | null;
  actorRole?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  detail?: Record<string, unknown>;
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const context = await getRequestContext();
    const admin = createAdminClient();

    const { error } = await admin.rpc("log_security_event", {
      p_action: event.action,
      p_result: event.result,
      p_resource_type: event.resourceType ?? null,
      p_resource_id: event.resourceId ?? null,
      p_actor_id: event.actorId ?? null,
      p_actor_role: event.actorRole ?? null,
      p_ip: context.ip === "unknown" ? null : context.ip,
      p_user_agent: context.userAgent,
      p_request_id: context.requestId,
      p_detail: (event.detail ?? null) as never,
    });

    if (error) {
      console.error(`[security-log] ${event.action}: ${error.message}`);
    }
  } catch (e) {
    // Includes the case where the service role key is not configured —
    // local development, where there is nothing to protect.
    console.error(`[security-log] ${event.action} not recorded:`, e);
  }
}

/**
 * Fire-and-forget. Use where the caller is on a user's critical path and
 * the write is genuinely optional — a booking must not wait on its own
 * audit row.
 */
export function logSecurityEventAsync(event: SecurityEvent): void {
  void logSecurityEvent(event);
}
