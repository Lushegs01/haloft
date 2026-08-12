import crypto from "crypto";

/**
 * Authorisation for the scheduled endpoints.
 *
 * These routes free rooms and send mail, so they are not something an
 * anonymous caller should be able to trigger — not because a single run
 * is dangerous (the sweeper is idempotent) but because an unauthenticated
 * loop over them is a free way to make the database do work.
 *
 * `CRON_SECRET` is compared in constant time. A `==` here leaks the
 * secret one byte at a time to anyone patient enough to measure, which
 * is a strange corner to cut when the fix is one function call.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically
 * when the variable is set on the project; anything else can send the
 * same header, or `x-cron-secret`.
 *
 * With CRON_SECRET unset the routes refuse everything. That is the safe
 * default: an endpoint that silently accepts the world because a variable
 * is missing is how this goes wrong quietly.
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";

  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
