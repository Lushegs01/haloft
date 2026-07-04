import { describe, it, expect } from "vitest";
import { sanitizeSearchTerm, walkMinutes } from "./utils";

describe("sanitizeSearchTerm", () => {
  it("strips PostgREST filter metacharacters", () => {
    expect(sanitizeSearchTerm('a,b(c)"d\\e')).toBe("a b c d e");
  });
  it("collapses whitespace and trims", () => {
    expect(sanitizeSearchTerm("  self   contain  ")).toBe("self contain");
  });
  it("caps length at 100 characters", () => {
    expect(sanitizeSearchTerm("x".repeat(500))).toHaveLength(100);
  });
  it("neutralises an attempted filter injection", () => {
    // Would otherwise inject an extra OR condition into the .or() string
    const evil = "x,status.eq.draft";
    expect(sanitizeSearchTerm(evil)).toBe("x status.eq.draft");
    expect(sanitizeSearchTerm(evil)).not.toContain(",");
  });
});

describe("walkMinutes", () => {
  it("returns at least 1 minute for identical points", () => {
    expect(walkMinutes(7.25, 3.45, 7.25, 3.45)).toBe(1);
  });
  it("estimates a plausible short campus walk", () => {
    // ~500 m apart near FUNAAB → a few minutes on foot
    const mins = walkMinutes(7.2515, 3.451, 7.25, 3.45);
    expect(mins).toBeGreaterThan(1);
    expect(mins).toBeLessThan(15);
  });
  it("grows with distance", () => {
    const near = walkMinutes(7.25, 3.45, 7.251, 3.451);
    const far = walkMinutes(7.25, 3.45, 7.27, 3.47);
    expect(far).toBeGreaterThan(near);
  });
});
