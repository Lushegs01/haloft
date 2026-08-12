import { getRequestContext } from "@/lib/request-context";

/**
 * Distributed fixed-window rate limiting.
 *
 * ── Why this is not a Map any more ──────────────────────────
 *
 * The previous limiter counted in a module-level `Map`. On a serverless
 * platform that is per-instance state: three warm instances each granted
 * the full allowance, so a nominal "10 per minute" was 30, and a cold
 * start reset the count to zero. It stopped a naive loop from one tab and
 * nothing else.
 *
 * Counters now live in Upstash Redis, shared by every instance, reached
 * over its REST API — no client library, no connection pool, nothing to
 * keep warm. Set:
 *
 *     UPSTASH_REDIS_REST_URL
 *     UPSTASH_REDIS_REST_TOKEN
 *
 * With those unset (local dev, CI) it falls back to the in-memory
 * counter, which is honest about being per-instance. Production without
 * them is a misconfiguration and says so once, loudly, in the log.
 *
 * ── Why more than the IP ────────────────────────────────────
 *
 * A university NAT puts an entire campus behind one address. Limiting on
 * IP alone means the first student to open the booking form spends the
 * bucket for everybody in the hall. So a call is limited on every
 * dimension it has, and the strictest verdict wins:
 *
 *     user id  — the real subject, when there is a session
 *     identifier — the thing being attacked, e.g. the email on a sign-in
 *     ip       — the fallback, with a wider allowance when a user id is
 *                also present, so shared egress does not punish everyone
 *
 * Fixed windows, not sliding: a burst at a window boundary can pass up
 * to 2× the limit. For "stop a script", which is what this is for, that
 * is fine and much cheaper than a sorted set per caller.
 */

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs?: number;
  /** Which dimension refused, for the log. Never shown to the caller. */
  scope?: string;
}

export interface RateLimitOptions {
  /** Namespace, e.g. "booking" or "auth:signin". Keep it stable. */
  action: string;
  /** Requests allowed per window for the primary dimension. */
  limit: number;
  windowMs: number;
  /** The signed-in user, when there is one. */
  userId?: string | null;
  /** Extra dimension: the email being signed in to, the booking being paid. */
  identifier?: string | null;
  /**
   * IP allowance multiplier when a user id is also being counted. A
   * shared campus egress carries many legitimate users; the per-user
   * bucket is what actually constrains any one of them.
   */
  natFactor?: number;
}

const DEFAULT_NAT_FACTOR = 10;
const REDIS_TIMEOUT_MS = 1000;

// ── In-memory fallback ──────────────────────────────────────

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

function memoryHit(key: string, limit: number, windowMs: number): RateLimitResult {
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
}

// ── Upstash REST ────────────────────────────────────────────

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

let warnedAboutMemoryStore = false;

function warnOnce() {
  if (warnedAboutMemoryStore) return;
  warnedAboutMemoryStore = true;
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN are not set. Limits are " +
        "per-instance only and reset on cold start — they are not enforcing " +
        "what they say they enforce."
    );
  }
}

/**
 * One pipeline, three commands:
 *
 *   SET key 0 PX <window> NX   create the window, only if absent
 *   INCR key                   count this request, keeping the TTL
 *   PTTL key                   how long until it resets
 *
 * SET-then-INCR rather than INCR-then-EXPIRE because the latter loses the
 * expiry if the process dies between the two, and a counter with no TTL
 * locks the caller out permanently.
 */
async function redisHit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const config = redisConfig();
  if (!config) return null;

  try {
    const res = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["SET", key, "0", "PX", String(windowMs), "NX"],
        ["INCR", key],
        ["PTTL", key],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const body = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    const count = Number(body?.[1]?.result);
    const ttl = Number(body?.[2]?.result);

    if (!Number.isFinite(count)) return null;

    if (count > limit) {
      return { ok: false, retryAfterMs: ttl > 0 ? ttl : windowMs };
    }
    return { ok: true };
  } catch {
    // A timeout or a network blip must not take down checkout. Fall
    // through to the in-memory counter rather than failing the request.
    return null;
  }
}

async function hit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const viaRedis = await redisHit(key, limit, windowMs);
  if (viaRedis) return viaRedis;
  if (!redisConfig()) warnOnce();
  return memoryHit(key, limit, windowMs);
}

/**
 * Checks every dimension the call has and returns the first refusal.
 *
 * Note that each dimension is counted whether or not an earlier one
 * refused: a caller who is over their per-user limit should still be
 * counted against the IP, or spreading a flood across accounts would
 * cost nothing.
 */
export async function rateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { action, limit, windowMs, userId, identifier } = options;
  const natFactor = options.natFactor ?? DEFAULT_NAT_FACTOR;

  const { ip } = await getRequestContext();

  const dimensions: Array<{ scope: string; key: string; limit: number }> = [];

  if (userId) {
    dimensions.push({ scope: "user", key: `rl:${action}:u:${userId}`, limit });
  }
  if (identifier) {
    dimensions.push({
      scope: "identifier",
      key: `rl:${action}:i:${identifier.toLowerCase()}`,
      limit,
    });
  }
  dimensions.push({
    scope: "ip",
    key: `rl:${action}:ip:${ip}`,
    // Shared egress gets room; a single anonymous caller does not.
    limit: userId ? limit * natFactor : limit,
  });

  const results = await Promise.all(
    dimensions.map(async (d) => ({
      scope: d.scope,
      result: await hit(d.key, d.limit, windowMs),
    }))
  );

  const refused = results.find((r) => !r.result.ok);
  if (refused) {
    return { ...refused.result, scope: refused.scope };
  }
  return { ok: true };
}

/**
 * The limits, in one place, so a call site cannot invent its own and so
 * changing one is a single edit.
 *
 * Windows are per identity, not per instance — see the note at the top.
 */
export const RATE_LIMITS = {
  /** Signing in: tight, and counted against the email as well as the IP. */
  authSignIn: { action: "auth:signin", limit: 8, windowMs: 300_000 },
  authSignUp: { action: "auth:signup", limit: 5, windowMs: 3_600_000 },
  authMagicLink: { action: "auth:magic", limit: 4, windowMs: 900_000 },
  authPasswordReset: { action: "auth:reset", limit: 4, windowMs: 3_600_000 },

  /** Bookings lock inventory, so this is the one that protects supply. */
  booking: { action: "booking", limit: 10, windowMs: 60_000 },
  bookingCancel: { action: "booking:cancel", limit: 20, windowMs: 60_000 },

  /** Checkout: generous enough for a flaky connection, no more. */
  payment: { action: "payment", limit: 10, windowMs: 60_000 },

  review: { action: "review", limit: 5, windowMs: 3_600_000 },
  media: { action: "media", limit: 60, windowMs: 300_000 },
  search: { action: "search", limit: 120, windowMs: 60_000 },
  adminMutation: { action: "admin:mutate", limit: 120, windowMs: 60_000 },
  adminBulk: { action: "admin:bulk", limit: 20, windowMs: 60_000 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

/** `rateLimit` with one of the named limits above. */
export async function limitBy(
  name: RateLimitName,
  extra: Pick<RateLimitOptions, "userId" | "identifier"> = {}
): Promise<RateLimitResult> {
  return rateLimit({ ...RATE_LIMITS[name], ...extra });
}

export const TOO_MANY_REQUESTS =
  "Too many attempts. Please wait a moment and try again.";
