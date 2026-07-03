"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  User,
  Heart,
  Menu,
  X,
  Home,
  LogIn,
  ChevronDown,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  campusSlug?: string;
  campusName?: string;
}

export function Header({ campusSlug, campusName }: HeaderProps) {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "glass shadow-sm shadow-black/5"
            : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8 gap-4">

          {/* Logo */}
          <Link
            href={campusSlug ? `/${campusSlug}` : "/"}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-inter)" }}>H</span>
            </div>
            <span
              className="text-xl font-bold tracking-tight text-foreground hidden sm:block"
              style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
            >
              Haloft
            </span>
          </Link>

          {/* Centre: pill search bar (campus pages, desktop) */}
          {campusSlug && (
            <Link
              href={`/${campusSlug}/search`}
              className="hidden md:flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex-1 max-w-xs mx-auto group"
            >
              <Search className="h-4 w-4 shrink-0 group-hover:text-primary transition-colors" />
              <span>Search rooms near {campusName ?? "campus"}</span>
              <span className="ml-auto bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                Search
              </span>
            </Link>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Become a host — shown only on landing */}
            {!campusSlug && (
              <Link href="/auth/signin" className="hidden md:block">
                <Button variant="ghost" size="sm" className="text-sm font-medium">
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
                      className="flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 text-sm font-medium hover:shadow-md transition-all"
                    >
                      <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                        {initial}
                      </div>
                      <span className="hidden md:block text-foreground max-w-[80px] truncate">
                        {user.email?.split("@")[0]}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border bg-popover shadow-xl shadow-black/10 overflow-hidden animate-scale-in">
                        <div className="px-4 py-3 border-b border-border">
                          <p className="font-semibold text-sm text-foreground">{user.email?.split("@")[0]}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="p-1.5">
                          {campusSlug && (
                            <>
                              <Link
                                href={`/${campusSlug}/dashboard`}
                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <Home className="h-4 w-4 text-muted-foreground" />
                                Dashboard
                              </Link>
                              <Link
                                href={`/${campusSlug}/dashboard`}
                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
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
                              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                            >
                              <LogIn className="h-4 w-4 rotate-180" />
                              Sign Out
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                    <Link href="/auth/signin">
                      <Button variant="ghost" size="sm" className="font-medium">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button size="sm" className="font-semibold shadow-sm shadow-primary/20 rounded-full px-5">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-full border border-border bg-card hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background/98 backdrop-blur animate-slide-up">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {campusSlug && (
                <>
                  <Link
                    href={`/${campusSlug}`}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Home className="h-4 w-4 text-muted-foreground" />
                    Home
                  </Link>
                  <Link
                    href={`/${campusSlug}/search`}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                    Search Properties
                  </Link>
                </>
              )}
              <div className="pt-2 border-t border-border">
                {user ? (
                  <>
                    {campusSlug && (
                      <Link
                        href={`/${campusSlug}/dashboard`}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </Link>
                    )}
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border safe-area-pb">
          <div className="flex items-center justify-around h-16 px-2">
            <Link
              href={`/${campusSlug}`}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-muted transition-colors group"
            >
              <Home className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors font-medium">Home</span>
            </Link>
            <Link
              href={`/${campusSlug}/search`}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-muted transition-colors group"
            >
              <Search className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors font-medium">Search</span>
            </Link>
            <Link
              href={user ? `/${campusSlug}/dashboard` : "/auth/signin"}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-muted transition-colors group"
            >
              <Heart className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors font-medium">Saved</span>
            </Link>
            <Link
              href={user ? `/${campusSlug}/dashboard` : "/auth/signin"}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-muted transition-colors group"
            >
              <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors font-medium">Profile</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
