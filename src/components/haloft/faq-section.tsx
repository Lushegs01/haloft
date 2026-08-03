"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "How is Haloft different from finding a room on the street or in WhatsApp groups?",
    a: "Street and group listings ask you to take the risk: the room may not exist, the price may change, and there's no one to call. On Haloft, every listing is vetted, prices are itemised upfront, walk-times are shown, and payments move through Paystack only after our team confirms the room is available. You get a booking reference and a paper trail instead of a handshake.",
  },
  {
    q: "Are all listings really verified?",
    a: (
      <>
        Yes — verification is what Haloft exists for. Every listing goes through
        checks before going live: owner identity, physical confirmation of the
        home, and a review of what&apos;s actually available. It&apos;s designed to{" "}
        <em>reduce</em> housing fraud, not to be a badge that gets photocopied.
        If anything slips through, our refund policy backs you — details on the{" "}
        <Link href="/legal/refunds" className="font-semibold text-primary underline underline-offset-2">
          refunds page
        </Link>
        .
      </>
    ),
  },
  {
    q: "When do I actually pay?",
    a: "Requesting a room is free and non-binding. You're only charged after our team confirms the room is available and you choose to pay. Payment runs securely through Paystack via card or bank transfer, and you receive a receipt and booking reference.",
  },
  {
    q: "What happens if the room isn't what I was promised?",
    a: "If a verified property materially differs from its listing, or the room isn't available when you arrive, you're entitled to a full refund. If you cancel before moving in, you get a partial refund minus any deposit already committed to the owner. The full policy is published on the refunds page before you ever pay.",
  },
  {
    q: "Do you charge students agent or service fees?",
    a: "Haloft doesn't take commissions from students on verified listings, and every fee is shown on the property page before payment. Our final pricing structure will be published before Haloft launches on your campus — but what you'll always see upfront is the full, itemised cost.",
  },
  {
    q: "Is Haloft available at my university yet?",
    a: "We launch campus by campus so every area gets properly vetted listings. See the campuses section above for where we're live and where we're opening next — and sign up to be notified when we land at yours.",
  },
  {
    q: "I own student housing. How do I list on Haloft?",
    a: (
      <>
        Great — we&apos;re looking for genuine owners and managers. Apply by
        emailing{" "}
        <a href="mailto:support@haloft.homes?subject=List%20my%20property%20on%20Haloft" className="font-semibold text-primary underline underline-offset-2">
          support@haloft.homes
        </a>{" "}
        and our team will walk you through verification and listing. Your
        property gets the same vetting every student expects.
      </>
    ),
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center text-primary">Questions, answered honestly</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            FAQ
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isOpen ? "border-primary/40 bg-background" : "border-border bg-background"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-display text-[15px] font-bold text-foreground">
                    {f.q}
                  </span>
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
                      isOpen ? "rotate-45 bg-primary text-primary-foreground" : "bg-accent text-primary"
                    }`}
                    aria-hidden="true"
                  >
                    <Plus className="size-4" />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
