import { describe, expect, it } from "vitest";
import { formatAddressLines, formatOrderNumber } from "@/lib/orders";

describe("order numbers", () => {
  it("pads the sequence to six digits per year", () => {
    expect(formatOrderNumber(2026, 1)).toBe("RH-2026-000001");
    expect(formatOrderNumber(2026, 42)).toBe("RH-2026-000042");
    expect(formatOrderNumber(2027, 123456)).toBe("RH-2027-123456");
  });

  it("formats a GB address for emails and order pages", () => {
    expect(formatAddressLines({ name: "Sam Smith", line1: "4 Fox & Goose Shopping Centre", city: "Birmingham", postal_code: "B8 2EP", country: "GB" })).toEqual([
      "Sam Smith",
      "4 Fox & Goose Shopping Centre",
      "Birmingham",
      "B8 2EP",
      "United Kingdom",
    ]);
    expect(formatAddressLines(null)).toEqual([]);
    expect(formatAddressLines({ line1: " ", city: "Birmingham" })).toEqual(["Birmingham"]);
  });
});
