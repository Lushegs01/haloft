import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Roofline } from "@/components/ui/roofline";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";
import { Search, ArrowRight, ArrowUpRight } from "lucide-react";

// Falls back to the launch campus's real neighbourhoods when the
// database is unreachable (e.g. local dev without env vars)
const FALLBACK_NEIGHBOURHOODS = [
  { id: null, name: "Campus Gate", description: "Right at the main gate. High demand, two minutes to lectures." },
  { id: null, name: "Campus Axis", description: "The student hub — food, shops, photocopy, everything close." },
  { id: null, name: "Famous Market", description: "Affordable rooms with good transport links, near the market." },
  { id: null, name: "Damico", description: "Quiet area, a favourite of final years and postgraduates." },
  { id: null, name: "Osiele", description: "Budget-friendly shared housing with a real community feel." },
];

async function getNeighbourhoods() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("campuses")
      .select("id, neighbourhoods(id, name, description)")
      .eq("slug", DEFAULT_CAMPUS_SLUG)
      .eq("is_active", true)
      .is("deleted_at", null)
      .single();
    if (data?.neighbourhoods && data.neighbourhoods.length > 0) {
      return data.neighbourhoods;
    }
  } catch {
    // fall through to static list
  }
  return FALLBACK_NEIGHBOURHOODS;
}

const steps = [
  {
    n: "1",
    title: "Search and compare",
    description:
      "Real photos, real prices in naira, honest reviews from students who actually lived there.",
  },
  {
    n: "2",
    title: "Request your room",
    description:
      "Pick your move-in date and send a booking request. Our team confirms the room is truly free.",
  },
  {
    n: "3",
    title: "Pay online, move in",
    description:
      "Pay securely with card, transfer, or USSD once confirmed. Your room is locked the moment you pay.",
  },
];

const proofs = [
  {
    title: "Inspected in person",
    description:
      "Nobody lists on Haloft over the phone. Our team walks every corridor, checks the water, counts the sockets — before a property goes live.",
  },
  {
    title: "The price is the price",
    description:
      "No agent fee, no inspection fee, no 'settlement'. The naira amount on the listing is the naira amount you pay.",
  },
  {
    title: "Money moves safely",
    description:
      "Payments run through Paystack, not someone's personal account. Every kobo is receipted and traceable.",
  },
];

