import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { can, type Principal, ForbiddenError, NotFoundError } from "./rbac";

const list = z.string().transform((s) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean).slice(0, 40));
const pounds = z.string().transform((s) => (s.trim() === "" ? null : Math.round(Number(s) * 100))).pipe(z.number().int().min(0).nullable());

export const rateCardSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(1500).optional().or(z.literal("")),
  instagramHandle: z.string().trim().max(60).optional().or(z.literal("")),
  styles: list,
  stylesNotOffered: list,
  hourlyRateMin: pounds,
  hourlyRateMax: pounds,
  dayRate: pounds,
  minimumCharge: pounds,
  wontDo: z.string().trim().max(1500).optional().or(z.literal("")),
  placementsDeclined: list,
  piercingsOffered: list,
  piercingsNotOffered: list,
  receptionNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  acceptsEnquiries: z.coerce.boolean().optional(),
});

export const priceItemSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.enum(["piercing", "tattoo", "consultation", "other"]),
  pricePounds: z.coerce.number().min(0),
  priceToPounds: z.coerce.number().min(0).optional(),
  durationMinutes: z.coerce.number().int().min(5).max(600).optional(),
  includesJewellery: z.coerce.boolean().optional(),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

/** Practitioners edit their own card; roster.manage edits anyone's. */
export function assertCanEditProfile(p: Principal, artistId: string) {
  if (can(p, "roster.manage")) return;
  if (p.artistProfileId === artistId) return;
  throw new ForbiddenError();
}

export async function updateRateCard(p: Principal, artistId: string, input: z.infer<typeof rateCardSchema>) {
  assertCanEditProfile(p, artistId);
  const before = await db.artistProfile.findUnique({ where: { id: artistId } });
  if (!before) throw new NotFoundError();
  if (input.hourlyRateMin != null && input.hourlyRateMax != null && input.hourlyRateMax < input.hourlyRateMin) throw new Error("Hourly rate maximum must be at least the minimum.");
  const data = {
    displayName: input.displayName, bio: input.bio || null, instagramHandle: input.instagramHandle?.replace(/^@/, "") || null,
    styles: input.styles, stylesNotOffered: input.stylesNotOffered,
    hourlyRateMinPence: input.hourlyRateMin, hourlyRateMaxPence: input.hourlyRateMax, dayRatePence: input.dayRate, minimumChargePence: input.minimumCharge,
    wontDo: input.wontDo || null, placementsDeclined: input.placementsDeclined,
    piercingsOffered: input.piercingsOffered, piercingsNotOffered: input.piercingsNotOffered,
    receptionNotes: input.receptionNotes || null,
    ...(input.acceptsEnquiries === undefined ? {} : { acceptsEnquiries: input.acceptsEnquiries }),
  };
  const after = await db.artistProfile.update({ where: { id: artistId }, data });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "profile.rate_card_updated", entityType: "ArtistProfile", entityId: artistId, before: { hourlyRateMinPence: before.hourlyRateMinPence, hourlyRateMaxPence: before.hourlyRateMaxPence, dayRatePence: before.dayRatePence, styles: before.styles, wontDo: before.wontDo }, after: { hourlyRateMinPence: after.hourlyRateMinPence, hourlyRateMaxPence: after.hourlyRateMaxPence, dayRatePence: after.dayRatePence, styles: after.styles, wontDo: after.wontDo } });
  return after;
}

export async function addPriceItem(p: Principal, artistId: string, input: z.infer<typeof priceItemSchema>) {
  assertCanEditProfile(p, artistId);
  const count = await db.priceListItem.count({ where: { artistId } });
  const item = await db.priceListItem.create({ data: { artistId, name: input.name, category: input.category, pricePence: Math.round(input.pricePounds * 100), priceToPence: input.priceToPounds != null && !Number.isNaN(input.priceToPounds) ? Math.round(input.priceToPounds * 100) : null, durationMinutes: input.durationMinutes ?? null, includesJewellery: Boolean(input.includesJewellery), notes: input.notes || null, sortOrder: count } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "profile.price_item_added", entityType: "PriceListItem", entityId: item.id, after: item });
  return item;
}

export async function removePriceItem(p: Principal, itemId: string) {
  const item = await db.priceListItem.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError();
  assertCanEditProfile(p, item.artistId);
  await db.priceListItem.update({ where: { id: itemId }, data: { isActive: false } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "profile.price_item_removed", entityType: "PriceListItem", entityId: itemId, before: item });
}

/** Desk quick reference: everything customer service needs to answer a call. */
export async function deskReference() {
  return db.artistProfile.findMany({ include: { priceList: { where: { isActive: true }, orderBy: { sortOrder: "asc" } }, availabilityRules: { where: { validFrom: null }, orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] }, supervisor: true }, orderBy: { displayName: "asc" } });
}
