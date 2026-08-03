import {
  IdCard,
  MapPinCheck,
  Eye,
  FileCheck2,
  UserRoundCheck,
  PhoneCall,
} from "lucide-react";

const CHECKS = [
  {
    icon: IdCard,
    title: "Owner identity is verified",
    body: "We confirm who owns or manages the property before a listing goes live.",
  },
  {
    icon: MapPinCheck,
    title: "The home is physically confirmed",
    body: "Listings are matched to the real neighbourhood, and photos are reviewed.",
  },
  {
    icon: Eye,
    title: "What you see is what's there",
    body: "Room counts, prices and amenities are checked against what's actually available.",
  },
  {
    icon: UserRoundCheck,
    title: "You are who you say you are",
    body: "Students sign in once so bookings tie to a real person — not an anonymous number.",
  },
];

export function VerificationSection() {
  return (
    <section id="verification" className="relative overflow-hidden bg-night text-night-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-dots-light opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_0%_0%,black,transparent)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow justify-start border-none bg-white/10 text-teal">Anti-fraud by design</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Designed to reduce housing fraud — not “trust us, bro”
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-night-foreground/75 sm:text-lg">
              We can&apos;t promise a scam-free world — anyone who does should be on
              your scam list. What we can promise is a system built to make
              fraud expensive and boring: checks on both sides of the deal,
              payments that only move when a room is confirmed, and a paper
              trail on every booking.
            </p>

            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <FileCheck2 className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-night-foreground/80">
                <span className="font-bold text-white">Your money is protected after payment too.</span>{" "}
                If a verified home isn&apos;t as listed, or the room isn&apos;t available
                when you arrive, our refund policy covers you — details on the
                refunds page before you ever pay.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:border-teal/40"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
                  <c.icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-[15px] font-bold">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-night-foreground/70">
                  {c.body}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/20 p-5 text-center sm:col-span-2">
              <p className="text-sm text-night-foreground/60">
                Something feels off?{" "}
                <a
                  href="mailto:support@haloft.homes"
                  className="inline-flex items-center gap-1 font-bold text-coral underline-offset-4 hover:underline"
                >
                  <PhoneCall className="size-4" aria-hidden="true" />
                  Talk to a real human
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
