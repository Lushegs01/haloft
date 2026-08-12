import { NextResponse } from "next/server";
import {
  isValidPaystackSignature,
  type PaystackChargeData,
} from "@/lib/paystack";
import { recordSuccessfulCharge } from "@/lib/payments";

// Paystack webhook — the source of truth for payment success.
// Configure in the Paystack dashboard: Settings > API Keys & Webhooks >
// Webhook URL = https://<your-domain>/api/paystack/webhook
//
// Every confirmed charge is recorded, whatever it turns out to be: exact,
// over, short, duplicate, or unattachable to a booking. Classification
// and the ledger happen inside one database transaction — see
// record_gateway_charge in migration 014 — so this handler cannot leave
// money half-recorded no matter where it is interrupted.

export const dynamic = "force-dynamic";

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
      // 200 regardless: Paystack retries on non-2xx, and a retry cannot
      // fix a charge we could not attach or a validation outcome. The
      // charge is already on the books as a payment_exception, which is
      // where finance looks — not here.
      console.error(
        `[paystack/webhook] ${event.data.reference} not recorded: ` +
          `${result.outcome}${result.reason ? ` — ${result.reason}` : ""}`
      );
    }
  }

  return NextResponse.json({ received: true });
}
