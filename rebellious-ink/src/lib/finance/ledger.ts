import { randomUUID } from "node:crypto";
import type { Tx } from "../db";
import { LedgerAccount } from "@/generated/prisma/enums";

type Line = { account: LedgerAccount; debitPence?: number; creditPence?: number };

/** Post a balanced journal (sum of debits must equal sum of credits). */
export async function postJournal(tx: Tx, input: {
  description: string;
  occurredAt: Date;
  lines: Line[];
  appointmentId?: string | null;
  paymentId?: string | null;
  artistId?: string | null;
  createdById?: string | null;
}) {
  const d = input.lines.reduce((s, l) => s + (l.debitPence ?? 0), 0);
  const c = input.lines.reduce((s, l) => s + (l.creditPence ?? 0), 0);
  if (d !== c) throw new Error(`Unbalanced journal: debits ${d} ≠ credits ${c}`);
  const entryGroupId = randomUUID();
  await tx.financialLedgerEntry.createMany({
    data: input.lines.map((l) => ({
      entryGroupId,
      account: l.account,
      debitPence: l.debitPence ?? 0,
      creditPence: l.creditPence ?? 0,
      description: input.description,
      occurredAt: input.occurredAt,
      appointmentId: input.appointmentId ?? null,
      paymentId: input.paymentId ?? null,
      artistId: input.artistId ?? null,
      createdById: input.createdById ?? null,
    })),
  });
  return entryGroupId;
}

/** Deposit received via Stripe: cash clears into Stripe clearing, liability to client created. */
export function depositReceivedLines(amountPence: number, method: "CARD_STRIPE" | "BANK_TRANSFER" | "CASH"): Line[] {
  const cashAccount: LedgerAccount = method === "CARD_STRIPE" ? "STRIPE_CLEARING" : method === "CASH" ? "CASH" : "BANK";
  return [
    { account: cashAccount, debitPence: amountPence },
    { account: "CLIENT_DEPOSITS_HELD", creditPence: amountPence },
  ];
}

/** Reverse a journal group with an equal and opposite set of lines. */
export async function reverseJournal(tx: Tx, entryGroupId: string, reason: string, createdById?: string | null) {
  const lines = await tx.financialLedgerEntry.findMany({ where: { entryGroupId } });
  if (!lines.length) throw new Error("Journal not found");
  const newGroup = randomUUID();
  await tx.financialLedgerEntry.createMany({
    data: lines.map((l) => ({
      entryGroupId: newGroup,
      account: l.account,
      debitPence: l.creditPence,
      creditPence: l.debitPence,
      description: `Reversal: ${reason}`,
      occurredAt: new Date(),
      appointmentId: l.appointmentId,
      paymentId: l.paymentId,
      artistId: l.artistId,
      reversalOfId: l.id,
      createdById: createdById ?? null,
    })),
  });
  return newGroup;
}
