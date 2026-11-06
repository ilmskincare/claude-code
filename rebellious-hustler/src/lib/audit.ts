import { db, type Tx } from "./db";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

/** Record who changed what. Called from every admin write, inside its transaction where one exists. */
export async function recordAudit(
  input: { actor: string; action: string; entity: string; entityId?: string | null; before?: unknown; after?: unknown },
  tx: Tx | typeof db = db,
) {
  await tx.auditLog.create({
    data: {
      actor: input.actor,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      before: toJson(input.before),
      after: toJson(input.after),
    },
  });
}

function toJson(value: unknown): Json | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v))) as Json;
}
