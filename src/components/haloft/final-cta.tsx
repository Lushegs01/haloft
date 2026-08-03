import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-night text-night-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-dots-light opacity-25" />
        <div className="orb -top-32 left-1/2 size-[420px] -translate-x-1/2 bg-teal/20" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/10 text-teal">
          <ShieldCheck className="size-7" aria-hidden="true" />
        </div>

        <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          Your next room should be the
          <span className="text-coral"> least stressful part</span> of university
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-night-foreground/75 sm:text-lg">
          Stop gambling deposits on phone numbers. Find a verified room near
          your campus, pay securely, and move in with your sanity intact.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/signup"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 sm:w-auto"
          >
            Create a free account
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="#universities"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-sm font-bold text-white transition-colors hover:border-white/40 sm:w-auto"
          >
            Browse your campus
          </Link>
        </div>

        <p className="mt-6 text-xs text-night-foreground/50">
          Free to search · Free to request rooms · Pay only when it&apos;s confirmed
        </p>
      </div>
    </section>
  );
}
