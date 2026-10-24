const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/** Format integer pence as a GBP string, e.g. 12345 -> "£123.45". */
export function formatPence(pence: number): string {
  return gbp.format(pence / 100);
}

export function poundsToPence(pounds: number | string): number {
  const n = typeof pounds === "string" ? Number(pounds) : pounds;
  if (!Number.isFinite(n)) throw new Error("Invalid amount");
  return Math.round(n * 100);
}
