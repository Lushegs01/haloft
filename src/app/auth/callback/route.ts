import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";

// Only same-origin relative paths are allowed as a post-login target,
// so ?next= can't be used as an open redirect to an attacker's site.
function safeNext(raw: string | null): string {
  const fallback = `/${DEFAULT_CAMPUS_SLUG}`;
  if (!raw) return fallback;
  // Must be a single-slash-rooted path; reject "//host", "/\host", and absolute URLs
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_error`);
}
