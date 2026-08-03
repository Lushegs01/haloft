import { SearchCheck, FileBadge2, CreditCard } from "lucide-react";

const STEPS = [
  {
    icon: SearchCheck,
    step: "01",
    title: "Search near your campus",
    body: "Pick your university, filter by budget and room type, and see real photos, walk-times and prices — no phone-call archaeology.",
  },
  {
    icon: FileBadge2,
    step: "02",
    title: "We verify the room",
    body: "Request a room and our team confirms it's available and exactly as listed before you're asked to pay anything.",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Pay securely, move in",
    body: "Complete your payment through Paystack, get a booking reference, and move in with a paper trail that protects you.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute inset-0 bg-dots opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_100%_0%,black,transparent)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center text-teal-ink">How it works</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            From “any available room?” to home, in three steps
          </h2>
        </div>

        <div className="relative mt-14 grid gap-10 lg:grid-cols-3">
          <div
            className="pointer-events-none absolute left-1/2 top-7 hidden h-px w-2/3 -translate-x-1/2 border-t-2 border-dashed border-border lg:block"
            aria-hidden="true"
          />
          {STEPS.map((s) => (
            <div key={s.step} className="relative flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-navy text-white shadow-lg">
                <s.icon className="size-6 text-teal" aria-hidden="true" />
              </div>
              <span className="ghost-numeral mt-5">{s.step}</span>
              <h3 className="mt-2 font-display text-lg font-bold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
