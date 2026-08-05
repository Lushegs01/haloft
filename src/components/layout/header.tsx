"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Home, LogOut, Menu, Search, User, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { HaloftLogo } from "@/components/ui/logo";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";

interface HeaderProps {
  campusSlug?: string;
  campusName?: string;
}

export function Header({ campusSlug, campusName }: HeaderProps) {
  const { user, loading } = useAuth();
  const [condensed, setCondensed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const searchHref = `/${campusSlug ?? DEFAULT_CAMPUS_SLUG}/search`;

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const onKey = (event: KeyboardEvent) =>
      event.key === "Escape" && setAccountOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const initial = (user?.email?.[0] ?? "S").toUpperCase();
  const onSearchPage = pathname?.endsWith("/search");

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-[background-color,border-color,height] duration-300 ${
          condensed
            ? "border-b border-[var(--line)] bg-[rgba(247,247,242,0.88)] backdrop-blur-[10px] backdrop-saturate-150"
            : "border-b border-transparent bg-[var(--background)]"
        }`}
      >
        <div
          className={`shell flex items-center gap-5 transition-[height] duration-300 ${
            condensed ? "h-[62px]" : "h-[72px]"
          }`}
        >
          <Link
            href={campusSlug ? `/${campusSlug}` : "/"}
            aria-label="Haloft — home"
            className="shrink-0"
          >
            <HaloftLogo size={condensed ? 26 : 28} markId="app-header" />
          </Link>

          {campusSlug && !onSearchPage && (
            <Link
              href={searchHref}
              className="group mx-auto hidden h-10 max-w-sm flex-1 items-center gap-2.5 rounded-[10px] border border-[var(--line-strong)] bg-card px-3.5 text-[13.5px] text-muted-foreground transition-colors hover:border-[var(--ink-soft)] md:flex"
            >
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Search homes near {campusName ?? "campus"}
              </span>
            </Link>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {campusSlug && (
              <Link
                href={searchHref}
                className="inline-flex size-10 items-center justify-center rounded-[10px] text-ink transition-colors hover:bg-foreground/[0.05] md:hidden"
                aria-label="Search homes"
              >
                <Search className="size-[19px]" aria-hidden="true" />
              </Link>
            )}

            {!loading && !user && (
              <div className="hidden items-center gap-1.5 md:flex">
                <Link
                  href="/auth/signin"
                  className="rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-medium text-ink-soft transition-colors hover:text-ink"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="group inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[var(--navy)] pl-4 pr-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                >
                  Create account
                  <ArrowUpRight className="size-3.5 arrow-nudge" aria-hidden="true" />
                </Link>
              </div>
            )}

            {!loading && user && (
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="flex h-10 items-center gap-2 rounded-[10px] border border-[var(--line-strong)] pl-2.5 pr-3 transition-colors hover:border-[var(--ink-soft)]"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-[var(--navy)] text-[11px] font-semibold text-white">
                    {initial}
                  </span>
                  <span className="hidden text-[13px] font-medium text-ink sm:inline">
                    Account
                  </span>
                </button>

                <AnimatePresence>
                  {accountOpen && (
                    <motion.div
                      role="menu"
                      initial={reduced ? undefined : { opacity: 0, y: -6 }}
                      animate={reduced ? undefined : { opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-[12px] border border-[var(--line)] bg-card shadow-lifted"
                    >
                      <div className="border-b border-[var(--line)] px-4 py-3">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {user.email}
                        </p>
                      </div>
                      <div className="p-1.5">
                        <Link
                          href={`/${campusSlug ?? DEFAULT_CAMPUS_SLUG}/dashboard`}
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13.5px] text-ink transition-colors hover:bg-foreground/[0.05]"
                          role="menuitem"
                        >
                          <Home className="size-4 text-muted-foreground" aria-hidden="true" />
                          Bookings &amp; saved homes
                        </Link>
                        <form action="/auth/signout" method="post">
                          <button
                            type="submit"
                            className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-[13.5px] text-ink transition-colors hover:bg-foreground/[0.05]"
                            role="menuitem"
                          >
                            <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />
                            Sign out
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-mr-2 inline-flex size-10 items-center justify-center rounded-[10px] text-ink md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="size-[21px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-[var(--paper)] md:hidden"
            initial={reduced ? undefined : { opacity: 0, y: -8 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="shell flex h-[72px] shrink-0 items-center justify-between">
              <HaloftLogo size={28} markId="app-header-mobile" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="-mr-2 inline-flex size-11 items-center justify-center rounded-[10px] text-ink"
                aria-label="Close menu"
                autoFocus
              >
                <X className="size-[21px]" aria-hidden="true" />
              </button>
            </div>

            <nav className="shell flex flex-1 flex-col justify-center gap-1 pb-8" aria-label="Mobile">
              {[
                { href: campusSlug ? `/${campusSlug}` : "/", label: "Home" },
                { href: searchHref, label: "Find a home" },
                { href: "/#how-it-works", label: "How it works" },
                { href: "/#for-owners", label: "For property owners" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="border-b border-[var(--line)] py-5 text-[24px] font-medium tracking-[-0.03em] text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="shell flex flex-col gap-3 pb-[max(28px,env(safe-area-inset-bottom))]">
              {user ? (
                <>
                  <Link
                    href={`/${campusSlug ?? DEFAULT_CAMPUS_SLUG}/dashboard`}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-14 items-center justify-center rounded-[10px] bg-[var(--navy)] text-[15px] font-semibold text-white"
                  >
                    Bookings &amp; saved homes
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="inline-flex h-14 w-full items-center justify-center rounded-[10px] border border-[var(--line-strong)] text-[15px] font-medium text-ink"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-14 items-center justify-center rounded-[10px] bg-[var(--navy)] text-[15px] font-semibold text-white"
                  >
                    Create account
                  </Link>
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-14 items-center justify-center rounded-[10px] border border-[var(--line-strong)] text-[15px] font-medium text-ink"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campus pages keep a bottom bar on small screens — three
          destinations, each a distinct place to be. */}
      {campusSlug && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--line)] bg-[rgba(247,247,242,0.94)] backdrop-blur-[10px] pb-[env(safe-area-inset-bottom)] md:hidden"
          aria-label="Quick navigation"
        >
          <div className="flex h-16 items-stretch">
            {[
              { href: `/${campusSlug}`, label: "Home", icon: Home, match: (p: string) => p === `/${campusSlug}` },
              { href: `/${campusSlug}/search`, label: "Search", icon: Search, match: (p: string) => p.startsWith(`/${campusSlug}/search`) },
              {
                href: user ? `/${campusSlug}/dashboard` : "/auth/signin",
                label: user ? "Account" : "Sign in",
                icon: User,
                match: (p: string) => p.startsWith(`/${campusSlug}/dashboard`),
              },
            ].map((item) => {
              const active = pathname ? item.match(pathname) : false;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                    active ? "text-ink" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="size-[19px]" aria-hidden="true" />
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute top-0 h-0.5 w-10 rounded-full transition-opacity ${
                      active ? "bg-[var(--teal-deep)] opacity-100" : "opacity-0"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
