"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { HaloftLogo } from "@/components/ui/logo";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";

const NAV_LINKS = [
  { href: `/${DEFAULT_CAMPUS_SLUG}/search`, label: "Find a home" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-owners", label: "For property owners" },
  { href: "/#about", label: "About" },
];

export function Navbar() {
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page while the mobile sheet is open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
        condensed
          ? "border-b border-[var(--line)] bg-[rgba(247,247,242,0.86)] backdrop-blur-[10px] backdrop-saturate-150"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`shell flex items-center justify-between gap-6 transition-[height] duration-300 ${
          condensed ? "h-[62px]" : "h-[76px] sm:h-[84px]"
        }`}
      >
        <Link href="/" aria-label="Haloft — home" className="shrink-0">
          <HaloftLogo size={condensed ? 26 : 30} markId="nav" />
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative py-1 text-[13.5px] font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--teal-deep)] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            href="/auth/signin"
            className="rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-medium text-ink-soft transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href={`/${DEFAULT_CAMPUS_SLUG}/search`}
            className="group inline-flex h-11 items-center gap-1.5 rounded-[10px] bg-[var(--navy)] pl-5 pr-4 text-[13.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
          >
            Find a place
            <ArrowUpRight className="size-4 arrow-nudge" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-[10px] text-ink lg:hidden"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="size-[22px]" aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            className="fixed inset-0 z-[60] flex flex-col bg-[var(--paper)] lg:hidden"
            initial={reduced ? undefined : { opacity: 0, y: -10 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="shell flex h-[76px] shrink-0 items-center justify-between">
              <HaloftLogo size={30} markId="nav-mobile" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="-mr-2 inline-flex size-11 items-center justify-center rounded-[10px] text-ink"
                aria-label="Close menu"
                autoFocus
              >
                <X className="size-[22px]" aria-hidden="true" />
              </button>
            </div>

            <nav className="shell flex flex-1 flex-col justify-center gap-1 pb-8" aria-label="Mobile">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={reduced ? undefined : { opacity: 0, y: 12 }}
                  animate={reduced ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline justify-between border-b border-[var(--line)] py-5 text-[26px] font-medium tracking-[-0.03em] text-ink"
                  >
                    {link.label}
                    <span className="text-xs text-muted-foreground tabular">0{i + 1}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="shell flex flex-col gap-3 pb-[max(28px,env(safe-area-inset-bottom))]">
              <Link
                href={`/${DEFAULT_CAMPUS_SLUG}/search`}
                onClick={() => setOpen(false)}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[10px] bg-[var(--navy)] text-[15px] font-semibold text-white"
              >
                Find a place
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/auth/signin"
                onClick={() => setOpen(false)}
                className="inline-flex h-14 items-center justify-center rounded-[10px] border border-[var(--line-strong)] text-[15px] font-medium text-ink"
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
