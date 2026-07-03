import { NextResponse } from "next/server";
import { paystackVerify } from "@/lib/paystack";
import { recordSuccessfulCharge } from "@/lib/payments";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";

// Where Paystack sends the student's browser after checkout. The charge
// is verified against the Paystack API (never trusted from the URL) and
// recorded idempotently — the webhook may have already done so.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  let outcome: "success" | "failed" = "failed";
  let campus = DEFAULT_CAMPUS_SLUG;

  if (reference) {
    try {
      const charge = await paystackVerify(reference);
      if (charge?.metadata?.campus_slug) {
        campus = charge.metadata.campus_slug;
      }
      if (charge?.status === "success") {
        const result = await recordSuccessfulCharge(charge);
        outcome = result.ok ? "success" : "failed";
        if (!result.ok) {
          console.error(
            `Paystack callback: charge ${reference} not recorded: ${result.reason}`
          );
        }
      }
    } catch (e) {
      console.error("Paystack callback verification failed:", e);
    }
  }

  return NextResponse.redirect(
    `${origin}/${campus}/dashboard?payment=${outcome}`
  );
}
