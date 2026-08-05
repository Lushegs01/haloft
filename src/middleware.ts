import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";

/**
 * Supabase names its auth cookies `sb-<project-ref>-auth-token[.N]`. If none
 * of them are present the visitor has no session to refresh or validate, and
 * `getUser()` would only tell us what we already know.
 */
function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Local dev without env vars: skip session refresh instead of crashing
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const path = request.nextUrl.pathname;

  // Anonymous visitor on a gated route: nothing to validate, so skip the
  // round-trip to the auth server and apply the one rule that still
  // matters. This is the common case on a launch day — thousands of
  // students arrive signed out.
  if (!hasAuthCookie(request)) {
    if (path.startsWith("/admin")) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("next", path);
      return NextResponse.redirect(signInUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth for /admin: bounce unauthenticated users before the
  // route renders. Role (admin/super_admin) is still enforced in the admin
  // layout and by RLS — this only cuts off the anonymous case early.
  if (path.startsWith("/admin") && !user) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("next", path);
    return NextResponse.redirect(signInUrl);
  }

  // Signed-in users have no reason to see the auth screens
  if ((path === "/auth/signin" || path === "/auth/signup") && user) {
    return NextResponse.redirect(new URL(`/${DEFAULT_CAMPUS_SLUG}`, request.url));
  }

  return supabaseResponse;
}

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  /*
   * Only the routes that actually need a session. Public browsing — the
   * landing page, a campus, search, a listing, the legal pages — is
   * anonymous and cacheable, and running session refresh across it would
   * put an auth round-trip in front of every page view and stop those
   * routes being served from the edge.
   *
   * The header's signed-in state does not depend on this: it reads the
   * session in the browser, where the Supabase client refreshes its own
   * token. Server code that reads the user (dashboard, booking, admin,
   * server actions invoked from those routes) is all covered below.
   */
  matcher: [
    "/admin/:path*",
    "/auth/:path*",
    "/payment/:path*",
    "/:campus/dashboard",
    "/:campus/property/:slug/booking",
  ],
};
