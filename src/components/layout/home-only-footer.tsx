"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Gates the site footer to the campus home page.
 *
 * Everything else under /[campus] — the dashboard, search, a listing, the
 * booking flow — is an app surface with its own bottom bar, and a full
 * marketing footer under it reads as the page having ended twice.
 *
 * The footer is passed in as `children` so it stays a Server Component:
 * this gate is the only thing that ships to the browser.
 */
export function HomeOnlyFooter({
  campusSlug,
  children,
}: {
  campusSlug: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (pathname !== `/${campusSlug}`) return null;
  return <>{children}</>;
}
