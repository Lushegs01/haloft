import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  AtSign,
  Globe,
  ExternalLink,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { HaloftLogoDark } from "@/components/ui/logo";
import { Roofline } from "@/components/ui/roofline";

const linkColumns = [
  {
    title: "Company",
    links: [
      { label: "About Haloft", href: "/" },
      { label: "Careers", href: "/" },
      { label: "Press", href: "/" },
      { label: "Contact Us", href: "/" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Find Accommodation", href: "/" },
      { label: "How It Works", href: "/" },
      { label: "Safety Guide", href: "/" },
      { label: "Student FAQs", href: "/" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Centre", href: "/" },
      { label: "Cancellation Options", href: "/legal/refunds" },
      { label: "Report a Listing", href: "/" },
      { label: "Host Resources", href: "/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Refund Policy", href: "/legal/refunds" },
      { label: "Cookie Policy", href: "/" },
    ],
  },
];

const socials = [
  { label: "Twitter", icon: AtSign },
  { label: "Instagram", icon: Globe },
  { label: "LinkedIn", icon: ExternalLink },
];

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-night text-night-foreground">
      {/* Roofline watermark */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.045]" aria-hidden="true">
        <div className="absolute -right-24 -top-24 h-[420px] w-[420px]">
          <svg viewBox="0 0 420 420" fill="none" className="h-full w-full">
            <path d="M 113 297 A 138 138 0 1 1 307 297" stroke="#edf2fa" strokeWidth="10" strokeLinecap="round" />
            <path d="M 113 297 L 210 190 L 307 297" stroke="#edf2fa" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="210" cy="190" r="14" fill="#f07540" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-dots-light" />
      </div>

      {/* Top gradient accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Newsletter + Logo row */}
        <div className="flex flex-col items-start justify-between gap-8 pb-10 pt-14 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <HaloftLogoDark size={34} />
              <div>
                <p className="font-display text-lg font-extrabold text-white">Haloft</p>
                <p className="text-sm text-night-foreground/60">Trusted student accommodation, simplified.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-night-foreground/55">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-teal" />
                Every listing inspected in person
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-teal" />
                FUNAAB · Abeokuta — live now
              </span>
            </div>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="h-12 rounded-full border-night-foreground/15 bg-night-foreground/5 text-night-foreground placeholder:text-night-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
            <Button className="h-12 shrink-0 rounded-full px-6 font-semibold shadow-lg shadow-primary/25">
              Subscribe
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-10 pb-12 md:grid-cols-4 lg:gap-12">
          {linkColumns.map((col) => (
            <div key={col.title} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-night-foreground/50">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-night-foreground/70 transition-colors hover:text-teal"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Signature line */}
        <div className="flex items-center gap-3 border-t border-night-foreground/10 py-8">
          <Roofline width={24} stroke="#4ecab8" dot="var(--logo-orange)" className="opacity-70" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-night-foreground/40">
            Inspected · Listed · Paid · Moved in
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-night-foreground/10 py-6 sm:flex-row">
          <p className="text-sm text-night-foreground/50">
            © {new Date().getFullYear()} Haloft Technologies Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-night-foreground/5 text-night-foreground/50 transition-colors hover:bg-night-foreground/10 hover:text-night-foreground"
                aria-label={s.label}
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
