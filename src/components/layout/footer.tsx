import Link from "next/link";
import { Building2, MapPin, Shield, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold tracking-tight">Haloft</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The trusted accommodation marketplace for university students. Verified listings, transparent pricing, and a seamless booking experience.
            </p>
          </div>

          {/* Students */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">For Students</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Find Accommodation</Link></li>
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Safety Guide</Link></li>
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Press</Link></li>
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Trust */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Trust & Safety</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">All properties verified by our team</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Accurate locations and descriptions</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-info mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">24/7 support for all students</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Haloft. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
