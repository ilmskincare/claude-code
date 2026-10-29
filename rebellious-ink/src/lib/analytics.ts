import { db } from "./db";

export type EventName = "game_viewed" | "play_started" | "result_shown" | "deposit_paid" | "replay_bought" | "age_gate_passed" | "restock_alert_signup";

/** First-party analytics: one row per event, no third-party tracker. Never throws. */
export async function track(name: EventName, data: { game?: string; visitorId?: string | null; userId?: string | null; designId?: string | null; playId?: string | null } = {}) {
  try {
    await db.analyticsEvent.create({ data: { name, game: data.game ?? null, visitorId: data.visitorId ?? null, userId: data.userId ?? null, designId: data.designId ?? null, playId: data.playId ?? null } });
  } catch (e) {
    console.error("analytics failed", e);
  }
}

export async function eventCounts(game: string, since: Date) {
  const rows = await db.analyticsEvent.groupBy({ by: ["name"], where: { game, createdAt: { gte: since } }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.name, r._count._all])) as Record<string, number>;
}
