import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db, type Tx } from "./db";
import { audit } from "./audit";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { assertAllowedUpload, newStorageKey, putObject } from "./storage";
import { allocateReference } from "./references";
import { DEFAULT_TERMS, DEFAULT_TERMS_VERSION } from "./quotes";
import { formatPence } from "./money";

/**
 * Flash catalogue: two fixed sizes per design, an optional supervised-apprentice tier,
 * repeatable or one-off designs, and a straight-to-booking flow. Every price is a studio
 * setting (flash.*) unless a design overrides it. This catalogue is the stock for every
 * novelty game; games are free to play and only ever lead here.
 */
export const FLASH_DEFAULTS = {
  smallPence: 6000, palmPence: 11000, apprenticeSmallPence: 4000, apprenticePalmPence: 7000,
  depositSmallPence: 2000, depositPalmPence: 3000, apprenticeDepositPence: 1500,
  smallMaxCm: 8, palmMaxCm: 12, minutesSmall: 60, minutesPalm: 120, designHoldMinutes: 15,
  palmEnabled: false, // the studio sells one flash size; the second size stays in the data model but is hidden until switched on
  // Flash prices only apply to flat, easy areas. Anywhere else, or a bigger size, is a custom price from the desk.
  quotePlacements: ["hands", "fingers", "neck", "face"],
  fixedPlacements: ["upper arm (outer)", "forearm (outer)", "forearm (inner)", "shoulder (top)", "thigh (outer)", "calf"],
  sizeOptionsCm: [4, 5, 6, 7, 8], // the client picks a size; all the same price; the last one is the maximum
};
export type FlashSettings = typeof FLASH_DEFAULTS;

export async function flashSettings(client: Tx | typeof db = db): Promise<FlashSettings> {
  const rows = await client.studioSetting.findMany({ where: { key: { startsWith: "flash." } } });
  const v = Object.fromEntries(rows.map((r) => [r.key.replace("flash.", ""), r.value]));
  const num = (k: keyof FlashSettings) => (typeof v[k] === "number" ? (v[k] as number) : (FLASH_DEFAULTS[k] as number));
  const list = (k: "quotePlacements" | "fixedPlacements") => (Array.isArray(v[k]) ? (v[k] as string[]).map(String) : FLASH_DEFAULTS[k]);
  const sizes = Array.isArray(v.sizeOptionsCm) && (v.sizeOptionsCm as unknown[]).every((x) => typeof x === "number") ? (v.sizeOptionsCm as number[]) : FLASH_DEFAULTS.sizeOptionsCm;
  const bool = (k: "palmEnabled") => (typeof v[k] === "boolean" ? (v[k] as boolean) : FLASH_DEFAULTS[k]);
  return {
    smallPence: num("smallPence"), palmPence: num("palmPence"), apprenticeSmallPence: num("apprenticeSmallPence"), apprenticePalmPence: num("apprenticePalmPence"),
    depositSmallPence: num("depositSmallPence"), depositPalmPence: num("depositPalmPence"), apprenticeDepositPence: num("apprenticeDepositPence"),
    smallMaxCm: num("smallMaxCm"), palmMaxCm: num("palmMaxCm"), minutesSmall: num("minutesSmall"), minutesPalm: num("minutesPalm"), designHoldMinutes: num("designHoldMinutes"),
    quotePlacements: list("quotePlacements"), fixedPlacements: list("fixedPlacements"), palmEnabled: bool("palmEnabled"), sizeOptionsCm: sizes,
  };
}

export const SIZES = ["small", "palm"] as const;
export type Size = (typeof SIZES)[number];
export const TIERS = ["artist", "apprentice"] as const;
export type Tier = (typeof TIERS)[number];

const pounds = z.string().transform((s) => (s.trim() === "" ? null : Math.round(Number(s) * 100))).pipe(z.number().int().min(0).nullable());

