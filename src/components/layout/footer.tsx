import Link from "next/link";
import { Shield, MapPin, Mail, ExternalLink, Globe, AtSign } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      {/* Top gradient accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Brand */}
          <div className="space-y-5 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-inter)" }}>H</span>
              </div>
              <span
                className="text-xl font-bold tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
              >
                Haloft
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
              The trusted accommodation marketplace built for Nigerian university students.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                aria-label="Instagram"
              >
                <AtSign className="h-3.5 w-3.5" />
              </a>
              <a
                href="#"
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                aria-label="Twitter"
              >
                <Globe className="h-3.5 w-3.5" />
              </a>
              <a
                href="#"
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                aria-label="LinkedIn"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Students */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/60">For Students</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Find Accommodation", href: "/" },
                { label: "How It Works", href: "/" },
                { label: "Safety Guide", href: "/" },
                { label: "Student FAQs", href: "/" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/60">Company</h3>
            <ul className="space-y-2.5">
              {[
                { label: "About Haloft", href: "/" },
                { label: "Careers", href: "/" },
                { label: "Press", href: "/" },
                { label: "Contact Us", href: "/" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Safety */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/60">Trust &amp; Safety</h3>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="h-3 w-3 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">All properties physically verified</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Accurate locations, no surprises</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-info/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="h-3 w-3 text-info" />
                </div>
                <span className="text-sm text-muted-foreground">Student support team available</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Haloft Technologies Ltd. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <Link key={l} href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
