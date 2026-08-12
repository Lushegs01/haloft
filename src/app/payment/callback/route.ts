import { NextResponse } from "next/server";
import { paystackVerify } from "@/lib/paystack";
import { recordSuccessfulCharge, campusSlugForReference } from "@/lib/payments";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";

/**
 * Where Paystack sends the student's browser after checkout.
 *
 * The charge is verified against the Paystack API — never trusted from
 * the URL — and recorded idempotently, because the webhook has usually
 * already done it.
 *
 * ── The redirect destination ────────────────────────────────
 *
 * This used to build the destination from `charge.metadata.campus_slug`:
 *
 *     campus = charge.metadata.campus_slug
 *     redirect(`/${campus}/dashboard`)
 *
 * The payment itself was independently verified, so that was not a way to
 * fake a payment. It was still the wrong authority. Metadata is a field
 * that travels with the transaction; the campus is a fact the database
 * holds, reachable from the booking the charge is attached to. So it is
 * read from there, and a slug that resolves to nothing falls back to the
 * default campus rather than being pasted into a path.
 *
 * `outcome` distinguishes three things the student can actually act on:
 *   success — paid and settled
 *   review  — money taken, but not a clean settlement (short, wrong
 *             currency, or a duplicate). Support has it; do not tell
 *             someone who has been charged that nothing happened.
 *   failed  — no money moved
 */

export const dynamic = "force-dynamic";

type Outcome = "success" | "failed" | "review";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  let outcome: Outcome = "failed";
  let campus: string | null = null;

  if (reference) {
    try {
      const charge = await paystackVerify(reference);

      if (charge?.status === "success") {
        const result = await recordSuccessfulCharge(charge);

        if (result.settled) {
          outcome = "success";
        } else if (result.ok || result.outcome === "unattributable") {
          // The charge exists on our side (as a payment row or a parked
          // exception) but did not settle the booking. That is a finance
          // question, not a failure to tell the student about as "try
          // again" — trying again would take their money twice.
          outcome = "review";
        }

        if (!result.ok) {
          console.error(
            `[payment/callback] ${reference} not settled: ${result.outcome} ${result.reason ?? ""}`
          );
        }
      }

      campus = await campusSlugForReference(reference);
    } catch (e) {
      console.error("[payment/callback] verification failed:", e);
    }
  }

  const destination = new URL(
    `/${campus ?? DEFAULT_CAMPUS_SLUG}/dashboard`,
    origin
  );
  destination.searchParams.set("payment", outcome);

  return NextResponse.redirect(destination);
}
