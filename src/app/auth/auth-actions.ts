"use server";

import { limitBy, TOO_MANY_REQUESTS } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { z } from "zod";

/**
 * The gate in front of the auth screens.
 *
 * ── Why this exists at all ──────────────────────────────────
 *
 * The sign-in and sign-up pages call `supabase.auth.*` straight from the
 * browser. That is the normal Supabase pattern and it is fine — but it
 * means nothing of ours sits in front of them, so there was no login
 * rate limiting, no signup rate limiting, and no record of a failed
 * attempt anywhere we can query. Supabase has its own limits; they are
 * per-project and not visible to us, so "was this account being
 * brute-forced on Tuesday?" had no answer.
 *
 * These actions do not perform the authentication — the client still
 * does, so the session lands in the browser where it belongs. They are
 * the check that runs first, and the place a refusal is recorded.
 *
 * ── Why the email is a limit dimension ──────────────────────
 *
 * Limiting sign-in by IP alone protects the server and nobody's account:
 * a distributed attempt on one address never trips it. Limiting by email
 * alone lets one host walk a list of accounts. So both are counted, and
 * the strictest verdict wins — see src/lib/rate-limit.ts.
 *
 * ── What the caller is told ─────────────────────────────────
 *
 * A refusal is a refusal. It never says whether the email exists, and it
 * reads identically for a real account and an invented one, because the
 * difference is exactly what an attacker is probing for.
 */

const emailSchema = z.string().email().max(320);

export interface AuthGateResult {
  ok: boolean;
  error?: string;
}

async function gate(
  limit: "authSignIn" | "authSignUp" | "authMagicLink" | "authPasswordReset",
  action: "auth.signin" | "auth.signup" | "auth.magic_link" | "auth.password_reset",
  email: string
): Promise<AuthGateResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const normalised = parsed.data.trim().toLowerCase();
  const result = await limitBy(limit, { identifier: normalised });

  if (!result.ok) {
    await logSecurityEvent({
      action: "rate_limit.exceeded",
      result: "denied",
      resourceType: "auth",
      // The address, not the account: there may not be an account, and
      // recording which addresses were tried is the point.
      resourceId: normalised,
      detail: { limit, scope: result.scope },
    });
    return { ok: false, error: TOO_MANY_REQUESTS };
  }

  return { ok: true };
}

export async function guardSignIn(email: string): Promise<AuthGateResult> {
  return gate("authSignIn", "auth.signin", email);
}

export async function guardSignUp(email: string): Promise<AuthGateResult> {
  return gate("authSignUp", "auth.signup", email);
}

export async function guardMagicLink(email: string): Promise<AuthGateResult> {
  return gate("authMagicLink", "auth.magic_link", email);
}

export async function guardPasswordReset(email: string): Promise<AuthGateResult> {
  return gate("authPasswordReset", "auth.password_reset", email);
}

/**
 * Records how an attempt ended, once the client knows.
 *
 * Called after the Supabase call returns, so the trail has the outcome
 * and not just the attempt. It carries no credential and never fails the
 * caller — a logging problem must not become a sign-in problem.
 */
export async function recordAuthOutcome(
  action: "auth.signin" | "auth.signup" | "auth.magic_link" | "auth.password_reset",
  email: string,
  succeeded: boolean
): Promise<void> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return;

  await logSecurityEvent({
    action,
    result: succeeded ? "allowed" : "denied",
    resourceType: "auth",
    resourceId: parsed.data.trim().toLowerCase(),
  });
}
