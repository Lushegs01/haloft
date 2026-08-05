import { MapPin, Paperclip } from "lucide-react";
import { Reveal } from "./motion";

/* Fragments of the search as it works today. Everything here is a
   composed artefact, not a screenshot of a real conversation. */

function ChatFragment() {
  return (
    <div className="w-full rounded-[14px] border border-[var(--line)] bg-card p-3.5 shadow-ambient">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Group chat · 214 members
      </p>
      <div className="mt-3 space-y-2">
        <p className="w-fit max-w-full rounded-[10px] rounded-tl-[3px] bg-[var(--muted)] px-3 py-2 text-[12.5px] leading-snug text-ink-soft">
          Room available near school. DM for price 🔑
        </p>
        <p className="ml-auto w-fit max-w-full rounded-[10px] rounded-tr-[3px] bg-[var(--navy)] px-3 py-2 text-[12.5px] leading-snug text-white">
          Is this still available?
        </p>
        <p className="w-fit max-w-full rounded-[10px] rounded-tl-[3px] bg-[var(--muted)] px-3 py-2 text-[12.5px] leading-snug text-ink-soft opacity-55 blur-[1.4px]">
          Send inspection fee first before I…
        </p>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Seen · 3 days ago</p>
    </div>
  );
}

function GoneFragment() {
  return (
    <div className="w-full overflow-hidden rounded-[14px] border border-[var(--line)] bg-card shadow-ambient">
      <div className="relative h-[92px] bg-[var(--muted)]">
        <div className="absolute inset-0 grid grid-cols-3 gap-1.5 p-3 opacity-30">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="rounded-[3px] bg-[var(--navy)]" />
          ))}
        </div>
        <svg
          className="absolute inset-0 h-full w-full text-[var(--navy)] opacity-25"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M2 2 98 98M98 2 2 98" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>
      <div className="p-3.5">
        <p className="text-[13px] font-semibold text-ink line-through decoration-[var(--line-strong)]">
          Single room, close to gate
        </p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">
          Taken last week. Post never came down.
        </p>
      </div>
    </div>
  );
}

function PriceFragment() {
  return (
    <div className="w-full rounded-[14px] border border-[var(--line)] bg-[var(--sand-tint)] p-4 shadow-ambient">
      <p className="editorial text-[22px] leading-[1.15] text-[var(--sand-deep)] sm:text-[26px]">
        ₦380k?
        <br />
        ₦420k?
      </p>
      <div className="mt-3 space-y-1.5 text-[12px] text-ink-soft">
        <p className="flex items-baseline justify-between gap-4">
          <span>Agent fee</span>
          <span className="editorial text-[14px]">+10%</span>
        </p>
        <p className="flex items-baseline justify-between gap-4">
          <span>Caution fee</span>
          <span className="editorial text-[14px]">ask</span>
        </p>
        <p className="flex items-baseline justify-between gap-4 border-t border-[rgba(157,85,24,0.22)] pt-1.5">
          <span>Total</span>
          <span className="editorial text-[14px]">unclear</span>
        </p>
      </div>
    </div>
  );
}

function PinFragment() {
  return (
    <div className="w-full rounded-[14px] border border-[var(--line)] bg-card p-3.5 shadow-ambient">
      <div className="flex items-start gap-2.5">
        <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--sand-deep)]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink">&ldquo;Very close to school&rdquo;</p>
          <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
            No address. No landmark. Two okada rides away.
          </p>
        </div>
      </div>
    </div>
  );
}

function TripsFragment() {
  return (
    <div className="w-full rounded-[14px] border border-dashed border-[var(--line-strong)] bg-transparent p-4">
      <Paperclip className="size-3.5 text-muted-foreground" aria-hidden="true" />
      <p className="mt-2.5 text-[14px] leading-snug text-ink">
        Three trips across town. Two rooms seen. Both already gone.
      </p>
    </div>
  );
}

export function ProblemStory() {
  return (
    <section className="chapter bg-[var(--paper)]" id="the-problem">
      <div className="shell">
        <div className="grid grid-cols-12 gap-y-14 lg:gap-x-12">
          {/* Statement */}
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <p className="label label-rule max-w-[16rem]">The old way</p>
            </Reveal>

            <Reveal delay={0.06}>
              <h2 className="mt-7 display-2 text-ink">
                Finding a room shouldn&apos;t feel like{" "}
                <span className="editorial font-normal">detective work</span>.
              </h2>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="mt-7 space-y-4 text-[15px] leading-[1.68] text-muted-foreground lg:max-w-[26rem]">
                <p>
                  The search runs on screenshots and hearsay. A friend forwards
                  a photo with no address. An agent wants an inspection fee
                  before telling you where the place is. A price moves between
                  the phone call and the gate.
                </p>
                <p>
                  So you travel, and you look, and you travel again — usually in
                  the same week you&apos;re supposed to be registering for
                  courses.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.18}>
              <p className="mt-9 border-t border-[var(--line)] pt-6 text-[19px] leading-[1.4] tracking-[-0.02em] text-ink lg:max-w-[22rem] lg:text-[21px]">
                Haloft puts the whole search in one place.
              </p>
            </Reveal>
          </div>

          {/* Collage */}
          <div className="col-span-12 lg:col-span-7">
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:relative lg:block lg:h-[540px]">
              <Reveal
                delay={0.08}
                className="col-span-2 sm:col-span-1 lg:absolute lg:left-0 lg:top-2 lg:w-[17.5rem] lg:-rotate-[1.6deg]"
              >
                <ChatFragment />
              </Reveal>

              <Reveal
                delay={0.16}
                className="lg:absolute lg:right-6 lg:top-0 lg:w-[15.5rem] lg:rotate-[1.8deg] xl:right-10"
              >
                <GoneFragment />
              </Reveal>

              <Reveal
                delay={0.24}
                className="lg:absolute lg:right-0 lg:top-[15rem] lg:w-[14.5rem] lg:-rotate-[1.2deg] xl:right-4"
              >
                <PriceFragment />
              </Reveal>

              <Reveal
                delay={0.32}
                className="col-span-2 sm:col-span-1 lg:absolute lg:left-4 lg:top-[19.5rem] lg:w-[16.5rem] lg:rotate-[1.1deg]"
              >
                <PinFragment />
              </Reveal>

              <Reveal
                delay={0.4}
                className="col-span-2 lg:absolute lg:bottom-2 lg:left-[7.5rem] lg:w-[15rem] xl:left-[10rem]"
              >
                <TripsFragment />
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
