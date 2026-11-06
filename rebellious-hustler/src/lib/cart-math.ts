import { MAX_LINE_QTY } from "./site";

export type ShippingRates = { shippingStandardPence: number; shippingExpressPence: number; freeShippingThresholdPence: number };

export type PricedLine = { unitPence: number; quantity: number };

export function subtotalPence(lines: PricedLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPence * l.quantity, 0);
}

export function itemCount(lines: { quantity: number }[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

/** Free delivery applies to both services once the subtotal reaches the threshold. */
export function qualifiesForFreeShipping(subtotal: number, rates: ShippingRates): boolean {
  return subtotal >= rates.freeShippingThresholdPence;
}

export function amountToFreeShipping(subtotal: number, rates: ShippingRates): number {
  return Math.max(0, rates.freeShippingThresholdPence - subtotal);
}

export type ShippingOption = { id: "standard" | "express"; name: string; pence: number; estimate: string };

export function shippingOptions(subtotal: number, rates: ShippingRates): ShippingOption[] {
  const free = qualifiesForFreeShipping(subtotal, rates);
  return [
    { id: "standard", name: "UK Standard", pence: free ? 0 : rates.shippingStandardPence, estimate: "2 to 4 working days" },
    { id: "express", name: "UK Express", pence: free ? 0 : rates.shippingExpressPence, estimate: "1 to 2 working days" },
  ];
}

/** Clamp a requested quantity to the per-line maximum and the stock on hand. */
export function clampQuantity(requested: number, stockQty: number): number {
  if (!Number.isFinite(requested)) return 0;
  return Math.max(0, Math.min(Math.floor(requested), MAX_LINE_QTY, stockQty));
}
