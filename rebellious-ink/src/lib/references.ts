import type { Tx } from "./db";

/**
 * Allocates unique, human-readable references such as RI-2026-001234 and
 * ENQ-2026-000045 using a per-prefix, per-year counter row locked inside the
 * caller's transaction. Safe under concurrency (row-level lock via UPDATE).
 */
export async function allocateReference(tx: Tx, prefix: "RI" | "ENQ" | "INV", at = new Date()): Promise<string> {
  const year = at.getUTCFullYear();
  await tx.bookingReferenceCounter.upsert({
    where: { prefix_year: { prefix, year } },
    create: { prefix, year, next: 1 },
    update: {},
  });
  const rows = await tx.$queryRaw<{ next: number }[]>`
    UPDATE "BookingReferenceCounter"
    SET "next" = "next" + 1
    WHERE "prefix" = ${prefix} AND "year" = ${year}
    RETURNING "next" - 1 AS "next"`;
  const n = rows[0].next;
  return `${prefix}-${year}-${String(n).padStart(6, "0")}`;
}

export function isBookingReference(s: string) {
  return /^RI-\d{4}-\d{6}$/.test(s);
}
