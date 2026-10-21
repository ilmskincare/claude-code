import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";

export const promotionSchema = z.object({
  scope: z.enum(["STUDIO", "ARTIST"]),
  artistId: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(3).max(40),
  details: z.string().trim().max(600).optional().or(z.literal("")),
  code: z.string().trim().max(20).optional().or(z.literal("")),
  startsAt: z.string().min(1),
  endsAt: z.string().optional().or(z.literal("")),
  showOnPublic: z.coerce.boolean().optional(),
});
export type PromotionInput = z.infer<typeof promotionSchema>;

/** Studio-wide offers need studio.manage or roster.manage; artist offers are the artist's own or roster.manage. */
function assertCanManage(p: Principal, scope: "STUDIO" | "ARTIST", artistId: string | null) {
  if (can(p, "roster.manage")) return;
  if (scope === "ARTIST" && artistId && p.artistProfileId === artistId) return;
  throw new ForbiddenError();
}

export async function savePromotion(p: Principal, input: PromotionInput, id?: string) {
  const artistId = input.scope === "ARTIST" ? input.artistId || p.artistProfileId || null : null;
  if (input.scope === "ARTIST" && !artistId) throw new ValidationError("Choose the artist this promotion is for.");
  assertCanManage(p, input.scope, artistId);
  const startsAt = new Date(input.startsAt);
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (Number.isNaN(startsAt.getTime())) throw new ValidationError("Enter a start date.");
  if (endsAt && endsAt <= startsAt) throw new ValidationError("The end must be after the start.");
  if (id) {
    const existing = await db.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError();
    assertCanManage(p, existing.scope, existing.artistId);
  }
  const data = { scope: input.scope, artistId, title: input.title, details: input.details || null, code: input.code ? input.code.toUpperCase() : null, startsAt, endsAt, showOnPublic: input.showOnPublic ?? true, createdById: p.userId };
  const promo = id ? await db.promotion.update({ where: { id }, data: { ...data, createdById: undefined } }) : await db.promotion.create({ data });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: id ? "promotion.updated" : "promotion.created", entityType: "Promotion", entityId: promo.id, after: { scope: promo.scope, artistId: promo.artistId, title: promo.title, startsAt: promo.startsAt, endsAt: promo.endsAt } });
  return promo;
}

/** Ending a promotion keeps the record; it simply stops showing. */
export async function endPromotion(p: Principal, id: string) {
  const promo = await db.promotion.findUnique({ where: { id } });
  if (!promo) throw new NotFoundError();
  assertCanManage(p, promo.scope, promo.artistId);
  const ended = await db.promotion.update({ where: { id }, data: { isActive: false, endsAt: promo.endsAt && promo.endsAt < new Date() ? promo.endsAt : new Date() } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "promotion.ended", entityType: "Promotion", entityId: id, before: { isActive: true }, after: { isActive: false } });
  return ended;
}

export function isLive(promo: { isActive: boolean; startsAt: Date; endsAt: Date | null }, now = new Date()) {
  return promo.isActive && promo.startsAt <= now && (!promo.endsAt || promo.endsAt > now);
}

const liveWhere = (now: Date) => ({ isActive: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] });

/** Live promotions for the public site: studio banner plus one ribbon per artist (the newest). */
export async function livePromotions(now = new Date()) {
  const rows = await db.promotion.findMany({ where: { ...liveWhere(now), showOnPublic: true }, orderBy: { startsAt: "desc" } });
  const studio = rows.filter((r) => r.scope === "STUDIO");
  const byArtist = new Map<string, (typeof rows)[number]>();
  for (const r of rows) if (r.scope === "ARTIST" && r.artistId && !byArtist.has(r.artistId)) byArtist.set(r.artistId, r);
  return { studio, byArtist };
}

/** Everything, for the owner page and the desk: live, scheduled and ended. */
export async function allPromotions(artistId?: string) {
  const rows = await db.promotion.findMany({ where: artistId ? { artistId } : {}, include: { artist: { select: { displayName: true, slug: true } } }, orderBy: [{ startsAt: "desc" }] });
  const now = new Date();
  return rows.map((r) => ({ ...r, state: isLive(r, now) ? "live" : !r.isActive || (r.endsAt && r.endsAt <= now) ? "ended" : "scheduled" as const }));
}
