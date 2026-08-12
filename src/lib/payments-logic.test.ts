import { describe, it, expect } from "vitest";
import {
  channelToMethod,
  assessCharge,
  toMinorUnits,
  splitCharge,
  bookingReference,
  tenancyTotal,
} from "./payments-logic";

describe("channelToMethod", () => {
  it("maps bank channels to bank_transfer", () => {
    expect(channelToMethod("bank")).toBe("bank_transfer");
    expect(channelToMethod("bank_transfer")).toBe("bank_transfer");
  });
  it("maps ussd and mobile_money to mobile_money", () => {
    expect(channelToMethod("ussd")).toBe("mobile_money");
    expect(channelToMethod("mobile_money")).toBe("mobile_money");
  });
  it("defaults unknown channels to card", () => {
    expect(channelToMethod("card")).toBe("card");
    expect(channelToMethod("qr")).toBe("card");
    expect(channelToMethod("")).toBe("card");
  });
});

describe("toMinorUnits", () => {
  it("converts naira to kobo", () => {
    expect(toMinorUnits(150_000)).toBe(15_000_000);
  });

  it("survives the float drift that DECIMAL strings introduce", () => {
    // Number("1250.55") * 100 is 125054.99999999999 before rounding, and
    // a kobo of drift is a payment refused for arithmetic.
    expect(toMinorUnits("1250.55")).toBe(125_055);
    expect(toMinorUnits("0.07")).toBe(7);
    expect(toMinorUnits("8.29")).toBe(829);
  });

  it("treats a missing amount as zero rather than NaN", () => {
    expect(toMinorUnits(null)).toBe(0);
    expect(toMinorUnits(undefined)).toBe(0);
  });
});

describe("assessCharge", () => {
  const total = 500_000;
  const exact = 50_000_000; // kobo

  it("accepts an exact match, and only an exact match, as clean", () => {
    const result = assessCharge(exact, "NGN", total);
    expect(result.classification).toBe("exact");
    expect(result.settles).toBe(true);
    expect(result.needsReconciliation).toBe(false);
    expect(result.surplusMinor).toBe(0);
    expect(result.shortfallMinor).toBe(0);
  });

  it("does NOT call an overpayment a success", () => {
    // The review's case: ₦550,000 against a ₦500,000 booking. The old
    // `amount >= expected` rule recorded this as an ordinary success and
    // the student's ₦50,000 went unmentioned.
    const result = assessCharge(55_000_000, "NGN", total);
    expect(result.classification).toBe("overpaid");
    expect(result.surplusMinor).toBe(5_000_000);
    expect(result.needsReconciliation).toBe(true);
  });

  it("still settles the booking on an overpayment", () => {
    // Refusing would leave the student both charged and unhoused. The
    // booking is covered; the surplus is a separate obligation.
    expect(assessCharge(55_000_000, "NGN", total).settles).toBe(true);
  });

  it("flags one kobo over as an overpayment, not a rounding allowance", () => {
    const result = assessCharge(exact + 1, "NGN", total);
    expect(result.classification).toBe("overpaid");
    expect(result.surplusMinor).toBe(1);
  });

  it("rejects underpayment and measures the shortfall", () => {
    const result = assessCharge(40_000_000, "NGN", total);
    expect(result.classification).toBe("underpaid");
    expect(result.settles).toBe(false);
    expect(result.shortfallMinor).toBe(10_000_000);
    expect(result.needsReconciliation).toBe(true);
  });

  it("rejects underpayment by a single kobo", () => {
    expect(assessCharge(exact - 1, "NGN", total).settles).toBe(false);
  });

  it("cannot settle a booking from another currency, however large", () => {
    const result = assessCharge(99_999_999_99, "USD", total);
    expect(result.classification).toBe("currency_mismatch");
    expect(result.settles).toBe(false);
    expect(result.needsReconciliation).toBe(true);
  });

  it("compares fractional totals without float drift", () => {
    expect(assessCharge(125_055, "NGN", "1250.55").classification).toBe("exact");
    expect(assessCharge(125_054, "NGN", "1250.55").classification).toBe("underpaid");
    expect(assessCharge(125_056, "NGN", "1250.55").classification).toBe("overpaid");
  });
});

