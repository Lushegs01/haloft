import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader, Section, CONTACT_EMAIL } from "../legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of Haloft.",
};

export default function TermsPage() {
  return (
    <>
      <LegalHeader title="Terms of Service" updated="3 July 2026" />

      <Section title="1. Who we are">
        <p>
          Haloft (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates an online
          marketplace that connects university students with verified
          accommodation near their campus. By creating an account or using the
          platform, you agree to these terms.
        </p>
      </Section>

      <Section title="2. What Haloft does and doesn't do">
        <p>
          We source, inspect, and list accommodation, and facilitate booking
          requests and payments between students and property owners. We are
          not the landlord and do not own the listed properties. The tenancy
          relationship is between you and the property owner.
        </p>
        <p>
          We take reasonable steps to verify listings, but you are responsible
          for satisfying yourself about a property before completing payment.
        </p>
      </Section>

      <Section title="3. Your account">
        <p>
          You must provide accurate information and keep your login details
          secure. You are responsible for activity under your account. You must
          be a current or prospective student to book accommodation.
        </p>
      </Section>

      <Section title="4. Bookings and payments">
        <p>
          Submitting a booking is a request, not a guarantee. Our team reviews
          and confirms availability, after which you pay to secure the room.
          Payments are processed by Paystack; by paying you also agree to their
          terms. Prices are shown in Nigerian Naira and include the amounts
          displayed at checkout.
        </p>
      </Section>

      <Section title="5. Cancellations and refunds">
        <p>
          You may cancel an unpaid booking at any time from your dashboard.
          Cancellations after payment are handled by our team and are subject to
          our <Link href="/legal/refunds" className="text-primary underline">Refund Policy</Link>.
        </p>
      </Section>

      <Section title="6. Acceptable use">
        <p>
          You agree not to misuse the platform, including submitting false
          information, attempting to access other users&apos; data, scraping,
          or interfering with the service. We may suspend accounts that breach
          these terms.
        </p>
      </Section>

      <Section title="7. Reviews">
        <p>
          Reviews must reflect genuine experiences of a completed stay. We
          moderate reviews and may remove content that is false, abusive, or
          violates others&apos; rights.
        </p>
      </Section>

      <Section title="8. Liability">
        <p>
          We provide the platform on a reasonable-efforts basis and do not
          guarantee uninterrupted availability. To the extent permitted by law,
          we are not liable for disputes arising directly between students and
          property owners, though we will assist in good faith.
        </p>
      </Section>

      <Section title="9. Changes and contact">
        <p>
          We may update these terms; material changes will be notified on the
          platform. Questions? Contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </>
  );
}
