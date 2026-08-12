import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/constants";

/**
 * Transactional email via Resend. Server-only.
 *
 * All sends are best-effort: if RESEND_API_KEY is unset (local/dev) or
 * the API call fails, we log and move on — a booking or payment must
 * never fail because an email didn't go out.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function fromAddress() {
  return process.env.EMAIL_FROM ?? "Haloft <no-reply@haloft.homes>";
}

function siteUrl() {
  return SITE_URL;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${params.subject}"`);
    return;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`[email] Resend rejected "${params.subject}": ${detail}`);
    }
  } catch (e) {
    console.error(`[email] send failed for "${params.subject}":`, e);
  }
}

/** Branded wrapper matching docs/email-templates and the site palette. */
function emailShell(opts: {
  heading: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
}): string {
  const ctaBlock = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 0;">
         <tr><td align="center" style="border-radius:9999px;background-color:#e86530;">
           <a href="${opts.cta.url}" style="display:inline-block;padding:13px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9999px;">${opts.cta.label}</a>
         </td></tr>
       </table>`
    : "";

  return `<html><body style="margin:0;padding:0;background-color:#f8fbff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fbff;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding:8px 0 24px;">
          <img src="${siteUrl()}/logo-mark.png" width="56" height="56" alt="Haloft" style="display:block;border:0;" />
        </td></tr>
        <tr><td style="background-color:#ffffff;border:1px solid #d8e4f0;border-radius:16px;padding:36px 32px;">
          <h1 style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;line-height:1.3;color:#1e3a6e;font-weight:700;">${opts.heading}</h1>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#4a5d80;">${opts.bodyHtml}</div>
          ${ctaBlock}
        </td></tr>
        <tr><td align="center" style="padding:24px 8px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b7fa8;">
            Haloft — verified student accommodation<br />
            <a href="${siteUrl()}" style="color:#6b7fa8;">${siteUrl().replace(/^https?:\/\//, "")}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function naira(amount: number) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type BookingEmailEvent = "received" | "confirmed" | "paid" | "cancelled";

/**
 * Sends the appropriate lifecycle email for a booking. Looks up the
 * student's email and booking details via the service-role client so
 * callers only pass an id. Never throws.
 */
export async function notifyBookingEvent(
  bookingId: string,
  event: BookingEmailEvent
): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: booking } = await admin
      .from("bookings")
      .select(
        "id, student_id, status, check_in_date, check_out_date, total_amount, rooms(name), properties(title, campuses(slug))"
      )
      .eq("id", bookingId)
      .single();

    if (!booking) return;

    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", booking.student_id)
      .single();

    if (!profile?.email) return;

    const firstName = profile.full_name?.split(" ")[0] ?? "there";
    const propertyTitle = booking.properties?.title ?? "your property";
    const roomName = booking.rooms?.name ?? "your room";
    const campusSlug = booking.properties?.campuses?.slug ?? "";
    const dashboardUrl = `${siteUrl()}/${campusSlug}/dashboard`;
    const stay = `${formatDate(booking.check_in_date)} → ${formatDate(booking.check_out_date)}`;
    const summary = `<p style="margin:0 0 8px;"><strong>${propertyTitle}</strong> — ${roomName}<br/>${stay}<br/>Total: <strong>${naira(booking.total_amount)}</strong></p>`;

    let subject: string;
    let heading: string;
    let bodyHtml: string;
    let cta: { label: string; url: string } | undefined;

    switch (event) {
      case "received":
        subject = "We've received your booking request — Haloft";
        heading = `Thanks, ${firstName} — request received`;
        bodyHtml = `<p style="margin:0 0 20px;">Our team is reviewing your booking to confirm the room is available. We'll email you as soon as it's confirmed so you can pay and secure it.</p>${summary}`;
        cta = { label: "View booking", url: dashboardUrl };
        break;
      case "confirmed":
        subject = "Your booking is confirmed — pay to secure it — Haloft";
        heading = `Good news, ${firstName} — you're confirmed!`;
        bodyHtml = `<p style="margin:0 0 20px;">Your room is available and reserved for you. Pay now to secure it — rooms are only held until payment is completed.</p>${summary}`;
        cta = { label: `Pay ${naira(booking.total_amount)} now`, url: dashboardUrl };
        break;
      case "paid":
        subject = "Payment received — your room is secured — Haloft";
        heading = `You're all set, ${firstName}! 🎉`;
        bodyHtml = `<p style="margin:0 0 20px;">We've received your payment and your room is secured. A payment receipt has been sent to you separately by Paystack. Show your booking on arrival.</p>${summary}`;
        cta = { label: "View booking", url: dashboardUrl };
        break;
      case "cancelled":
        subject = "Your booking has been cancelled — Haloft";
        heading = `Booking cancelled`;
        bodyHtml = `<p style="margin:0 0 20px;">Hi ${firstName}, your booking below has been cancelled. If you didn't request this or think it's a mistake, please contact our team.</p>${summary}`;
        cta = { label: "Find another room", url: `${siteUrl()}/${campusSlug}/search` };
        break;
    }

    await sendEmail({
      to: profile.email,
      subject,
      html: emailShell({ heading, bodyHtml, cta }),
    });
  } catch (e) {
    console.error(`[email] notifyBookingEvent(${bookingId}, ${event}) failed:`, e);
  }
}