describe("splitCharge", () => {
  it("gives the landlord their quoted share of the booking", () => {
    // 10% commission on a ₦500,000 booking, ₦7,500 to Paystack.
    const split = splitCharge({
      chargedAmount: 500_000,
      bookingTotal: 500_000,
      gatewayFee: 7_500,
      commissionBps: 1000,
    });
    expect(split.landlord).toBe(450_000);
    // The platform's 50,000 less the gateway's 7,500.
    expect(split.commission).toBe(42_500);
    expect(split.surplus).toBe(0);
  });

  it("keeps the surplus out of the landlord's accrual", () => {
    const split = splitCharge({
      chargedAmount: 550_000,
      bookingTotal: 500_000,
      gatewayFee: 7_500,
      commissionBps: 1000,
    });
    expect(split.surplus).toBe(50_000);
    // Unchanged: the landlord is owed for the booking, not for a mistake.
    expect(split.landlord).toBe(450_000);
    expect(split.commission).toBe(42_500);
  });

  it("always decomposes the charge exactly", () => {
    const charged = 550_000;
    const split = splitCharge({
      chargedAmount: charged,
      bookingTotal: 500_000,
      gatewayFee: 7_500,
      commissionBps: 1000,
    });
    // This identity is what makes the ledger balance; migration 014
    // computes commission as the same residual.
    expect(split.landlord + split.commission + split.gatewayFee + split.surplus).toBe(
      charged
    );
  });

  it("reports a negative commission when the fee exceeds the share", () => {
    // A small booking with a flat-ish gateway fee: a real loss, and it
    // must be visible rather than clamped to zero.
    const split = splitCharge({
      chargedAmount: 10_000,
      bookingTotal: 10_000,
      gatewayFee: 500,
      commissionBps: 200, // 2% = 200, fee 500
    });
    expect(split.landlord).toBe(9_800);
    expect(split.commission).toBe(-300);
  });

  it("accrues nothing to the landlord on a charge that does not settle", () => {
    const split = splitCharge({
      chargedAmount: 400_000,
      bookingTotal: 500_000,
      gatewayFee: 6_000,
      commissionBps: 1000,
    });
    expect(split.landlord).toBe(0);
  });
});

describe("bookingReference", () => {
  it("is prefixed, uppercased, and embeds the booking prefix", () => {
    const ref = bookingReference("550e8400-e29b-41d4-a716-446655440011", 0);
    expect(ref).toMatch(/^HLF-550E8400-0$/);
  });
  it("differs across timestamps for the same booking", () => {
    const a = bookingReference("abcdef12-0000", 1);
    const b = bookingReference("abcdef12-0000", 2);
    expect(a).not.toBe(b);
  });
});

describe("tenancyTotal", () => {
  it("sums rent, agency and caution into the one charged figure", () => {
    expect(tenancyTotal(1_200_000, 100_000, 50_000)).toBe(1_350_000);
  });

  it("treats missing fees as zero, so a rent-only room still prices", () => {
    expect(tenancyTotal(900_000, null, undefined)).toBe(900_000);
    expect(tenancyTotal(900_000, 0, 0)).toBe(900_000);
  });

  it("coerces the strings PostgREST returns for DECIMAL columns", () => {
    // supabase-js hands back DECIMAL(12,2) as a string; a bare + would
    // concatenate and quote a wildly wrong price.
    expect(
      tenancyTotal(
        "1200000" as unknown as number,
        "100000" as unknown as number,
        "50000" as unknown as number
      )
    ).toBe(1_350_000);
  });

  it("is zero for a room with nothing set", () => {
    expect(tenancyTotal(null, null, null)).toBe(0);
  });
});
