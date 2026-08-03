import {
  FileCheck2,
  Landmark,
  MessagesSquare,
  HeartHandshake,
} from "lucide-react";

const CLAIMS = [
  {
    icon: FileCheck2,
    title: "Each listing is manually vetted",
    body: "We verify owners, confirm the home exists, and check the rooms before anything goes live.",
  },
  {
    icon: Landmark,
    title: "You pay securely, only when it's real",
    body: "Payments run through Paystack after our team confirms the room is available for you.",
  },
  {
    icon: MessagesSquare,
    title: "Disputes get a real human",
    body: "Our support team steps in when a home isn't what it claimed to be — not a bot queue.",
  },
  {
    icon: HeartHandshake,
    title: "Built for students, not commissions",
    body: "Haloft exists to fix housing fraud, not to take a cut from confused first-years.",
  },
];

export function TrustStrip() {
  return (
    <section className="bg-night text-night-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {CLAIMS.map((c) => (
          <div key={c.title} className="flex flex-col gap-3">
            <c.icon className="size-6 text-teal" aria-hidden="true" />
            <h3 className="font-display text-base font-bold">{c.title}</h3>
            <p className="text-sm leading-relaxed text-night-foreground/70">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
