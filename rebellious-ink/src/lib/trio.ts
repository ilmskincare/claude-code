import { randomInt } from "node:crypto";
import { z } from "zod";
import { DateTime } from "luxon";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { audit } from "./audit";
import { track } from "./analytics";
import { type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { flashSettings } from "./flash";
import { allocateReference } from "./references";
import { DEFAULT_TERMS, DEFAULT_TERMS_VERSION } from "./quotes";
import { formatPence } from "./money";
import { STUDIO_TZ } from "./time";

/**
 * "Three machines": three free pulls in a row. The first decides black and grey or colour,
 * the second the style, the third the subject (spider, angel, dagger and so on). Together
 * they make a simple flash brief the chosen artist draws up and tattoos small at one fixed
 * price. The server picks every reel with crypto.randomInt; the browser only animates what
 * was already chosen. Free to play, nothing won, the only payment is the normal booking deposit.
 */
export const GAME = "trio";
export const TRIO_DEFAULTS = {
  enabled: true,
  pricePence: 4000,
  depositPence: 1000,
  spinsPerDay: 1,
  inks: ["Black and grey", "Colour"],
  styles: ["Traditional", "Fine line", "Blackwork", "Neo-traditional", "Dotwork", "Geometric", "Illustrative", "Sketchy"],
  subjects: ["Spider", "Angel", "Dagger", "Rose", "Swallow", "Anchor", "Snake", "Skull", "Heart", "Moon", "Star", "Butterfly", "Cherries", "Lightning bolt", "Eye", "Key", "Horseshoe", "Bee", "Mushroom", "Sun", "Crown", "Flame", "Cat", "Wave", "Diamond"],
};
export type TrioResult = { ink: string; style: string; subject: string; pricePence: number; depositPence: number };

const list = (v: unknown, fallback: string[]) => (Array.isArray(v) && v.every((x) => typeof x === "string") && v.length > 0 ? (v as string[]).map((x) => x.trim()).filter(Boolean) : fallback);

export async function trioSettings() {
  const rows = await db.studioSetting.findMany({ where: { key: { startsWith: "trio." } } });
  const v = Object.fromEntries(rows.map((r) => [r.key.replace("trio.", ""), r.value]));
  const num = (k: "pricePence" | "depositPence" | "spinsPerDay") => (typeof v[k] === "number" ? (v[k] as number) : TRIO_DEFAULTS[k]);
  return { enabled: typeof v.enabled === "boolean" ? v.enabled : TRIO_DEFAULTS.enabled, pricePence: num("pricePence"), depositPence: Math.min(num("pricePence"), num("depositPence")), spinsPerDay: num("spinsPerDay"), inks: list(v.inks, TRIO_DEFAULTS.inks), styles: list(v.styles, TRIO_DEFAULTS.styles), subjects: list(v.subjects, TRIO_DEFAULTS.subjects) };
}

function todayStart(now = new Date()) {
  return DateTime.fromJSDate(now, { zone: STUDIO_TZ }).startOf("day").toJSDate();
}

export async function pullsToday(visitorId: string, userId: string | null, now = new Date()) {
  return db.play.count({ where: { game: GAME, createdAt: { gte: todayStart(now) }, OR: [{ visitorId }, ...(userId ? [{ userId }] : [])] } });
}

/** Published tattoo artists who take enquiries: the client picks who draws and tattoos the brief. */
export async function trioArtists() {
  return db.artistProfile.findMany({ where: { isPublished: true, acceptsEnquiries: true, kind: { in: ["TATTOO_ARTIST", "JUNIOR_ARTIST"] } }, select: { id: true, slug: true, displayName: true }, orderBy: { displayName: "asc" } });
}

export async function trioState(visitorId: string | null, userId: string | null) {
  const [settings, flash, artists] = await Promise.all([trioSettings(), flashSettings(), trioArtists()]);
  const used = visitorId ? await pullsToday(visitorId, userId) : 0;
  return { settings, artists, pullsLeft: Math.max(0, settings.spinsPerDay - used), maxCm: flash.smallMaxCm, placements: flash.fixedPlacements };
}

/** One go on all three machines. Every reel is chosen here, uniformly, and stored with the prices shown at the time. */
export async function pull(visitorId: string, userId: string | null, now = new Date()) {
  const s = await trioSettings();
  if (!s.enabled) throw new ValidationError("The three machines are switched off at the moment.");
  if ((await pullsToday(visitorId, userId, now)) >= s.spinsPerDay) throw new ValidationError("That is your go for today. Come back tomorrow, or book what you got.");
  const pick = (xs: string[]) => xs[randomInt(xs.length)];
  const result: TrioResult = { ink: pick(s.inks), style: pick(s.styles), subject: pick(s.subjects), pricePence: s.pricePence, depositPence: s.depositPence };
  const play = await db.play.create({ data: { game: GAME, visitorId, userId, result } });
  await track("play_started", { game: GAME, visitorId, userId, playId: play.id });
  await track("result_shown", { game: GAME, visitorId, userId, playId: play.id });
  return { ...play, result };
}

export function resultOf(play: { result: Prisma.JsonValue }): TrioResult | null {
  const r = play.result as Partial<TrioResult> | null;
  if (!r || typeof r.ink !== "string" || typeof r.style !== "string" || typeof r.subject !== "string") return null;
  return { ink: r.ink, style: r.style, subject: r.subject, pricePence: typeof r.pricePence === "number" ? r.pricePence : TRIO_DEFAULTS.pricePence, depositPence: typeof r.depositPence === "number" ? r.depositPence : TRIO_DEFAULTS.depositPence };
}

export const briefOf = (r: TrioResult) => `${r.ink} ${r.style.toLowerCase()} ${r.subject.toLowerCase()}`;

/** A play is only visible to the browser or account that made it. */
export async function trioPlayFor(playId: string, visitorId: string | null, userId: string | null) {
  const play = await db.play.findUnique({ where: { id: playId } });
  if (!play || play.game !== GAME) return null;
  if (play.visitorId !== visitorId && (!userId || play.userId !== userId)) return null;
  const result = resultOf(play);
  if (!result) return null;
  const [flash, artists] = await Promise.all([flashSettings(), trioArtists()]);
  return { play, result, artists, maxCm: flash.smallMaxCm, placements: flash.fixedPlacements };
}

export const bookTrioSchema = z.object({ playId: z.string(), artistId: z.string().min(1, "Choose an artist"), placement: z.string().min(1), declaredOver18: z.boolean() });

/** "Keep it": the brief becomes a fixed-price booking with the chosen artist and the client goes to the slot picker. */
export async function bookFromTrio(p: Principal, visitorId: string | null, input: z.infer<typeof bookTrioSchema>) {
  if (!input.declaredOver18) throw new ValidationError("You must be 18 or over to book a tattoo.");
  const play = await db.play.findUnique({ where: { id: input.playId } });
  if (!play || play.game !== GAME) throw new NotFoundError("Play not found");
  if (play.visitorId !== visitorId && play.userId !== p.userId) throw new ForbiddenError();
  if (play.status === "BOOKED") throw new ValidationError("You have already booked this one. Check My enquiries.");
  const result = resultOf(play);
  if (!result) throw new NotFoundError("Play not found");
  const flash = await flashSettings();
  if (!flash.fixedPlacements.map((x) => x.toLowerCase()).includes(input.placement.toLowerCase())) throw new ValidationError("Fixed prices only apply to the listed flat areas. For anywhere else, contact the desk for a custom price.");
  const artist = (await trioArtists()).find((a) => a.id === input.artistId);
  if (!artist) throw new ValidationError("Choose an artist from the list.");
  const studio = await db.studio.findFirstOrThrow();
  const client = await db.user.findUniqueOrThrow({ where: { id: p.userId } });
  const brief = briefOf(result);
  const request = await db.$transaction(async (tx) => {
    const reference = await allocateReference(tx, "ENQ");
    const r = await tx.bookingRequest.create({ data: {
      reference, studioId: studio.id, clientId: p.userId, artistId: artist.id, category: "FLASH", source: "WEBSITE", status: "AWAITING_DEPOSIT",
      placement: input.placement, style: result.style, sizeCm: flash.smallMaxCm, colour: /colour/i.test(result.ink) ? "colour" : "black_and_grey",
      description: `Three machines: ${brief}. ${artist.displayName} draws a simple flash design from this brief and tattoos it small, up to ${flash.smallMaxCm} cm. Fixed price ${formatPence(result.pricePence)}, deposit ${formatPence(result.depositPence)}. Play ${play.id}.`,
      declaredOver18: true, designTier: "artist", expiresAt: new Date(Date.now() + 60 * 86400000),
      conversation: { create: {} },
      statusEvents: { create: [{ toStatus: "NEW", actorLabel: "Client", note: "Booked from the three machines" }, { fromStatus: "NEW", toStatus: "AWAITING_DEPOSIT", actorLabel: "System: fixed-price flash", note: "Fixed price accepted" }] },
      quotes: { create: { artistId: artist.id, issuedById: p.userId, version: 1, status: "ACCEPTED", scope: `Three machines brief: ${brief} (small, up to ${flash.smallMaxCm} cm) on ${input.placement}`, priceBasis: "fixed", amountPence: result.pricePence, depositPence: result.depositPence, estimatedMinutes: flash.minutesSmall, termsVersion: DEFAULT_TERMS_VERSION, termsText: DEFAULT_TERMS, sentAt: new Date(), respondedAt: new Date() } },
    } });
    await tx.play.update({ where: { id: play.id }, data: { status: "BOOKED", requestId: r.id, userId: p.userId } });
    await audit({ actorId: p.userId, actorLabel: `Client: ${client.name ?? client.email}`, action: "trio.booked", entityType: "Play", entityId: play.id, after: { requestId: r.id, brief, artistId: artist.id, totalPence: result.pricePence } }, tx);
    return r;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  return request;
}

export async function trioOwnerSummary() {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [settings, playsWeek, bookedWeek, plays] = await Promise.all([
    trioSettings(),
    db.play.count({ where: { game: GAME, createdAt: { gte: weekAgo } } }),
    db.play.count({ where: { game: GAME, status: "BOOKED", createdAt: { gte: weekAgo } } }),
    db.play.findMany({ where: { game: GAME }, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return { settings, playsWeek, bookedWeek, plays: plays.map((pl) => ({ ...pl, brief: (() => { const r = resultOf(pl); return r ? briefOf(r) : "—"; })() })) };
}
