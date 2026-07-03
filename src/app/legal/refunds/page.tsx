import type { Metadata } from "next";
import { LegalHeader, Section, CONTACT_EMAIL } from "../legal";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "When and how refunds are handled on Haloft.",
};

export default function RefundsPage() {
  return (
    <>
      <LegalHeader title="Refund Policy" updated="3 July 2026" />

      <Section title="Before you pay">
        <p>
          Submitting a booking request is free and non-binding. You are only
          charged after our team confirms the room is available and you choose
          to pay. You can cancel an unpaid booking at any time with no charge.
        </p>
      </Section>

      <Section title="After you pay">
        <p>
          Because rooms are limited and taken off the market once secured,
          refund eligibility depends on the timing and reason for cancellation:
        </p>
        <p>
          <strong>Property not as described or unavailable on arrival:</strong>{" "}
          full refund. If a verified property materially differs from its
          listing, or the room is not available when you arrive, we refund you
          in full.
        </p>
        <p>
          <strong>You cancel before moving in:</strong> partial refund. We
          refund your payment minus any deposit already committed to the
          property owner and payment-processing fees. The exact amount depends
          on how close to the move-in date you cancel.
        </p>
        <p>
          <strong>After move-in:</strong> generally non-refundable, as the
          tenancy has begun. Disputes with the property owner after move-in are
          handled case by case.
        </p>
      </Section>

      <Section title="How to request a refund">
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
            {CONTACT_EMAIL}
          </a>{" "}
          with your booking reference and the reason. We aim to review requests
          within 3 business days. Approved refunds are returned to your original
          payment method via Paystack and may take several business days to
          appear.
        </p>
      </Section>

      <Section title="Note">
        <p>
          This policy is offered in good faith to protect students from scams
          and misrepresentation — the core reason Haloft exists. Specific terms
          may vary by property and will be made clear before you pay.
        </p>
      </Section>
    </>
  );
}
