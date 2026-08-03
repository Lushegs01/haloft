"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Heart,
  Menu,
  X,
  Home,
  LogIn,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { HaloftLogo } from "@/components/ui/logo";

interface HeaderProps {
  campusSlug?: string;
  campusName?: string;
}

export function Header({ campusSlug, campusName }: HeaderProps) {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenuOpen]);

  const initial = user?.email?.[0]?.toUpperCase() ?? "S";

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path);

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "glass shadow-sm shadow-black/5"
            : "bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50"
        }`}
      >
        <div
          className={`container mx-auto flex items-center justify-between gap-4 px-4 transition-all duration-300 lg:px-8 ${
            scrolled ? "h-16" : "h-20"
          }`}
        >
          {/* Logo with wordmark */}
          <Link
            href={campusSlug ? `/${campusSlug}` : "/"}
            className="group flex shrink-0 items-center gap-2"
          >
            <HaloftLogo size={30} className="transition-transform group-hover:scale-105" />
          </Link>

          {/* Centre: pill search bar (campus pages, desktop) */}
          {campusSlug && (
            <Link
              href={`/${campusSlug}/search`}
              className="group mx-auto hidden max-w-xs flex-1 items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/50 hover:shadow-premium md:flex"
            >
              <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
              <span className="truncate">Search rooms near {campusName ?? "campus"}</span>
              <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Search
              </span>
            </Link>
          )}

          {/* Right Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Become a host — shown only on landing */}
            {!campusSlug && (
              <Link href="/auth/signin" className="hidden md:block">
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-full text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  List your property
                </Button>
              </Link>
            )}

            {/* Campus: search icon for mobile */}
            {campusSlug && (
              <Link href={`/${campusSlug}/search`} className="md:hidden">
                <Button variant="ghost" size="icon" aria-label="Search">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Auth state */}
            {!loading && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserMenuOpen(!userMenuOpen);
                      }}
                      className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 text-sm font-medium transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <Menu className="hidden h-4 w-4 text-muted-foreground sm:block" />
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {initial}
                      </div>
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl shadow-black/10"
                        >
                          <div className="border-b border-border px-4 py-3">
                            <p className="text-sm font-semibold text-foreground">{user.email?.split("@")[0]}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="p-1.5">
                            {campusSlug && (
                              <>
                                <Link
                                  href={`/${campusSlug}/dashboard`}
                                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <Home className="h-4 w-4 text-muted-foreground" />
                                  Dashboard
                                </Link>
                                <Link
                                  href={`/${campusSlug}/dashboard`}
                                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <Heart className="h-4 w-4 text-muted-foreground" />
                                  Saved properties
                                </Link>
                              </>
                            )}
                            <div className="my-1 border-t border-border" />
                            <form action="/auth/signout" method="post">
                              <button
                                type="submit"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/5"
                              >
                                <LogIn className="h-4 w-4 rotate-180" />
                                Sign Out
                              </button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="hidden items-center gap-2 md:flex">
                    <Link href="/auth/signin">
                      <Button variant="ghost" size="sm" className="rounded-full font-medium">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button size="sm" className="rounded-full px-5 font-semibold shadow-sm shadow-primary/20">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="animate-slide-up border-t border-border bg-background/98 backdrop-blur md:hidden">
            <div className="container mx-auto space-y-1 px-4 py-4">
              {campusSlug && (
                <>
                  <Link
                    href={`/${campusSlug}`}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Home className="h-4 w-4 text-muted-foreground" />
                    Home
                  </Link>
                  <Link
                    href={`/${campusSlug}/search`}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                    Search Properties
                  </Link>
                </>
              )}
              <div className="border-t border-border pt-2">
                {user ? (
                  <>
                    {campusSlug && (
                      <Link
                        href={`/${campusSlug}/dashboard`}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        onClick={() => setMobileOpen(false)}
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </Link>
                    )}
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
                      >
                        <LogIn className="h-4 w-4 rotate-180" />
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex gap-3 px-4 py-2">
                    <Link href="/auth/signin" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full">Sign in</Button>
                    </Link>
                    <Link href="/auth/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full rounded-full">Sign up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom nav (campus pages only) */}
      {campusSlug && (
        <nav className="glass safe-area-pb fixed bottom-0 left-0 right-0 z-40 border-t border-border md:hidden">
          <div className="flex h-16 items-center justify-around px-2">
            <Link
              href={`/${campusSlug}`}
              className="group relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors hover:bg-muted"
            >
              <Home className={`h-5 w-5 transition-colors ${isActive(`/${campusSlug}`) && !isActive(`/${campusSlug}/search`) && !isActive(`/${campusSlug}/dashboard`) ? "fill-current text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive(`/${campusSlug}`) && !isActive(`/${campusSlug}/search`) && !isActive(`/${campusSlug}/dashboard`) ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                Home
              </span>
              {isActive(`/${campusSlug}`) && !isActive(`/${campusSlug}/search`) && !isActive(`/${campusSlug}/dashboard`) && (
                <span className="absolute top-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
            <Link
              href={`/${campusSlug}/search`}
              className="group relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors hover:bg-muted"
            >
              <Search className={`h-5 w-5 transition-colors ${isActive(`/${campusSlug}/search`) ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive(`/${campusSlug}/search`) ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                Search
              </span>
              {isActive(`/${campusSlug}/search`) && (
                <span className="absolute top-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
            <Link
              href={user ? `/${campusSlug}/dashboard` : "/auth/signin"}
              className="group relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors hover:bg-muted"
            >
              <Heart className={`h-5 w-5 transition-colors ${isActive(`/${campusSlug}/dashboard`) ? "fill-current text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive(`/${campusSlug}/dashboard`) ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                Saved
              </span>
              {isActive(`/${campusSlug}/dashboard`) && (
                <span className="absolute top-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
            <Link
              href={user ? `/${campusSlug}/dashboard` : "/auth/signin"}
              className="group relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors hover:bg-muted"
            >
              <User className={`h-5 w-5 transition-colors ${isActive(`/${campusSlug}/dashboard`) ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive(`/${campusSlug}/dashboard`) ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                Profile
              </span>
              {isActive(`/${campusSlug}/dashboard`) && (
                <span className="absolute top-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
