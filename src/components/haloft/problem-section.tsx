import { Ban, ShieldAlert, PiggyBank, Undo2 } from "lucide-react";

const PAINS = [
  {
    icon: ShieldAlert,
    title: "The 'fake listing' gamble",
    body: "A random landlord tells you a room is 'perfect, just send the deposit'. You wire the money — and the room was never there.",
  },
  {
    icon: Ban,
    title: "Double-booking chaos",
    body: "The same bed is \u2018reserved\u2019 for five people. You pay first, so you lose. Everyone else moved in already.",
  },
  {
    icon: PiggyBank,
    title: "Prices that change at the gate",
    body: "₦350k a year over the phone, ₦520k when you arrive. 'The management fee. The generator. The key deposit…'",
  },
  {
    icon: Undo2,
    title: "No receipts, no recourse",
    body: "Once cash changes hands there's no paper trail, no review, and no one to call. You're on your own.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center text-primary">The reality</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Hunting for student housing shouldn&apos;t feel like a scam audition
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Around every campus, students lose money to fake listings, phantom
            rooms, and landlords who change terms at the last minute. The
            problems are so common they&apos;re treated as normal.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PAINS.map((p) => (
            <div
              key={p.title}
              className="card-hover rounded-2xl border border-border bg-white p-6"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                <p.icon className="size-5.5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-foreground">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
