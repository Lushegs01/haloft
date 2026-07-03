import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Globe,
  AtSign,
  ExternalLink,
} from "lucide-react";
import { HaloftLogo, HaloftLogoDark } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="bg-night text-night-foreground mt-auto">
      {/* Top gradient accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Newsletter + Logo row */}
      <div className="container mx-auto px-4 lg:px-8 pt-12 pb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <HaloftLogoDark size={32} />
            <div>
              <p className="text-white font-bold text-lg heading-display">Haloft</p>
              <p className="text-night-foreground/60 text-sm">Trusted student accommodation, simplified.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <Input
              type="email"
              placeholder="Enter your email"
              className="h-11 rounded-full bg-night-foreground/5 border-night-foreground/10 text-night-foreground placeholder:text-night-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
            <Button className="h-11 rounded-full px-5 font-semibold shrink-0">
              Subscribe
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-12">

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-night-foreground/50">Company</h3>
            <ul className="space-y-2.5">
              {[
                { label: "About Haloft", href: "/" },
                { label: "Careers", href: "/" },
                { label: "Press", href: "/" },
                { label: "Contact Us", href: "/" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-night-foreground/70 hover:text-night-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-night-foreground/50">Explore</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Find Accommodation", href: "/" },
                { label: "How It Works", href: "/" },
                { label: "Safety Guide", href: "/" },
                { label: "Student FAQs", href: "/" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-night-foreground/70 hover:text-night-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-night-foreground/50">Support</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Help Centre", href: "/" },
                { label: "Cancellation Options", href: "/legal/refunds" },
                { label: "Report a Listing", href: "/" },
                { label: "Host Resources", href: "/" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-night-foreground/70 hover:text-night-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-night-foreground/50">Legal</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Privacy Policy", href: "/legal/privacy" },
                { label: "Terms of Service", href: "/legal/terms" },
                { label: "Refund Policy", href: "/legal/refunds" },
                { label: "Cookie Policy", href: "/" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-night-foreground/70 hover:text-night-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-night-foreground/10">
        <div className="container mx-auto px-4 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-night-foreground/50">
            © {new Date().getFullYear()} Haloft Technologies Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="h-9 w-9 rounded-full bg-night-foreground/5 flex items-center justify-center text-night-foreground/50 hover:bg-night-foreground/10 hover:text-night-foreground transition-colors"
              aria-label="Twitter"
            >
              <AtSign className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="h-9 w-9 rounded-full bg-night-foreground/5 flex items-center justify-center text-night-foreground/50 hover:bg-night-foreground/10 hover:text-night-foreground transition-colors"
              aria-label="Instagram"
            >
              <Globe className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="h-9 w-9 rounded-full bg-night-foreground/5 flex items-center justify-center text-night-foreground/50 hover:bg-night-foreground/10 hover:text-night-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
