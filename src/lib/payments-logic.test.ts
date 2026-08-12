import { describe, it, expect } from "vitest";
import {
  channelToMethod,
  chargeCoversBooking,
  isOverpayment,
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

describe("chargeCoversBooking", () => {
  it("accepts an exact NGN match (naira → kobo)", () => {
    expect(chargeCoversBooking(150_000_00, "NGN", 150_000)).toBe(true);
  });
  it("accepts overpayment", () => {
    expect(chargeCoversBooking(160_000_00, "NGN", 150_000)).toBe(true);
  });
  it("rejects underpayment even by one kobo", () => {
    expect(chargeCoversBooking(150_000_00 - 1, "NGN", 150_000)).toBe(false);
  });
  it("rejects non-NGN currency regardless of amount", () => {
    expect(chargeCoversBooking(999_999_00, "USD", 150_000)).toBe(false);
  });
  it("handles fractional naira totals without float drift", () => {
    // 1250.55 naira == 125055 kobo
    expect(chargeCoversBooking(125_055, "NGN", 1250.55)).toBe(true);
    expect(chargeCoversBooking(125_054, "NGN", 1250.55)).toBe(false);
  });
});

describe("isOverpayment", () => {
  it("is true only above the total", () => {
    expect(isOverpayment(150_000_01, 150_000)).toBe(true);
    expect(isOverpayment(150_000_00, 150_000)).toBe(false);
    expect(isOverpayment(149_999_99, 150_000)).toBe(false);
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
