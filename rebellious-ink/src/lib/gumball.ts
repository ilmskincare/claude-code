import { randomInt } from "node:crypto";
import { z } from "zod";
import { DateTime } from "luxon";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { audit } from "./audit";
import { track } from "./analytics";
import { sendEmail } from "./email";
import { env } from "./env";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { bookDesign, bookDesignSchema, releaseLapsedDesignHolds, flashSettings } from "./flash";
import { STUDIO_TZ } from "./time";
import { formatPence } from "./money";

/**
 * "Get what you get": a free spin that hands the visitor one random design from the
 * gumball collection at a fixed price. Randomness happens here, never in the browser;
 * the browser only animates the result the server already chose. Nothing is won or
 * lost and no money changes hands to play: the only payment is the normal booking deposit.
 */
export const GUMBALL_DEFAULTS = { enabled: true, pricePence: 3000, depositPence: 1000, spinsPerDay: 1, minStock: 5, holdMinutes: 15 };
export const GAME = "gumball";

export async function gumballSettings() {
  const rows = await db.studioSetting.findMany({ where: { key: { startsWith: "gumball." } } });
  const v = Object.fromEntries(rows.map((r) => [r.key.replace("gumball.", ""), r.value]));
  const num = (k: keyof typeof GUMBALL_DEFAULTS) => (typeof v[k] === "number" ? (v[k] as number) : (GUMBALL_DEFAULTS[k] as number));
  return { enabled: typeof v.enabled === "boolean" ? v.enabled : GUMBALL_DEFAULTS.enabled, pricePence: num("pricePence"), depositPence: num("depositPence"), spinsPerDay: num("spinsPerDay"), minStock: num("minStock"), holdMinutes: num("holdMinutes") };
}

const availableWhere = { collection: "GUMBALL" as const, status: "AVAILABLE" as const, artist: { isPublished: true } };

/** Real stock count, never faked: designs that could come out of the machine right now. */
export async function stock() {
  await releaseLapsedDesignHolds();
  return db.design.count({ where: availableWhere });
}

function todayStart(now = new Date()) {
  return DateTime.fromJSDate(now, { zone: STUDIO_TZ }).startOf("day").toJSDate();
}

export async function spinsToday(visitorId: string, userId: string | null, now = new Date()) {
  return db.play.count({ where: { game: GAME, createdAt: { gte: todayStart(now) }, OR: [{ visitorId }, ...(userId ? [{ userId }] : [])] } });
}

/** Machine state for the landing page. */
export async function machineState(visitorId: string | null, userId: string | null) {
  const [settings, available, flash] = await Promise.all([gumballSettings(), stock(), flashSettings()]);
  const used = visitorId ? await spinsToday(visitorId, userId) : 0;
  const alerts = await db.playAlert.count({ where: { game: GAME, notifiedAt: null } });
  return { settings, available, restocking: available < settings.minStock, spinsLeft: Math.max(0, settings.spinsPerDay - used), maxCm: flash.smallMaxCm, alerts };
}

/**
 * One spin. Picks uniformly at random (crypto.randomInt) among AVAILABLE gumball designs,
 * inside a transaction that row-locks the chosen design so a one-off can never be handed
 * to two people. Repeatable designs stay available for the next spin.
 */
