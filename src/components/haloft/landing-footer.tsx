import Link from "next/link";
import { Mail, Heart } from "lucide-react";
import { HaloftLogoDark } from "@/components/ui/logo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Fresh listings", href: "#listings" },
      { label: "Universities", href: "#universities" },
      { label: "For owners", href: "#for-owners" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/auth/signin" },
      { label: "Create account", href: "/auth/signup" },
      { label: "Bookings", href: "/auth/signin" },
      { label: "Verification", href: "#verification" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/legal/terms" },
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Refund policy", href: "/legal/refunds" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-night text-night-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <HaloftLogoDark size={32} />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-night-foreground/60">
              Student housing you can actually trust. Verified homes near your
              campus, transparent pricing, and secure payments — built by
              CampOS for Nigerian campus life.
            </p>
            <a
              href="mailto:support@haloft.homes"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-coral/50 hover:text-coral"
            >
              <Mail className="size-4" aria-hidden="true" />
              support@haloft.homes
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-night-foreground/40">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-night-foreground/70 transition-colors hover:text-white"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-night-foreground/50">
            © {new Date().getFullYear()} Haloft · CampOS. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-night-foreground/50">
            Built with <Heart className="size-3.5 text-coral" aria-hidden="true" /> for Nigerian students
          </p>
        </div>
      </div>
    </footer>
  );
}
