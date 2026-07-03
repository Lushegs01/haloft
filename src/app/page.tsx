import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Search,
  Shield,
  Wallet,
  MapPin,
  Users,
  ArrowRight,
  Star,
  CheckCircle2,
  Zap,
  ChevronRight,
} from "lucide-react";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";

const features = [
  {
    icon: Shield,
    title: "Verified Listings",
    description:
      "Every property is physically inspected by our operations team before going live — zero fake listings.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Wallet,
    title: "Transparent Pricing",
    description:
      "No hidden fees, no agent commission. See the exact cost breakdown before you commit.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: MapPin,
    title: "Campus Proximity",
    description:
      "Filter by distance to lecture halls, libraries, and all student facilities.",
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    icon: Users,
    title: "Built for Students",
    description:
      "From single rooms to hostel blocks, every listing speaks your language and fits your budget.",
    color: "text-amber",
    bg: "bg-amber/10",
  },
];

const steps = [
  {
    step: "01",
    title: "Search & Compare",
    description:
      "Browse verified listings with real photos, honest reviews, and complete pricing — all in one place.",
  },
  {
    step: "02",
    title: "Request Your Room",
    description:
      "Select your move-in date and submit a booking request. Our team confirms availability directly with you.",
  },
  {
    step: "03",
    title: "Move In, Stress-Free",
    description:
      "Show your booking confirmation on arrival. We guarantee the room matches what you saw online.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden hero-gradient">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full bg-amber/5 blur-3xl" />

          <div className="container mx-auto px-4 lg:px-8 py-20 lg:py-32 relative">
            <div className="max-w-3xl mx-auto text-center">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Now live at FUNAAB — every listing inspected by our team
              </div>

              {/* Headline */}
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 animate-slide-up"
                style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.04em", lineHeight: "1.05" }}
              >
                Find your perfect{" "}
                <span className="gradient-text">student home</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto animate-slide-up stagger-1">
                Verified accommodation for university students. Browse, compare, and book your room with complete confidence — no scams, no hidden fees.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 animate-slide-up stagger-2">
                <Link href={`/${DEFAULT_CAMPUS_SLUG}`}>
                  <Button size="lg" className="h-13 px-8 text-base font-semibold rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2 group">
                    <Building2 className="h-5 w-5" />
                    Explore FUNAAB Listings
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="outline" size="lg" className="h-13 px-8 text-base font-semibold rounded-full">
                    Create free account
                  </Button>
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-6 animate-fade-in stagger-3">
                <div className="flex -space-x-2">
                  {["E", "A", "K", "S"].map((l, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        background: ["#e8432d", "#059669", "#2563eb", "#d97706"][i],
                      }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-amber text-amber" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-foreground">500+</span> students housed
                  </p>
                </div>
                <div className="w-px h-8 bg-border hidden sm:block" />
                <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  No agent fees
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-amber" />
                  Instant confirmation
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why Haloft ────────────────────────────────────── */}
        <section className="section-py bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Why students choose us</p>
              <h2
                className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
                style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
              >
                Tired of scams and hidden fees?
              </h2>
              <p className="text-muted-foreground text-lg">
                We built Haloft because we were students once too.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 cursor-default stagger-${i + 1}`}
                >
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${feature.bg}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3
                    className="font-bold text-foreground mb-2 text-lg"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────── */}
        <section className="section-py bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Simple process</p>
              <h2
                className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
                style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
              >
                Book in 3 simple steps
              </h2>
              <p className="text-muted-foreground text-lg">
                From search to move-in, we've streamlined every step.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connector line (desktop) */}
              <div className="hidden md:block absolute top-16 left-[calc(33.33%+16px)] right-[calc(33.33%+16px)] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

              {steps.map((item, i) => (
                <div
                  key={item.step}
                  className={`relative rounded-2xl border border-border bg-card p-8 hover:shadow-lg transition-all group stagger-${i + 1}`}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
                      <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                        {item.step}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground hidden md:block absolute right-[-20px] top-1/3 z-10" />
                    )}
                  </div>
                  <h3
                    className="text-xl font-bold mb-3 text-foreground"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────── */}
        <section className="section-py relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-orange-600" />
          <div className="pointer-events-none absolute -top-24 -right-24 h-[400px] w-[400px] rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-[300px] w-[300px] rounded-full bg-white/5 blur-2xl" />

          <div className="container mx-auto px-4 lg:px-8 text-center relative">
            {/* Trust row */}
            <div className="flex items-center justify-center gap-6 mb-10 flex-wrap">
              {[
                { icon: Shield, text: "Verified listings" },
                { icon: Wallet, text: "No hidden fees" },
                { icon: Star, text: "Real student reviews" },
                { icon: Zap, text: "Instant confirmation" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/90 text-sm">
                  <Icon className="h-4 w-4 text-white/70" />
                  {text}
                </div>
              ))}
            </div>

            <h2
              className="text-4xl lg:text-5xl font-extrabold text-white mb-5"
              style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
            >
              Ready to find your home?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-10 text-lg">
              Browse verified student housing near FUNAAB — inspected by our team, transparent pricing, zero agent fees.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${DEFAULT_CAMPUS_SLUG}`}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-13 px-8 text-base font-semibold rounded-full gap-2 group shadow-xl"
                >
                  Explore Listings
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 px-8 text-base font-semibold rounded-full border-white/30 text-white hover:bg-white/10 bg-transparent"
                >
                  Create free account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
