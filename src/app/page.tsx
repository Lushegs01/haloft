import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Search,
  Shield,
  Wallet,
  MapPin,
  Star,
  Users,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";

const features = [
  {
    icon: Shield,
    title: "Verified Listings",
    description:
      "Every property is inspected and verified by our operations team before going live.",
  },
  {
    icon: Wallet,
    title: "Transparent Pricing",
    description:
      "No hidden fees. See the full cost breakdown before you book.",
  },
  {
    icon: MapPin,
    title: "Campus Proximity",
    description:
      "Filter by distance to lecture halls, libraries, and student amenities.",
  },
  {
    icon: Users,
    title: "Built for Students",
    description:
      "From roommates to study spaces, every listing is student-focused.",
  },
];

const testimonials = [
  {
    name: "Chinwe O.",
    role: "300L Biochemistry, FUNAAB",
    text: "Haloft made finding accommodation so easy. I booked my room before arriving on campus and everything was exactly as described.",
    rating: 5,
  },
  {
    name: "Babatunde A.",
    role: "400L Computer Science, FUNAAB",
    text: "The verification process gives real peace of mind. No more getting scammed by fake agents. Highly recommend.",
    rating: 5,
  },
  {
    name: "Ngozi E.",
    role: "MSc Agricultural Economics, FUNAAB",
    text: "As a postgraduate student, I needed quiet and privacy. Haloft had options that other platforms didn't even list.",
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-cream via-background to-muted">
          <div className="container mx-auto px-4 lg:px-8 py-20 lg:py-32">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <Star className="h-3.5 w-3.5 fill-primary" />
                Trusted by 10,000+ students across Nigeria
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Find your perfect
                <span className="text-primary"> student home</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
                Verified accommodation for university students. Browse, compare, and book your room with complete confidence.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your university..."
                    className="pl-10 h-12"
                  />
                </div>
                <Link href={`/${DEFAULT_CAMPUS_SLUG}`}>
                  <Button size="lg" className="h-12 gap-2">
                    <Building2 className="h-4 w-4" />
                    Explore FUNAAB
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Why students choose Haloft
              </h2>
              <p className="text-muted-foreground">
                We built this platform because we were tired of the scams, the hidden fees, and the endless WhatsApp groups.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/20"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
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

        {/* How it works */}
        <section className="py-20 lg:py-24 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Book in 3 simple steps
              </h2>
              <p className="text-muted-foreground">
                From search to move-in, we have streamlined every step of the process.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Search & Compare",
                  description:
                    "Browse verified listings with real photos, accurate prices, and honest reviews from fellow students.",
                },
                {
                  step: "02",
                  title: "Book Your Room",
                  description:
                    "Select your move-in date, pay your deposit securely, and receive instant confirmation.",
                },
                {
                  step: "03",
                  title: "Move In",
                  description:
                    "Show your booking confirmation on arrival. Our team ensures the room matches what you saw online.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative rounded-xl border border-border bg-card p-8"
                >
                  <span className="text-5xl font-bold text-primary/10">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Loved by students
              </h2>
              <p className="text-muted-foreground">
                Real reviews from real students who found their home through Haloft.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber text-amber"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-6">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              Ready to find your home?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Join thousands of students who trust Haloft for their accommodation needs.
            </p>
            <Link href={`/${DEFAULT_CAMPUS_SLUG}`}>
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                Explore Listings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
