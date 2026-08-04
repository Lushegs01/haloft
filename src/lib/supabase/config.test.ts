import { describe, expect, it } from "vitest";
import { SERVICE_UNAVAILABLE_MESSAGE, describeAuthError } from "./config";

describe("describeAuthError", () => {
  it("replaces browser network failures with a message a visitor can act on", () => {
    // What an unconfigured build actually produces: the client points at
    // localhost, the request never lands, and supabase-js hands back the
    // browser's raw text.
    for (const raw of [
      "Failed to fetch",
      "NetworkError when attempting to fetch resource.",
      "Load failed",
      "fetch failed",
      "Network request failed",
    ]) {
      expect(describeAuthError({ message: raw })).toBe(SERVICE_UNAVAILABLE_MESSAGE);
    }
  });

  it("passes real auth errors through unchanged", () => {
    for (const raw of [
      "Invalid login credentials",
      "User already registered",
      "Password should be at least 6 characters",
      "Email not confirmed",
    ]) {
      expect(describeAuthError({ message: raw })).toBe(raw);
    }
  });

  it("falls back when the error carries no usable message", () => {
    expect(describeAuthError(null)).toBe(SERVICE_UNAVAILABLE_MESSAGE);
    expect(describeAuthError({})).toBe(SERVICE_UNAVAILABLE_MESSAGE);
    expect(describeAuthError({ message: "   " })).toBe(SERVICE_UNAVAILABLE_MESSAGE);
  });
});