export async function spin(visitorId: string, userId: string | null, now = new Date()) {
  const settings = await gumballSettings();
  if (!settings.enabled) throw new ValidationError("The machine is switched off at the moment.");
  if ((await spinsToday(visitorId, userId, now)) >= settings.spinsPerDay) throw new ValidationError(`That is your spin for today. Come back tomorrow, or book what you got.`);
  const play = await db.$transaction(async (tx) => {
    await releaseLapsedDesignHolds(tx, now);
    const ids = await tx.design.findMany({ where: availableWhere, select: { id: true, repeatable: true }, orderBy: { id: "asc" } });
    if (ids.length < settings.minStock) throw new ValidationError("Machine being restocked. Back soon.");
    const chosen = ids[randomInt(ids.length)];
    const rows = await tx.$queryRaw<{ id: string; status: string }[]>`SELECT id, status FROM "Design" WHERE id = ${chosen.id} FOR UPDATE`;
    if (rows[0]?.status !== "AVAILABLE") throw new ValidationError("Someone just took that capsule. Spin again.");
    const created = await tx.play.create({ data: { game: GAME, visitorId, userId, designId: chosen.id, result: { pricePence: settings.pricePence, depositPence: settings.depositPence } } });
    if (!chosen.repeatable) await tx.design.update({ where: { id: chosen.id }, data: { status: "HELD", heldRequestId: created.id, heldUntil: new Date(now.getTime() + settings.holdMinutes * 60000) } });
    return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  await track("play_started", { game: GAME, visitorId, userId, designId: play.designId, playId: play.id });
  await track("result_shown", { game: GAME, visitorId, userId, designId: play.designId, playId: play.id });
  return play;
}

/** A play is only visible to the browser or account that made it. */
export async function playFor(playId: string, visitorId: string | null, userId: string | null) {
  const play = await db.play.findUnique({ where: { id: playId }, include: { design: { include: { artist: { select: { id: true, slug: true, displayName: true } } } } } });
  if (!play || play.game !== GAME) return null;
  if (play.visitorId !== visitorId && (!userId || play.userId !== userId)) return null;
  const settings = await gumballSettings();
  const flash = await flashSettings();
  return { play, settings, maxCm: flash.smallMaxCm };
}

export const bookPlaySchema = bookDesignSchema.pick({ placement: true, declaredOver18: true }).extend({ playId: z.string() });

/** "Keep it": turns the play into a fixed-price booking at the gumball price and sends the client to the slot picker. */
export async function bookFromPlay(p: Principal, visitorId: string | null, input: z.infer<typeof bookPlaySchema>) {
  const play = await db.play.findUnique({ where: { id: input.playId }, include: { design: true } });
  if (!play || play.game !== GAME || !play.design) throw new NotFoundError("Play not found");
  if (play.visitorId !== visitorId && play.userId !== p.userId) throw new ForbiddenError();
  if (play.status === "BOOKED") throw new ValidationError("You have already booked this one. Check My enquiries.");
  const settings = await gumballSettings();
  const flash = await flashSettings();
  const request = await bookDesign(p, { designId: play.design.id, size: "small", tier: "artist", apprenticeId: "", placement: input.placement, declaredOver18: input.declaredOver18 }, { totalPence: settings.pricePence, depositPence: Math.min(settings.pricePence, settings.depositPence), estimatedMinutes: flash.minutesSmall, label: "Gumball machine", playId: play.id });
  await db.play.update({ where: { id: play.id }, data: { status: "BOOKED", requestId: request.id, userId: p.userId } });
  await audit({ actorId: p.userId, actorLabel: `Client: ${p.name ?? p.email}`, action: "gumball.booked", entityType: "Play", entityId: play.id, after: { requestId: request.id, designId: play.design.id, totalPence: settings.pricePence } });
  return request;
}

export async function addRestockAlert(email: string, visitorId: string | null) {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) throw new ValidationError("Enter a valid email address.");
  await db.playAlert.upsert({ where: { game_email: { game: GAME, email: clean } }, create: { game: GAME, email: clean }, update: {} });
  await track("restock_alert_signup", { game: GAME, visitorId });
}

/** Owner: email everyone waiting once the machine is full again. */
export async function sendRestockAlerts(p: Principal) {
  if (!can(p, "studio.manage")) throw new ForbiddenError();
  const settings = await gumballSettings();
  if ((await stock()) < settings.minStock) throw new ValidationError("Restock the machine first.");
  const waiting = await db.playAlert.findMany({ where: { game: GAME, notifiedAt: null } });
  for (const w of waiting) {
    await sendEmail({ to: w.email, templateKey: "gumball.restocked", subject: "The gumball machine is full again", text: `New designs are in the Rebellious Ink gumball machine. Spin at ${env().APP_BASE_URL}/play/gumball. ${formatPence(settings.pricePence)} total for a small tattoo; what you get is what you get.`, html: `<p>New designs are in the Rebellious Ink gumball machine.</p><p><a href="${env().APP_BASE_URL}/play/gumball">Spin the machine</a>. ${formatPence(settings.pricePence)} total for a small tattoo; what you get is what you get.</p>` }).catch((e) => console.error("alert failed", e));
    await db.playAlert.update({ where: { id: w.id }, data: { notifiedAt: new Date() } });
  }
  return waiting.length;
}

export async function ownerDashboard() {
  await releaseLapsedDesignHolds();
  const [settings, designs, plays, alerts] = await Promise.all([
    gumballSettings(),
    db.design.findMany({ where: { collection: "GUMBALL", status: { not: "RETIRED" } }, include: { artist: { select: { displayName: true } } }, orderBy: [{ status: "asc" }, { sortOrder: "asc" }] }),
    db.play.findMany({ where: { game: GAME }, include: { design: { select: { title: true } }, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.playAlert.count({ where: { game: GAME, notifiedAt: null } }),
  ]);
  const since = new Date(Date.now() - 30 * 86400000);
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [playsWeek, bookedWeek] = await Promise.all([db.play.count({ where: { game: GAME, createdAt: { gte: weekAgo } } }), db.play.count({ where: { game: GAME, status: "BOOKED", createdAt: { gte: weekAgo } } })]);
  return { settings, designs, plays, alerts, since, playsWeek, bookedWeek, available: designs.filter((d) => d.status === "AVAILABLE").length };
}