export const designSchema = z.object({
  title: z.string().trim().min(2).max(80),
  theme: z.string().trim().max(40).optional().or(z.literal("")),
  colourMode: z.enum(["BLACK", "COLOUR"]).default("BLACK"),
  collection: z.enum(["CATALOGUE", "GUMBALL", "TAROT", "CLAW", "DROP", "ADVENT", "NEEDLE_TOWN"]).default("CATALOGUE"),
  priceSmall: pounds.optional(),
  pricePalm: pounds.optional(),
  apprenticeAvailable: z.coerce.boolean().optional(),
  apprenticeSmall: pounds.optional(),
  apprenticePalm: pounds.optional(),
  repeatable: z.coerce.boolean().optional(),
  editionSize: z.coerce.number().int().min(1).max(999).optional(),
  funLine: z.string().trim().max(120).optional().or(z.literal("")),
  artistId: z.string().optional().or(z.literal("")),
});
export type DesignInput = z.infer<typeof designSchema>;

export const hotspotSchema = z.object({ title: z.string().trim().min(2).max(80), x: z.coerce.number().min(0).max(100), y: z.coerce.number().min(0).max(100), w: z.coerce.number().min(1).max(100), h: z.coerce.number().min(1).max(100) });

/** Artists manage their own designs; roster.manage manages anyone's. */
export function assertCanManageDesigns(p: Principal, artistId: string) {
  if (can(p, "roster.manage")) return;
  if (p.artistProfileId === artistId) return;
  throw new ForbiddenError();
}

function resolveArtist(p: Principal, input: { artistId?: string | "" }) {
  const artistId = input.artistId || p.artistProfileId;
  if (!artistId) throw new ValidationError("Choose the artist this design belongs to.");
  assertCanManageDesigns(p, artistId);
  return artistId;
}

async function storeImage(file: File, prefix: string) {
  assertAllowedUpload(file.type, file.size);
  if (file.type === "application/pdf") throw new ValidationError("Designs must be images.");
  const key = newStorageKey(prefix, file.name);
  await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type);
  return key;
}

function designData(input: DesignInput) {
  return {
    title: input.title, theme: input.theme || null, colourMode: input.colourMode, collection: input.collection,
    priceSmallPence: input.priceSmall ?? null, pricePalmPence: input.pricePalm ?? null,
    apprenticeAvailable: Boolean(input.apprenticeAvailable), apprenticeSmallPence: input.apprenticeSmall ?? null, apprenticePalmPence: input.apprenticePalm ?? null,
    repeatable: input.repeatable ?? true, editionSize: input.editionSize ?? null, funLine: input.funLine || null,
  };
}

export async function createDesign(p: Principal, input: DesignInput, file: File) {
  const artistId = resolveArtist(p, input);
  const imageKey = await storeImage(file, `flash/${artistId}`);
  const count = await db.design.count({ where: { artistId } });
  const d = await db.design.create({ data: { ...designData(input), artistId, imageKey, sortOrder: count } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "flash.design_created", entityType: "Design", entityId: d.id, after: { title: d.title, artistId, collection: d.collection, repeatable: d.repeatable } });
  return d;
}

export async function updateDesign(p: Principal, id: string, input: DesignInput, file?: File | null) {
  const existing = await db.design.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError();
  assertCanManageDesigns(p, existing.artistId);
  const imageKey = file && file.size > 0 ? await storeImage(file, `flash/${existing.artistId}`) : undefined;
  const d = await db.design.update({ where: { id }, data: { ...designData(input), ...(imageKey ? { imageKey } : {}) } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "flash.design_updated", entityType: "Design", entityId: d.id, before: { priceSmallPence: existing.priceSmallPence, pricePalmPence: existing.pricePalmPence, repeatable: existing.repeatable }, after: { priceSmallPence: d.priceSmallPence, pricePalmPence: d.pricePalmPence, repeatable: d.repeatable } });
  return d;
}

/** Retiring keeps the record (and any bookings) but removes the design from the catalogue and every game. */
export async function retireDesign(p: Principal, id: string) {
  const existing = await db.design.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError();
  assertCanManageDesigns(p, existing.artistId);
  const d = await db.design.update({ where: { id }, data: { status: "RETIRED", retiredAt: new Date() } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "flash.design_retired", entityType: "Design", entityId: id, before: { status: existing.status }, after: { status: "RETIRED" } });
  return d;
}

