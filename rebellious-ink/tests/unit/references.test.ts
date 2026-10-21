import { describe, expect, it } from "vitest";
import { isBookingReference } from "@/lib/references";
import { formatPence } from "@/lib/money";

describe("references and money", () => {
  it("validates RI-YYYY-NNNNNN", () => {
    expect(isBookingReference("RI-2026-001234")).toBe(true);
    expect(isBookingReference("RI-26-1")).toBe(false);
  });
  it("formats GBP", () => {
    expect(formatPence(12345)).toBe("£123.45");
    expect(formatPence(20000)).toBe("£200.00");
  });
});
