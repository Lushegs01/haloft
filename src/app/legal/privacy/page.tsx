import type { Metadata } from "next";
import { LegalHeader, Section, CONTACT_EMAIL } from "../legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Haloft collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <>
      <LegalHeader title="Privacy Policy" updated="3 July 2026" />

      <Section title="Our commitment">
        <p>
          This policy explains how Haloft handles your personal data, in line
          with the Nigeria Data Protection Act / NDPR. We collect only what we
          need to run the service and never sell your data.
        </p>
      </Section>

      <Section title="What we collect">
        <p>
          <strong>Account data:</strong> your name, email, and phone number.
          <br />
          <strong>Booking data:</strong> the rooms you request, your stay dates,
          and any special requests you provide.
          <br />
          <strong>Payment data:</strong> payments are processed by Paystack; we
          store a transaction reference and status, not your card details.
          <br />
          <strong>Usage data:</strong> basic technical information needed to
          operate and secure the platform.
        </p>
      </Section>

      <Section title="How we use it">
        <p>
          To create and manage your account, process booking requests and
          payments, send transactional emails about your bookings, moderate
          reviews, provide support, and keep the platform secure. We rely on
          your consent and the performance of our service to you as the legal
          bases for this processing.
        </p>
      </Section>

      <Section title="Who we share it with">
        <p>
          We use trusted processors to run the service: <strong>Supabase</strong>{" "}
          (database and authentication), <strong>Paystack</strong> (payments),
          <strong> Resend</strong> (email), and <strong>Vercel</strong>{" "}
          (hosting). Property owners receive only the information needed to
          fulfil a confirmed booking. We do not sell your data.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You may request access to, correction of, or deletion of your personal
          data, and you may object to certain processing. To exercise these
          rights, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
            {CONTACT_EMAIL}
          </a>
          . You can also delete your account, after which we retain only what we
          are legally required to keep.
        </p>
      </Section>

      <Section title="Data retention and security">
        <p>
          We keep your data only as long as needed to provide the service and
          meet legal obligations. Access is protected by row-level security and
          encrypted connections. No system is perfectly secure, but we take
          reasonable measures to protect your information.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about your data? Reach us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </>
  );
}
