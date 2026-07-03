import { NextResponse } from "next/server";
import {
  isValidPaystackSignature,
  type PaystackChargeData,
} from "@/lib/paystack";
import { recordSuccessfulCharge } from "@/lib/payments";

// Paystack webhook — the source of truth for payment success.
// Configure in the Paystack dashboard: Settings > API Keys & Webhooks >
// Webhook URL = https://<your-domain>/api/paystack/webhook

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (
    !isValidPaystackSignature(
      rawBody,
      request.headers.get("x-paystack-signature")
    )
  ) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: PaystackChargeData };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const result = await recordSuccessfulCharge(event.data);
    if (!result.ok) {
      // Log for investigation but still 200 — Paystack retries on
      // non-2xx, and retrying won't fix a validation failure.
      console.error(
        `Paystack webhook: charge ${event.data.reference} not recorded: ${result.reason}`
      );
    }
  }

  return NextResponse.json({ received: true });
}