export async function createSheet(p: Principal, input: { title: string; artistId?: string }, file: File) {
  const artistId = resolveArtist(p, input);
  const imageKey = await storeImage(file, `flash/sheets/${artistId}`);
  const sheet = await db.flashSheet.create({ data: { artistId, title: input.title.trim().slice(0, 80), imageKey } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "flash.sheet_uploaded", entityType: "FlashSheet", entityId: sheet.id, after: { title: sheet.title, artistId } });
  return sheet;
}

/** A design cut from a sheet: it shares the sheet image and is located by its hotspot. */
export async function addDesignFromSheet(p: Principal, sheetId: string, input: z.infer<typeof hotspotSchema> & Partial<DesignInput>) {
  const sheet = await db.flashSheet.findUnique({ where: { id: sheetId } });
  if (!sheet) throw new NotFoundError();
  assertCanManageDesigns(p, sheet.artistId);
  const count = await db.design.count({ where: { artistId: sheet.artistId } });
  const base = designSchema.parse({ title: input.title, theme: input.theme ?? "", colourMode: input.colourMode ?? "BLACK", collection: input.collection ?? "CATALOGUE", apprenticeAvailable: input.apprenticeAvailable, repeatable: input.repeatable ?? true });
  const d = await db.design.create({ data: { ...designData(base), artistId: sheet.artistId, imageKey: sheet.imageKey, sheetId, hotspotX: input.x, hotspotY: input.y, hotspotW: input.w, hotspotH: input.h, sortOrder: count } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "flash.design_created", entityType: "Design", entityId: d.id, after: { title: d.title, sheetId } });
  return d;
}

/** Raise or lower every design override of one size by an amount; designs on defaults follow the default instead. */
export async function bulkAdjustPrices(p: Principal, size: Size, deltaPence: number) {
  if (!can(p, "roster.manage")) throw new ForbiddenError();
  const rows = size === "small"
    ? await db.design.findMany({ where: { priceSmallPence: { not: null }, status: { not: "RETIRED" } }, select: { id: true, priceSmallPence: true, pricePalmPence: true } })
    : await db.design.findMany({ where: { pricePalmPence: { not: null }, status: { not: "RETIRED" } }, select: { id: true, priceSmallPence: true, pricePalmPence: true } });
  for (const r of rows) {
    const current = (size === "small" ? r.priceSmallPence : r.pricePalmPence) ?? 0;
    await db.design.update({ where: { id: r.id }, data: size === "small" ? { priceSmallPence: Math.max(0, current + deltaPence) } : { pricePalmPence: Math.max(0, current + deltaPence) } });
  }
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "flash.bulk_price_adjust", entityType: "Design", entityId: "*", after: { size, deltaPence, affected: rows.length } });
  return rows.length;
}

// ─── Pricing ────────────────────────────────────────────────────────────────

export type PricedDesign = { id: string; priceSmallPence: number | null; pricePalmPence: number | null; apprenticeAvailable: boolean; apprenticeSmallPence: number | null; apprenticePalmPence: number | null };

/** Effective prices for a design: overrides win, otherwise the studio defaults. */
export function effectivePrices(d: PricedDesign, s: FlashSettings) {
  return {
    small: d.priceSmallPence ?? s.smallPence, palm: d.pricePalmPence ?? s.palmPence,
    apprenticeSmall: d.apprenticeAvailable ? d.apprenticeSmallPence ?? s.apprenticeSmallPence : null,
    apprenticePalm: d.apprenticeAvailable ? d.apprenticePalmPence ?? s.apprenticePalmPence : null,
  };
}

/** Total, deposit and diary time for one choice. Null when that tier is not offered. */
export function priceFor(d: PricedDesign, size: Size, tier: Tier, s: FlashSettings) {
  if (size === "palm" && !s.palmEnabled) return null;
  const e = effectivePrices(d, s);
  const total = tier === "apprentice" ? (size === "small" ? e.apprenticeSmall : e.apprenticePalm) : size === "small" ? e.small : e.palm;
  if (total == null) return null;
  const deposit = Math.min(total, tier === "apprentice" ? s.apprenticeDepositPence : size === "small" ? s.depositSmallPence : s.depositPalmPence);
  return { totalPence: total, depositPence: deposit, estimatedMinutes: size === "small" ? s.minutesSmall : s.minutesPalm, maxCm: size === "small" ? s.smallMaxCm : s.palmMaxCm };
}

