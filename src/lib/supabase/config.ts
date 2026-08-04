/**
 * Supabase connection config, in one place.
 *
 * Both values are `NEXT_PUBLIC_*`, which means Next.js inlines them into the
 * bundle at BUILD time — setting them in the hosting dashboard does nothing
 * until the next deploy. When they are absent the browser client falls back
 * to a local URL, and every call fails with a bare "Failed to fetch" that
 * tells the user nothing. These helpers let callers detect that state and
 * say something actionable instead.
 */

/** True when both public Supabase vars were present at build time. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Developer-facing detail — logged, never shown to visitors. */
export const SUPABASE_CONFIG_HINT =
  "Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and " +
  "NEXT_PUBLIC_SUPABASE_ANON_KEY are missing from this build. Set them in " +
  "your hosting environment variables, then redeploy — NEXT_PUBLIC_* values " +
  "are baked in at build time, so saving them alone will not fix it.";

/** What a visitor sees when the backend is unreachable. */
export const SERVICE_UNAVAILABLE_MESSAGE =
  "We can't reach our servers right now. Please try again in a moment.";

/**
 * A failed `fetch` surfaces from supabase-js as an auth error whose message is
 * the browser's raw network text ("Failed to fetch", "NetworkError when
 * attempting to fetch resource", "Load failed" on Safari). Those are useless
 * to a visitor, so they get translated; genuine auth errors ("Invalid login
 * credentials", "User already registered") are already written for humans and
 * pass through untouched.
 */
export function describeAuthError(error: { message?: string } | null): string {
  const message = error?.message?.trim();
  if (!message) return SERVICE_UNAVAILABLE_MESSAGE;

  const networkFailure =
    /failed to fetch|networkerror|load failed|fetch failed|network request failed/i.test(
      message
    );

  return networkFailure ? SERVICE_UNAVAILABLE_MESSAGE : message;
}
