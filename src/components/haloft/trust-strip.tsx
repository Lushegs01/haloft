import { Reveal } from "./motion";

const ATTRIBUTES = [
  {
    title: "Information you can check",
    body: "Address, room type and what's included — written down, not promised over the phone.",
  },
  {
    title: "Prices in the open",
    body: "What a place costs, and what sits on top of it, before you travel to see it.",
  },
  {
    title: "Distance that means something",
    body: "Every home is placed against your campus, with a walking time attached.",
  },
  {
    title: "Fewer people in the middle",
    body: "You deal with the listing and the team behind it, not a chain of agents.",
  },
];

export function TrustStrip() {
  return (
    <section className="hairline-t hairline-b bg-[var(--paper-warm)]">
      <div className="shell py-11 lg:py-14">
        <Reveal>
          <h2 className="max-w-[24rem] text-[15.5px] font-normal leading-[1.5] tracking-[-0.01em] text-ink lg:text-[17px]">
            Built for students who want fewer surprises.
          </h2>
        </Reveal>

        <div className="mt-9 grid grid-cols-1 gap-y-9 sm:grid-cols-2 sm:gap-x-0 lg:mt-11 lg:grid-cols-4 lg:gap-y-0">
          {ATTRIBUTES.map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 0.06}
              className={[
                "sm:px-7 lg:px-8",
                i % 2 === 1 ? "sm:border-l sm:border-[var(--line)]" : "sm:pl-0 lg:pl-0",
                i === 2 ? "lg:border-l lg:border-[var(--line)] lg:pl-8" : "",
                i === 0 ? "lg:pr-8" : "",
                i === 3 ? "lg:pr-0" : "",
              ].join(" ")}
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground tabular">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2.5 text-[15px] font-semibold tracking-[-0.015em] text-ink">
                {item.title}
              </h3>
              <p className="mt-2 max-w-[22rem] text-[13.5px] leading-[1.62] text-muted-foreground">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