export function placementNeedsQuote(placement: string, s: FlashSettings) {
  const p = placement.trim().toLowerCase();
  return s.quotePlacements.some((q) => p.includes(q.toLowerCase()));
}

// ─── Holds (one-off designs) ────────────────────────────────────────────────

/** Lazily return lapsed one-off holds to the pool. Called before any read that lists availability. */
export async function releaseLapsedDesignHolds(client: Tx | typeof db = db, now = new Date()) {
  const r = await client.design.updateMany({ where: { status: "HELD", heldUntil: { lt: now } }, data: { status: "AVAILABLE", heldUntil: null, heldRequestId: null } });
  return r.count;
}

/** Row-locked claim of a one-off design for a booking request. Repeatable designs are never held. */
export async function holdDesignForRequest(tx: Tx, designId: string, requestId: string, minutes: number, now = new Date(), transferFrom?: string) {
  const rows = await tx.$queryRaw<{ id: string; status: string; repeatable: boolean; heldRequestId: string | null; heldUntil: Date | null }[]>`SELECT id, status, repeatable, "heldRequestId", "heldUntil" FROM "Design" WHERE id = ${designId} FOR UPDATE`;
  const d = rows[0];
  if (!d) throw new NotFoundError("Design not found");
  if (d.status === "RETIRED") throw new ValidationError("This design is no longer available.");
  if (d.repeatable) return d;
  const lapsed = d.status === "HELD" && d.heldUntil && d.heldUntil < now;
  const mine = d.status === "HELD" && (d.heldRequestId === requestId || d.heldRequestId === transferFrom);
  if (d.status === "BOOKED") throw new ValidationError("Sorry, this one-off design has just been booked by someone else.");
  if (d.status === "HELD" && !mine && !lapsed) throw new ValidationError("Someone else is booking this one-off design right now. Try again in a few minutes.");
  await tx.design.update({ where: { id: designId }, data: { status: "HELD", heldRequestId: requestId, heldUntil: new Date(now.getTime() + minutes * 60000) } });
  return d;
}

/** Called when the deposit lands: a one-off design is now taken for good. */
export async function markDesignBooked(tx: Tx, requestId: string) {
  const r = await tx.bookingRequest.findUnique({ where: { id: requestId }, select: { designId: true } });
  if (!r?.designId) return;
  const d = await tx.design.findUnique({ where: { id: r.designId } });
  if (!d || d.repeatable) return;
  await tx.design.update({ where: { id: d.id }, data: { status: "BOOKED", bookedRequestId: requestId, heldRequestId: null, heldUntil: null } });
}

// ─── Booking ────────────────────────────────────────────────────────────────

export const bookDesignSchema = z.object({
  designId: z.string(),
  size: z.enum(SIZES).default("small"),
  tier: z.enum(TIERS).default("artist"),
  apprenticeId: z.string().optional().or(z.literal("")),
  placement: z.string().trim().min(2).max(60),
  sizeCm: z.coerce.number().int().min(1).max(30).optional(),
  declaredOver18: z.coerce.boolean(),
});
export type PricingOverride = { totalPence: number; depositPence: number; estimatedMinutes: number; label: string; playId: string };

/**
 * "Book this": creates an enquiry that is already quoted and accepted at the fixed price,
 * so the client goes straight to choosing a slot and paying the deposit. One-off designs
 * are held for the client while they do so.
 */
