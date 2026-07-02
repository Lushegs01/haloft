"use client";

import Link from "next/link";
import { Building2, Search, User, Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  campusSlug?: string;
  campusName?: string;
}

export function Header({ campusSlug, campusName }: HeaderProps) {
  const { user, loading } = useAuth();

  const navLinks = campusSlug
    ? [
        { href: `/${campusSlug}`, label: "Home" },
        { href: `/${campusSlug}/search`, label: "Search" },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href={campusSlug ? `/${campusSlug}` : "/"} className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Haloft
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {campusSlug && (
            <Link
              href={`/${campusSlug}/search`}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search className="h-4 w-4" />
              Search
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {campusSlug && user && !loading && (
            <Link href={`/${campusSlug}/dashboard`}>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Heart className="h-4 w-4" />
                <span className="sr-only">Favorites</span>
              </Button>
            </Link>
          )}

          {!loading && (
            <>
              {user ? (
                <Link href={`/${campusSlug ?? ""}/dashboard`}>
                  <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button variant="default" size="sm">Sign In</Button>
                </Link>
              )}
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger className="md:hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0 bg-transparent">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-6 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-base font-medium text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                {campusSlug && (
                  <Link
                    href={`/${campusSlug}/search`}
                    className="flex items-center gap-2 text-base font-medium text-foreground"
                  >
                    <Search className="h-4 w-4" />
                    Search Properties
                  </Link>
                )}
                <div className="border-t border-border pt-4">
                  {user ? (
                    <Link href={`/${campusSlug ?? ""}/dashboard`} className="flex items-center gap-2 text-base font-medium text-foreground">
                      <User className="h-4 w-4" />
                      Dashboard
                    </Link>
                  ) : (
                    <Link href="/auth/signin" className="text-base font-medium text-foreground">
                      Sign In / Sign Up
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
