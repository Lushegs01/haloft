/**
 * Pure payment helpers — no I/O, no env, no clients. Kept separate so
 * the money-critical logic is unit-testable in isolation.
 */

export type PaymentMethod = "card" | "bank_transfer" | "mobile_money" | "cash";

/** Maps a Paystack channel string to our payment_method enum. */
export function channelToMethod(channel: string): PaymentMethod {
  if (channel === "bank" || channel === "bank_transfer") return "bank_transfer";
  if (channel === "ussd" || channel === "mobile_money") return "mobile_money";
  return "card";
}

/**
 * A charge is acceptable only if it is in NGN and covers at least the
 * booking total (amounts in kobo). Underpayment or wrong currency is
 * rejected; overpayment is allowed (flagged separately for review).
 */
export function chargeCoversBooking(
  chargeAmountKobo: number,
  chargeCurrency: string,
  bookingTotalNaira: number
): boolean {
  const expectedKobo = Math.round(Number(bookingTotalNaira) * 100);
  return chargeCurrency === "NGN" && chargeAmountKobo >= expectedKobo;
}

/** True when the charge is strictly more than the booking total. */
export function isOverpayment(
  chargeAmountKobo: number,
  bookingTotalNaira: number
): boolean {
  return chargeAmountKobo > Math.round(Number(bookingTotalNaira) * 100);
}

/** Deterministic, collision-resistant Paystack reference for a booking. */
export function bookingReference(bookingId: string, now = Date.now()): string {
  return `HLF-${bookingId.slice(0, 8)}-${now.toString(36)}`.toUpperCase();
}
