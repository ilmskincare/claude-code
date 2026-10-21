import { db, type Tx } from "./db";
import { createHash } from "node:crypto";

export type AuditInput = {
  actorId?: string | null;
  actorLabel: string;
  onBehalfOfId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  ip?: string | null;
  result?: string;
};

export function hashIp(ip?: string | null) {
  if (!ip) return null;
  return createHash("sha256").update(ip + (process.env.AUTH_SECRET ?? "")).digest("hex").slice(0, 32);
}

/** Append an audit entry. Never throws into the caller's business flow. */
export async function audit(input: AuditInput, tx?: Tx) {
  const client = tx ?? db;
  try {
    await client.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorLabel: input.actorLabel,
        onBehalfOfId: input.onBehalfOfId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before === undefined ? undefined : (JSON.parse(JSON.stringify(input.before)) as object),
        after: input.after === undefined ? undefined : (JSON.parse(JSON.stringify(input.after)) as object),
        reason: input.reason ?? null,
        ipHash: hashIp(input.ip),
        result: input.result ?? "ok",
      },
    });
  } catch (err) {
    console.error("audit write failed", err);
  }
}
