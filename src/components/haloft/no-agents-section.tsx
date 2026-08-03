import { HandCoins, UserX2, KeyRound, BadgeCheck } from "lucide-react";

const POINTS = [
  {
    icon: UserX2,
    title: "No middleman tax",
    body: "When an agent is involved, someone pays their commission — usually you, quietly, inside the price.",
  },
  {
    icon: HandCoins,
    title: "Deal with the actual owner",
    body: "Landlords list their own properties, so what you negotiate is what you pay — no inflated 'agent rate'.",
  },
  {
    icon: KeyRound,
    title: "Keys from the right hands",
    body: "You meet the verified owner or manager on move-in day — not a stranger with 'a guy'.",
  },
  {
    icon: BadgeCheck,
    title: "Still fully verified",
    body: "No agents doesn't mean no checks. Every owner and every home goes through the same vetting.",
  },
];

export function NoAgentsSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center text-teal-ink">Direct, not through the grapevine</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Owners list on Haloft — no agents inflating your rent
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            On many campuses, finding a room means paying a middleman who has
            never seen the house. Haloft connects you straight to the people
            who own it.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p) => (
            <div key={p.title} className="card-hover rounded-2xl border border-border bg-background p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-navy text-white">
                <p.icon className="size-5.5 text-teal" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
