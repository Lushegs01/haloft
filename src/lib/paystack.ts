import crypto from "crypto";

/**
 * Minimal Paystack API client (server-side only — uses the secret key).
 * https://paystack.com/docs/api/transaction/
 */

const PAYSTACK_API = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

/** Shape of `data` in charge.success webhooks and verify responses. */
export interface PaystackChargeData {
  reference: string;
  /** Amount in kobo (NGN * 100) */
  amount: number;
  currency: string;
  status: string;
  channel: string;
  paid_at: string | null;
  /**
   * Paystack's own cut, in kobo. Present on verify and on charge.success.
   * The ledger needs it: without it every charge books as though the full
   * amount were ours, and platform revenue is overstated by the gateway's
   * share of every transaction.
   */
  fees?: number | null;
  gateway_response?: string;
  customer?: { email?: string };
  metadata?: { booking_id?: string; campus_slug?: string } | null;
}

export async function paystackInitialize(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<{ authorizationUrl: string }> {
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      currency: "NGN",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.status || !json.data?.authorization_url) {
    throw new Error(json.message ?? "Paystack initialization failed");
  }
  return { authorizationUrl: json.data.authorization_url };
}

export async function paystackVerify(
  reference: string
): Promise<PaystackChargeData | null> {
  const res = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey()}` },
      cache: "no-store",
    }
  );

  const json = await res.json();
  if (!res.ok || !json.status || !json.data) return null;
  return json.data as PaystackChargeData;
}

/** Webhook authenticity check: HMAC-SHA512 of the raw body, hex-encoded. */
export function isValidPaystackSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
