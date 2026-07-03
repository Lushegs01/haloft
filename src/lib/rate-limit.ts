import { headers } from "next/headers";

/**
 * Lightweight fixed-window rate limiter for server actions.
 *
 * NOTE: this is an in-memory limiter scoped to a single serverless
 * instance. It stops naive floods and is fine for launch traffic, but
 * it does NOT share state across instances or survive cold starts. For
 * strong, distributed limits, swap the store for Upstash Redis
 * (@upstash/ratelimit) — the call sites and return shape stay the same.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

/** A best-effort client identifier from proxy headers. */
export async function clientKey(scope: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

/**
 * Returns { ok: false } if the identifier has exceeded `limit` requests
 * within `windowMs`. Fails open on unexpected errors — a limiter bug
 * must never take down a core flow.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterMs?: number } {
  try {
    const now = Date.now();
    sweep(now);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true };
    }

    if (bucket.count >= limit) {
      return { ok: false, retryAfterMs: bucket.resetAt - now };
    }

    bucket.count += 1;
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