export async function bookDesign(p: Principal, input: z.infer<typeof bookDesignSchema>, override?: PricingOverride) {
  if (!input.declaredOver18) throw new ValidationError("You must be 18 or over to book a tattoo.");
  const s = await flashSettings();
  if (!s.fixedPlacements.map((x) => x.toLowerCase()).includes(input.placement.toLowerCase())) throw new ValidationError("Flash prices only apply to the listed flat areas. For anywhere else, contact the desk for a custom price.");
  if (input.sizeCm != null && !s.sizeOptionsCm.includes(input.sizeCm)) throw new ValidationError("Choose a size from the list. For a bigger piece, contact the desk for a custom price.");
  const design = await db.design.findUnique({ where: { id: input.designId }, include: { artist: true } });
  if (!design || design.status === "RETIRED") throw new NotFoundError("Design not found");
  if (design.collection !== "CATALOGUE" && !override) throw new ValidationError("This design is only available through its game.");
  const basePrice = override ? { totalPence: override.totalPence, depositPence: override.depositPence, estimatedMinutes: override.estimatedMinutes, maxCm: s.smallMaxCm } : priceFor(design, input.size, input.tier, s);
  if (!basePrice) throw new ValidationError("That option is not offered for this design.");
  const price = { ...basePrice, maxCm: input.sizeCm ?? basePrice.maxCm };
  let artistId = design.artistId;
  if (input.tier === "apprentice") {
    const apprentices = design.apprenticeAvailable ? await apprenticesForDesignArtist(design.artistId) : [];
    const chosen = apprentices.find((a) => a.id === input.apprenticeId) ?? (apprentices.length === 1 ? apprentices[0] : undefined);
    if (!chosen) throw new ValidationError("Choose which supervised apprentice you would like.");
    artistId = chosen.id;
  }
  const studio = await db.studio.findFirstOrThrow();
  const client = await db.user.findUniqueOrThrow({ where: { id: p.userId } });
  const request = await db.$transaction(async (tx) => {
    await releaseLapsedDesignHolds(tx);
    const reference = await allocateReference(tx, "ENQ");
    const r = await tx.bookingRequest.create({ data: {
      reference, studioId: studio.id, clientId: p.userId, artistId, category: "FLASH", source: "WEBSITE", status: "AWAITING_DEPOSIT",
      placement: input.placement, style: design.theme ?? "flash", sizeCm: price.maxCm, colour: design.colourMode === "COLOUR" ? "colour" : "black_and_grey",
      description: override ? `${override.label}: "${design.title}" by ${design.artist.displayName}, up to ${price.maxCm} cm. Fixed price ${formatPence(price.totalPence)}, deposit ${formatPence(price.depositPence)}. Play ${override.playId}.` : `Flash design "${design.title}" by ${design.artist.displayName}, ${input.size} (up to ${price.maxCm} cm), ${input.tier === "apprentice" ? "apprentice (supervised)" : "artist"} tier. Fixed price ${formatPence(price.totalPence)}, deposit ${formatPence(price.depositPence)}.`,
      declaredOver18: true, designId: design.id, designSize: input.size, designTier: input.tier, expiresAt: new Date(Date.now() + 60 * 86400000),
      conversation: { create: {} },
      statusEvents: { create: [{ toStatus: "NEW", actorLabel: "Client", note: override ? `Booked from the ${override.label.toLowerCase()}` : "Booked from the flash catalogue" }, { fromStatus: "NEW", toStatus: "AWAITING_DEPOSIT", actorLabel: "System: fixed-price flash", note: "Fixed price accepted" }] },
      quotes: { create: { artistId, issuedById: p.userId, version: 1, status: "ACCEPTED", scope: `${design.title} (${override ? override.label : input.size}, up to ${price.maxCm} cm) on ${input.placement}`, priceBasis: "fixed", amountPence: price.totalPence, depositPence: price.depositPence, estimatedMinutes: price.estimatedMinutes, termsVersion: DEFAULT_TERMS_VERSION, termsText: DEFAULT_TERMS, sentAt: new Date(), respondedAt: new Date() } },
    } });
    await holdDesignForRequest(tx, design.id, r.id, s.designHoldMinutes, new Date(), override?.playId);
    await audit({ actorId: p.userId, actorLabel: `Client: ${client.name ?? client.email}`, action: "flash.booked", entityType: "BookingRequest", entityId: r.id, after: { designId: design.id, size: input.size, tier: input.tier, totalPence: price.totalPence } }, tx);
    return r;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  return request;
}

// ─── Catalogue reads ────────────────────────────────────────────────────────

export type CatalogueFilter = { theme?: string; artist?: string; size?: Size; minPence?: number; maxPence?: number; apprentice?: boolean; oneOff?: boolean; colour?: "BLACK" | "COLOUR"; collection?: "CATALOGUE" | "GUMBALL" | "TAROT" | "CLAW" | "DROP" | "ADVENT" | "NEEDLE_TOWN" };

export async function catalogue(filter: CatalogueFilter = {}) {
  await releaseLapsedDesignHolds();
  const s = await flashSettings();
  const rows = await db.design.findMany({
    where: { status: { not: "RETIRED" }, collection: filter.collection ?? "CATALOGUE", ...(filter.artist ? { artist: { slug: filter.artist } } : {}), ...(filter.theme ? { theme: { equals: filter.theme, mode: "insensitive" } } : {}), ...(filter.apprentice ? { apprenticeAvailable: true } : {}), ...(filter.oneOff ? { repeatable: false } : {}), ...(filter.colour ? { colourMode: filter.colour } : {}), artist: { isPublished: true, ...(filter.artist ? { slug: filter.artist } : {}) } },
    include: { artist: { select: { id: true, slug: true, displayName: true, supervisees: { where: { kind: "APPRENTICE", isPublished: true }, select: { id: true, displayName: true } } } }, sheet: { select: { id: true, title: true } } },
    orderBy: [{ artist: { displayName: "asc" } }, { sortOrder: "asc" }],
  });
  const items = rows.map((d) => ({ ...d, prices: effectivePrices(d, s), isBooked: d.status === "BOOKED", isHeld: d.status === "HELD" }));
  const bySize = (i: (typeof items)[number]) => (filter.size === "palm" ? i.prices.palm : i.prices.small);
  const filtered = items.filter((i) => (filter.minPence == null || bySize(i) >= filter.minPence) && (filter.maxPence == null || bySize(i) <= filter.maxPence));
  const themes = [...new Set(rows.map((r) => r.theme).filter((t): t is string => Boolean(t)))].sort();
  return { items: filtered, themes, settings: s };
}

/**
 * Apprentices who may take a supervised slot on a design: those the design's artist supervises, or, where that
 * artist supervises nobody (the house flash profile), every published apprentice with a published supervisor.
 * Apprentices never take general enquiries, so acceptsEnquiries is not required here; the design's own
 * apprenticeAvailable switch is the consent, and the supervisor's hours still cap the slots.
 */
export async function apprenticesForDesignArtist(artistId: string) {
  const own = await db.artistProfile.findMany({ where: { supervisorId: artistId, kind: "APPRENTICE", isPublished: true }, include: { supervisor: { select: { displayName: true } } }, orderBy: { displayName: "asc" } });
  if (own.length) return own;
  return db.artistProfile.findMany({ where: { kind: "APPRENTICE", isPublished: true, supervisor: { isPublished: true } }, include: { supervisor: { select: { displayName: true } } }, orderBy: { displayName: "asc" } });
}

export async function designById(id: string) {
  await releaseLapsedDesignHolds();
  const s = await flashSettings();
  const found = await db.design.findUnique({ where: { id }, include: { artist: true, sheet: true } });
  if (!found || found.status === "RETIRED" || found.collection !== "CATALOGUE" || !found.artist.isPublished) return null;
  const supervisees = found.apprenticeAvailable ? await apprenticesForDesignArtist(found.artistId) : [];
  const d = { ...found, artist: { ...found.artist, supervisees } };
  return { design: d, prices: effectivePrices(d, s), settings: s };
}

export async function sheetsForCatalogue(artistSlug?: string) {
  const sheets = await db.flashSheet.findMany({ where: { artist: { isPublished: true, ...(artistSlug ? { slug: artistSlug } : {}) } }, include: { artist: { select: { slug: true, displayName: true } }, designs: { where: { status: { not: "RETIRED" } }, orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "desc" } });
  return sheets.filter((sh) => sh.designs.length > 0);                                 // a sheet whose designs are all retired is off the site
}

export async function designsForManagement(artistId?: string) {
  await releaseLapsedDesignHolds();
  const s = await flashSettings();
  const rows = await db.design.findMany({ where: artistId ? { artistId } : {}, include: { artist: { select: { displayName: true, slug: true } }, sheet: { select: { title: true } } }, orderBy: [{ status: "asc" }, { artist: { displayName: "asc" } }, { sortOrder: "asc" }] });
  return { rows: rows.map((d) => ({ ...d, prices: effectivePrices(d, s) })), settings: s };
}
