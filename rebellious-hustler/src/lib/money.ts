const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/** Format integer pence as GBP, e.g. 2499 -> "£24.99". */
export function formatPence(pence: number): string {
  return gbp.format(pence / 100);
}

/**
 * Parse a price typed into the admin ("24.99", "£24.99", "24") into integer pence.
 * Returns null for anything that is not a non-negative amount with at most two decimals.
 */
export function parsePoundsToPence(input: string): number | null {
  const cleaned = input.trim().replace(/^£/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

/** Pence to a plain pounds string for form fields, e.g. 2499 -> "24.99". */
export function penceToPoundsInput(pence: number | null | undefined): string {
  if (pence == null) return "";
  return (pence / 100).toFixed(2);
}
