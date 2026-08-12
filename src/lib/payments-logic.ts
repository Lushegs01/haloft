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
 * What a charge is, relative to the booking it names.
 *
 *   exact             — the amount and currency agree. The only clean case.
 *   overpaid          — covers the booking, with a surplus owed back.
 *   underpaid         — short. Does not settle anything.
 *   currency_mismatch — cannot be compared to the total at all.
 */
export type ChargeClassification =
  | "exact"
  | "overpaid"
  | "underpaid"
  | "currency_mismatch";

export interface ChargeAssessment {
  classification: ChargeClassification;
  /** Whether this charge pays for the booking. */
  settles: boolean;
  /** Kobo over the expected total. Zero unless overpaid. */
  surplusMinor: number;
  /** Kobo under the expected total. Zero unless underpaid. */
  shortfallMinor: number;
  expectedMinor: number;
  /** True when the charge needs a human before the money is anyone's. */
  needsReconciliation: boolean;
}

/**
 * Converts a naira amount to kobo without float drift.
 *
 * PostgREST returns DECIMAL(12,2) as a string, and `Number("1250.55") *
 * 100` is 125054.99999999999. Rounding after the multiply is what makes
 * the comparison exact — a kobo of drift here is a payment refused for a
 * rounding error, or accepted for one.
 */
export function toMinorUnits(amount: number | string | null | undefined): number {
  return Math.round(Number(amount ?? 0) * 100);
}

/**
 * Classifies a charge against its booking.
 *
 * ── Why this is not `amount >= expected` ────────────────────
 *
 * It used to be. `chargeCoversBooking` returned true for anything at or
 * above the total, on the reasoning that the booking was covered and an
 * overpayment would be "flagged separately". Nothing flagged it. A
 * student who paid ₦550,000 for a ₦500,000 room had the charge accepted,
 * recorded as successful, and the extra ₦50,000 mentioned nowhere.
 *
 * Acceptance is now exact equality. Overpayment is still ACCEPTED — the
 * booking genuinely is covered and refusing would leave the student both
 * charged and unhoused — but it is accepted as a distinct outcome that
 * carries a refund obligation, not as an ordinary success.
 *
 * This function decides; `record_gateway_charge` (migration 014) is what
 * writes the decision down, in the same transaction as the money. The
 * two agree by construction because the tests assert against both.
 */
export function assessCharge(
  chargeAmountMinor: number,
  chargeCurrency: string,
  bookingTotal: number | string,
  bookingCurrency = "NGN"
): ChargeAssessment {
  const expectedMinor = toMinorUnits(bookingTotal);

  if (chargeCurrency !== bookingCurrency) {
    return {
      classification: "currency_mismatch",
      settles: false,
      surplusMinor: 0,
      shortfallMinor: 0,
      expectedMinor,
      needsReconciliation: true,
    };
  }

  if (chargeAmountMinor === expectedMinor) {
    return {
      classification: "exact",
      settles: true,
      surplusMinor: 0,
      shortfallMinor: 0,
      expectedMinor,
      needsReconciliation: false,
    };
  }

  if (chargeAmountMinor > expectedMinor) {
    return {
      classification: "overpaid",
      settles: true,
      surplusMinor: chargeAmountMinor - expectedMinor,
      shortfallMinor: 0,
      expectedMinor,
      needsReconciliation: true,
    };
  }

  return {
    classification: "underpaid",
    settles: false,
    surplusMinor: 0,
    shortfallMinor: expectedMinor - chargeAmountMinor,
    expectedMinor,
    needsReconciliation: true,
  };
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

/**
 * How a settled charge divides up.
 *
 * Mirrors `write_payment_ledger` (migration 014) so the application can
 * quote a landlord their share without a round trip, and so a change to
 * one has an obviously-failing test against the other.
 *
 *   landlord   = booking total less the platform's basis points
 *   commission = the platform's share, less what the gateway kept
 *   surplus    = anything above the booking total; the student's money
 *
 * The gateway fee comes out of the platform's share, not the landlord's:
 * a landlord quoted 90% receives 90%, whatever Paystack charged us that
 * day. Commission can therefore go negative on a small booking with a
 * flat fee, and that is a real loss, not an error.
 */
export interface ChargeSplit {
  landlord: number;
  commission: number;
  gatewayFee: number;
  surplus: number;
}

export function splitCharge(params: {
  chargedAmount: number;
  bookingTotal: number;
  gatewayFee: number;
  commissionBps: number;
}): ChargeSplit {
  const charged = Number(params.chargedAmount);
  const total = Number(params.bookingTotal);
  const gatewayFee = Number(params.gatewayFee);
  const bps = Number(params.commissionBps);

  const surplus = Math.max(0, round2(charged - total));
  const settled = charged >= total;

  const landlord = settled ? round2((total * (10000 - bps)) / 10000) : 0;
  const commission = round2(charged - gatewayFee - landlord - surplus);

  return { landlord, commission, gatewayFee, surplus };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
