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

/**
 * What a student pays for a one-year tenancy: rent, agency fee and
 * caution fee in a single transaction.
 *
 * This mirrors the total create_booking writes to bookings.total_amount
 * (013_annual_pricing.sql), which is the figure Paystack actually
 * charges. Every surface that quotes a price must go through here — a
 * screen that adds the components up itself is a screen that can drift
 * from the amount on the checkout page.
 */
export function tenancyTotal(
  annualRent: number | null | undefined,
  agencyFee: number | null | undefined,
  cautionFee: number | null | undefined
): number {
  return Number(annualRent ?? 0) + Number(agencyFee ?? 0) + Number(cautionFee ?? 0);
}

/** Deterministic, collision-resistant Paystack reference for a booking. */
export function bookingReference(bookingId: string, now = Date.now()): string {
  return `HLF-${bookingId.slice(0, 8)}-${now.toString(36)}`.toUpperCase();
}
