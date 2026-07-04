import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";

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

  const path = request.nextUrl.pathname;

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
  matcher: [
    /*
     * Run on page routes only. Excludes:
     * - api (routes authenticate themselves; the Paystack webhook must
     *   not have its request touched by session refresh)
     * - _next/static, _next/image, favicon.ico, and static asset files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