export default async function HomePage() {
  const neighbourhoods = await getNeighbourhoods();

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden hero-gradient">
          <div className="container mx-auto px-4 lg:px-8 pt-16 pb-14 lg:pt-24 lg:pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">

              {/* Copy + search */}
              <div className="max-w-xl">
                <div className="flex items-center gap-2.5 mb-6 animate-fade-in">
                  <Roofline width={26} />
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground/60">
                    FUNAAB · Abeokuta, Ogun State
                  </p>
                </div>

                <h1
                  className="heading-display text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem] font-extrabold text-foreground mb-8 animate-slide-up"
                >
                  Find your room.
                  <br />
                  Skip the <span className="relative inline-block">wahala.
                    <Roofline
                      flat
                      width={150}
                      strokeWidth={3.5}
                      className="absolute left-[4%] top-full mt-0.5 w-[62%] h-auto"
                      stroke="var(--logo-teal)"
                    />
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 animate-slide-up stagger-1 max-w-md">
                  Hostels and self-contains near campus — every one inspected by
                  our team before it&apos;s listed. No agents. No fake pictures.
                </p>

                {/* Working search */}
                <form
                  action={`/${DEFAULT_CAMPUS_SLUG}/search`}
                  className="flex items-stretch gap-0 rounded-2xl border border-border bg-card shadow-lg shadow-black/5 p-1.5 mb-5 animate-slide-up stagger-2 focus-within:border-primary/40 transition-colors"
                >
                  <div className="flex items-center pl-3.5 pr-2 text-muted-foreground">
                    <Search className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    name="q"
                    placeholder="Try 'self contain' or 'Damico'…"
                    className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                    aria-label="Search rooms"
                  />
                  <Button type="submit" className="rounded-xl px-5 font-semibold shrink-0">
                    Search
                  </Button>
                </form>

                {/* Real neighbourhood chips */}
                <div className="flex flex-wrap items-center gap-2 animate-fade-in stagger-3">
                  <span className="text-xs text-muted-foreground font-medium mr-0.5">Popular areas:</span>
                  {neighbourhoods.slice(0, 5).map((n) => (
                    <Link
                      key={n.name}
                      href={
                        n.id
                          ? `/${DEFAULT_CAMPUS_SLUG}/search?neighbourhood=${n.id}`
                          : `/${DEFAULT_CAMPUS_SLUG}/search`
                      }
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 hover:border-teal/60 hover:text-teal transition-colors no-underline"
                    >
                      {n.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Brand line art + fact chips */}
              <div className="relative hidden lg:flex items-center justify-center animate-fade-in stagger-2" aria-hidden="true">
                <svg width="420" height="420" viewBox="0 0 420 420" fill="none" className="max-w-full h-auto">
                  <defs>
                    <linearGradient id="heroRing" x1="0%" y1="80%" x2="100%" y2="20%">
                      <stop offset="0%" stopColor="var(--logo-navy)" />
                      <stop offset="100%" stopColor="var(--logo-teal)" />
                    </linearGradient>
                  </defs>
                  {/* Faint dashed halo */}
                  <circle cx="210" cy="200" r="185" stroke="var(--logo-navy)" strokeOpacity="0.1" strokeWidth="1.5" strokeDasharray="3 8" />
                  {/* Ring, open at the bottom */}
                  <path
                    d="M 113 297 A 138 138 0 1 1 307 297"
                    stroke="url(#heroRing)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Roofline */}
                  <path
                    d="M 113 297 L 210 190 L 307 297"
                    stroke="url(#heroRing)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="210" cy="190" r="14" fill="var(--logo-orange)" />
                </svg>

                {/* Floating facts — all true */}
                <div className="absolute top-10 right-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg shadow-black/5 animate-float">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-teal mb-0.5">Inspected ✓</p>
                  <p className="text-xs text-muted-foreground">by the Haloft team,<br />in person</p>
                </div>
                <div className="absolute bottom-24 left-0 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg shadow-black/5 animate-float" style={{ animationDelay: "1.2s" }}>
                  <p className="heading-display text-lg font-extrabold text-foreground">₦60k – ₦350k</p>
                  <p className="text-xs text-muted-foreground">per year, all prices upfront</p>
                </div>
                <div className="absolute bottom-2 right-16 rounded-full border border-border bg-card px-4 py-2 shadow-lg shadow-black/5 animate-float" style={{ animationDelay: "0.6s" }}>
                  <p className="text-xs font-semibold text-foreground/80">{neighbourhoods.length} neighbourhoods · 1 campus</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Fact strip ───────────────────────────────────── */}
        <section className="bg-night text-night-foreground">
          <div className="container mx-auto px-4 lg:px-8 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                "Every listing inspected in person",
                "No agent fees — ever",
                "Pay online with Paystack",
                "Rooms from ₦60k a year",
              ].map((fact, i, arr) => (
                <div key={fact} className="flex items-center gap-8">
                  <p className="text-sm font-medium text-night-foreground/85">{fact}</p>
                  {i < arr.length - 1 && (
                    <Roofline width={18} stroke="rgba(232,240,251,0.35)" className="hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Neighbourhoods ───────────────────────────────── */}
        <section className="section-py bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-end justify-between gap-6 mb-10">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <Roofline width={26} />
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground/60">
                    Know your area
                  </p>
                </div>
                <h2 className="heading-display text-3xl lg:text-[2.6rem] font-extrabold text-foreground">
                  Where do you want to land?
                </h2>
              </div>
              <Link
                href={`/${DEFAULT_CAMPUS_SLUG}/search`}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors shrink-0 no-underline"
              >
                All listings <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto lg:overflow-visible scrollbar-hide snap-x pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
              {neighbourhoods.slice(0, 5).map((n) => (
                <Link
                  key={n.name}
                  href={
                    n.id
                      ? `/${DEFAULT_CAMPUS_SLUG}/search?neighbourhood=${n.id}`
                      : `/${DEFAULT_CAMPUS_SLUG}/search`
                  }
                  className="group relative rounded-2xl border border-border bg-card p-5 min-w-[230px] lg:min-w-0 snap-start transition-all hover:border-teal/50 hover:shadow-lg hover:shadow-black/5 no-underline flex flex-col"
                >
                  <Roofline width={22} stroke="var(--logo-teal)" className="mb-4 opacity-80" />
                  <h3 className="heading-display font-bold text-lg text-foreground mb-1.5">
                    {n.name}
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    {n.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-foreground/70 group-hover:text-teal transition-colors">
                    See rooms <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────── */}
        <section className="section-py bg-muted/40 border-y border-border">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-xl mb-12">
              <div className="flex items-center gap-2.5 mb-4">
                <Roofline width={26} />
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground/60">
                  From search to keys
                </p>
              </div>
              <h2 className="heading-display text-3xl lg:text-[2.6rem] font-extrabold text-foreground">
                Three steps. No middlemen.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {steps.map((item) => (
                <div key={item.n} className="relative">
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="heading-display text-5xl font-extrabold text-foreground/12 select-none">
                      {item.n}
                    </span>
                    <h3 className="heading-display text-xl font-bold text-foreground">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed md:pr-4">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why trust us ─────────────────────────────────── */}
        <section className="section-py bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-xl mb-12">
              <div className="flex items-center gap-2.5 mb-4">
                <Roofline width={26} />
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground/60">
                  Why students trust Haloft
                </p>
              </div>
              <h2 className="heading-display text-3xl lg:text-[2.6rem] font-extrabold text-foreground">
                Built by people who have
                <br className="hidden sm:block" /> hunted for hostels too.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {proofs.map((p) => (
                <div key={p.title} className="border-t-2 border-teal/60 pt-5">
                  <h3 className="heading-display text-lg font-bold text-foreground mb-2">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-night">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-end opacity-[0.07]" aria-hidden="true">
            <svg width="560" height="560" viewBox="0 0 420 420" fill="none" className="translate-x-32">
              <path d="M 113 297 A 138 138 0 1 1 307 297" stroke="#e8f0fb" strokeWidth="10" strokeLinecap="round" />
              <path d="M 113 297 L 210 190 L 307 297" stroke="#e8f0fb" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="210" cy="190" r="14" fill="var(--logo-orange)" />
            </svg>
          </div>

          <div className="container mx-auto px-4 lg:px-8 section-py relative">
            <div className="max-w-2xl">
              <h2 className="heading-display text-4xl sm:text-5xl font-extrabold text-night-foreground mb-5">
                Your next room is
                <br />
                already inspected.
              </h2>
              <p className="text-night-foreground/70 text-lg mb-9 max-w-lg">
                Browse verified rooms across {neighbourhoods.length} neighbourhoods around FUNAAB —
                then book it before someone else does.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/${DEFAULT_CAMPUS_SLUG}/search`}>
                  <Button size="lg" className="h-13 px-8 text-base font-semibold rounded-full gap-2 group shadow-lg shadow-primary/30">
                    Browse rooms at FUNAAB
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-13 px-8 text-base font-semibold rounded-full border-night-foreground/25 text-night-foreground hover:bg-night-foreground/10 bg-transparent"
                  >
                    Create free account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
