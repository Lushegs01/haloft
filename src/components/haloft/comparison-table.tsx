import { Check, X, Minus } from "lucide-react";

const ROWS: {
  feature: string;
  haloft: boolean | "partial";
  street: boolean | "partial";
  whatsapp: boolean | "partial";
}[] = [
  { feature: "Listings confirmed to exist", haloft: true, street: false, whatsapp: false },
  { feature: "Owner identity verified", haloft: true, street: false, whatsapp: false },
  { feature: "Fixed, itemised pricing", haloft: true, street: "partial", whatsapp: false },
  { feature: "Secure payment with receipt", haloft: true, street: false, whatsapp: false },
  { feature: "Walk-time to campus shown", haloft: true, street: false, whatsapp: "partial" },
  { feature: "Student reviews after stay", haloft: true, street: false, whatsapp: false },
  { feature: "Refund path if home isn't as listed", haloft: true, street: false, whatsapp: false },
];

function Cell({ v }: { v: boolean | "partial" }) {
  if (v === true) {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-teal-ink/10 text-teal-ink">
        <Check className="size-4" aria-hidden="true" />
      </span>
    );
  }
  if (v === "partial") {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Minus className="size-4" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <X className="size-4" aria-hidden="true" />
    </span>
  );
}

export function ComparisonTable() {
  return (
    <section id="comparison" className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center text-teal-ink">The honest comparison</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Where students find rooms today — and what&apos;s missing
          </h2>
        </div>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-border pb-4 pr-4 align-bottom font-display text-base font-bold text-foreground">
                  What matters
                </th>
                <th className="border-b-2 border-primary pb-4 text-center font-display text-base font-bold text-primary">
                  Haloft
                </th>
                <th className="border-b border-border px-4 pb-4 text-center font-display text-base font-bold text-foreground">
                  Street / agent
                </th>
                <th className="border-b border-border px-4 pb-4 text-center font-display text-base font-bold text-foreground">
                  WhatsApp groups
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.feature} className={i % 2 ? "bg-muted/40" : ""}>
                  <td className="border-b border-border/70 py-3.5 pr-4 font-medium text-foreground">
                    {r.feature}
                  </td>
                  <td className="border-b-2 border-primary/30 py-3.5 text-center">
                    <Cell v={r.haloft} />
                  </td>
                  <td className="border-b border-border/70 px-4 py-3.5 text-center">
                    <Cell v={r.street} />
                  </td>
                  <td className="border-b border-border/70 px-4 py-3.5 text-center">
                    <Cell v={r.whatsapp} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Street listings and WhatsApp groups work for many students — they just
          ask you to take the risk. Haloft moves that risk off your shoulders.
        </p>
      </div>
    </section>
  );
}
