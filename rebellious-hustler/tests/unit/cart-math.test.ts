import { describe, expect, it } from "vitest";
import { amountToFreeShipping, clampQuantity, itemCount, qualifiesForFreeShipping, shippingOptions, subtotalPence } from "@/lib/cart-math";

const rates = { shippingStandardPence: 395, shippingExpressPence: 695, freeShippingThresholdPence: 6000 };

describe("cart totals", () => {
  it("sums lines and counts items", () => {
    const lines = [
      { unitPence: 2499, quantity: 2 },
      { unitPence: 1999, quantity: 1 },
    ];
    expect(subtotalPence(lines)).toBe(6997);
    expect(itemCount(lines)).toBe(3);
    expect(subtotalPence([])).toBe(0);
  });

  it("applies the free shipping threshold at exactly the threshold", () => {
    expect(qualifiesForFreeShipping(5999, rates)).toBe(false);
    expect(qualifiesForFreeShipping(6000, rates)).toBe(true);
    expect(amountToFreeShipping(4500, rates)).toBe(1500);
    expect(amountToFreeShipping(9000, rates)).toBe(0);
  });

  it("prices both shipping options and zeroes them above the threshold", () => {
    expect(shippingOptions(2000, rates).map((o) => [o.id, o.pence])).toEqual([
      ["standard", 395],
      ["express", 695],
    ]);
    expect(shippingOptions(6000, rates).map((o) => o.pence)).toEqual([0, 0]);
  });

  it("clamps quantities to stock and the per-line maximum of 10", () => {
    expect(clampQuantity(3, 10)).toBe(3);
    expect(clampQuantity(50, 100)).toBe(10);
    expect(clampQuantity(5, 2)).toBe(2);
    expect(clampQuantity(-1, 5)).toBe(0);
    expect(clampQuantity(2.7, 5)).toBe(2);
    expect(clampQuantity(Number.NaN, 5)).toBe(0);
  });
});
