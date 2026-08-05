import { Reveal } from "./motion";

const PRINCIPLES = [
  {
    title: "Say the price, in full.",
    body: "A listing that hides what it costs is wasting your morning. Rent, and whatever sits on top of it, in the same place.",
  },
  {
    title: "Show the room, not the idea of the room.",
    body: "Photographs come from the visit, of the rooms being offered. If we haven't been yet, the listing says so.",
  },
  {
    title: "Name the distance.",
    body: "“Close to school” means nothing. Six minutes from the main gate means something you can plan around.",
  },
];

export function Principles() {
  return (
    <section className="chapter bg-[var(--paper)]" id="about">
      <div className="shell">
        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">
            <Reveal>
              <p className="label label-rule max-w-[16rem]">Why Haloft exists</p>
            </Reveal>

            <Reveal delay={0.06}>
              <p className="editorial mt-8 max-w-[20ch] text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.16] text-ink sm:max-w-[24ch]">
                We started from the part everyone complains about: you can&apos;t
                tell what&apos;s real until you&apos;re standing in front of it.
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-8 max-w-[52ch] text-[15px] leading-[1.68] text-muted-foreground">
                Haloft is built around that gap. Not a feed of listings, but a
                record of places somebody has actually checked — priced,
                located and described the way a student would need it before
                spending money on transport.
              </p>
            </Reveal>

            <div className="mt-16 grid grid-cols-1 border-t border-[var(--line)] sm:grid-cols-3 sm:gap-x-10">
              {PRINCIPLES.map((principle, i) => (
                <Reveal
                  key={principle.title}
                  delay={i * 0.07}
                  className={`border-b border-[var(--line)] py-8 sm:border-b-0 sm:py-9 ${
                    i > 0 ? "sm:border-l sm:border-[var(--line)] sm:pl-10" : ""
                  }`}
                >
                  <h3 className="max-w-[18ch] text-[17px] font-semibold leading-[1.28] tracking-[-0.022em] text-ink">
                    {principle.title}
                  </h3>
                  <p className="mt-3 max-w-[30ch] text-[13.5px] leading-[1.65] text-muted-foreground">
                    {principle.body}
                  </p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2}>
              <p className="mt-10 max-w-[54ch] border-t border-[var(--line)] pt-8 text-[13.5px] leading-[1.65] text-muted-foreground">
                You won&apos;t find testimonials on this page. Reviews live on
                the home they belong to, and only after a student has actually
                stayed there — we don&apos;t seed them, and we don&apos;t write
                them.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
