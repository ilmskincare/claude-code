import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { postJournal } from "./finance/ledger";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";

export const CATEGORIES = ["ink", "needle", "cartridge", "glove", "barrier", "cleaning", "dressing", "transfer_paper", "sterilisation", "jewellery", "aftercare_retail", "other"] as const;

export const productSchema = z.object({
  sku: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  category: z.enum(CATEGORIES),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  colour: z.string().trim().max(60).optional().or(z.literal("")),
  unit: z.string().trim().max(20).default("each"),
  reorderLevel: z.coerce.number().int().min(0).default(0),
  costPounds: z.coerce.number().min(0).optional(),
  artistPricePounds: z.coerce.number().min(0).optional(),
  supplierName: z.string().trim().max(120).optional().or(z.literal("")),
  material: z.string().trim().max(60).optional().or(z.literal("")),
  gauge: z.string().trim().max(20).optional().or(z.literal("")),
  length: z.string().trim().max(20).optional().or(z.literal("")),
});

export const receiveSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().int().min(1).max(100000),
  lotNumber: z.string().trim().max(60).optional().or(z.literal("")),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  reference: z.string().trim().max(80).optional().or(z.literal("")),
});

export const adjustSchema = z.object({
  lotId: z.string(),
  delta: z.coerce.number().int().min(-100000).max(100000),
  reason: z.enum(["adjustment", "shrinkage", "count", "used_in_session"]),
  note: z.string().trim().min(3).max(200),
});

export const issueSchema = z.object({
  productId: z.string(),
  artistId: z.string(),
  quantity: z.coerce.number().int().min(1).max(10000),
  mode: z.enum(["issued", "sold"]),
  unitPricePounds: z.coerce.number().min(0).optional(),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

const pence = (pounds?: number) => (pounds === undefined || Number.isNaN(pounds) ? null : Math.round(pounds * 100));

export async function upsertProduct(p: Principal, input: z.infer<typeof productSchema>, id?: string) {
  if (!can(p, "stock.manage")) throw new ForbiddenError();
  let supplierId: string | null = null;
  if (input.supplierName) {
    const sup = await db.supplier.findFirst({ where: { name: { equals: input.supplierName, mode: "insensitive" } } }) ?? await db.supplier.create({ data: { name: input.supplierName } });
    supplierId = sup.id;
  }
  const data = { sku: input.sku, name: input.name, category: input.category, brand: input.brand || null, colour: input.colour || null, unit: input.unit || "each", reorderLevel: input.reorderLevel, costPence: pence(input.costPounds), retailPence: pence(input.artistPricePounds), supplierId, material: input.material || null, gauge: input.gauge || null, length: input.length || null };
  const product = id ? await db.product.update({ where: { id }, data }) : await db.product.create({ data });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: id ? "stock.product_updated" : "stock.product_created", entityType: "Product", entityId: product.id, after: data });
  return product;
}

/** Stock on hand per product, with low-stock and expiring flags. */
export async function stockOverview(now = new Date()) {
  const products = await db.product.findMany({ where: { isActive: true }, include: { supplier: true, lots: { select: { id: true, lotNumber: true, expiresAt: true, quantity: true } } }, orderBy: [{ category: "asc" }, { name: "asc" }] });
  const soon = new Date(now.getTime() + 60 * 86400000);
  return products.map((pr) => {
    const onHand = pr.lots.reduce((s, l) => s + l.quantity, 0);
    const expiring = pr.lots.filter((l) => l.quantity > 0 && l.expiresAt && l.expiresAt <= soon);
    const expired = pr.lots.filter((l) => l.quantity > 0 && l.expiresAt && l.expiresAt < now);
    return { ...pr, onHand, isLow: onHand <= pr.reorderLevel, expiringLots: expiring.length, expiredLots: expired.length };
  });
}

export async function receiveStock(p: Principal, input: z.infer<typeof receiveSchema>) {
  if (!can(p, "stock.manage")) throw new ForbiddenError();
  return db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new NotFoundError("Product not found");
    const lot = await tx.inventoryLot.create({ data: { productId: product.id, lotNumber: input.lotNumber || null, expiresAt: input.expiresAt ? new Date(input.expiresAt + "T00:00:00Z") : null, quantity: input.quantity } });
    await tx.stockMovement.create({ data: { lotId: lot.id, delta: input.quantity, reason: "received", reference: input.reference || null, actorId: p.userId } });
    await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "stock.received", entityType: "InventoryLot", entityId: lot.id, after: { productId: product.id, quantity: input.quantity, lotNumber: lot.lotNumber } }, tx);
    return lot;
  });
}

export async function adjustStock(p: Principal, input: z.infer<typeof adjustSchema>) {
  if (!can(p, "stock.manage")) throw new ForbiddenError();
  return db.$transaction(async (tx) => {
    const lot = await tx.inventoryLot.findUnique({ where: { id: input.lotId } });
    if (!lot) throw new NotFoundError("Lot not found");
    if (lot.quantity + input.delta < 0) throw new ValidationError(`Only ${lot.quantity} left in this lot.`);
    await tx.inventoryLot.update({ where: { id: lot.id }, data: { quantity: { increment: input.delta } } });
    const m = await tx.stockMovement.create({ data: { lotId: lot.id, delta: input.delta, reason: input.reason, note: input.note, actorId: p.userId } });
    await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "stock.adjusted", entityType: "InventoryLot", entityId: lot.id, before: { quantity: lot.quantity }, after: { quantity: lot.quantity + input.delta, reason: input.reason }, reason: input.note }, tx);
    return m;
  });
}

/** What the artist's current arrangement says about consumables. */
export async function artistSupplyTerms(artistId: string, now = new Date()) {
  const artist = await db.artistProfile.findUnique({ where: { id: artistId }, include: { user: { include: { memberships: { include: { compensationModels: { where: { effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] }, orderBy: { effectiveFrom: "desc" }, take: 1 } } } } } } });
  if (!artist) throw new NotFoundError("Artist not found");
  const model = artist.user.memberships[0]?.compensationModels[0] ?? null;
  return { artist, model, suppliesIncluded: model?.suppliesIncluded ?? false, note: model?.suppliesNote ?? null };
}

/**
 * Move stock to a practitioner. "issued" = included in their arrangement (no charge).
 * "sold" = charged at the given unit price; posts Dr ARTIST_RECEIVABLE / Cr STOCK_SALES.
 * Deducts oldest lots first (FEFO by expiry, then FIFO). Each unit leaves exactly once.
 */
export async function issueToArtist(p: Principal, input: z.infer<typeof issueSchema>) {
  if (!can(p, "stock.manage")) throw new ForbiddenError();
  const terms = await artistSupplyTerms(input.artistId);
  if (input.mode === "issued" && !terms.suppliesIncluded && !can(p, "studio.manage")) {
    throw new ValidationError(`${terms.artist.displayName}'s arrangement does not include supplies. Sell instead, or the owner can override.`);
  }
  return db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new NotFoundError("Product not found");
    const lots = await tx.inventoryLot.findMany({ where: { productId: product.id, quantity: { gt: 0 } }, orderBy: [{ expiresAt: "asc" }, { receivedAt: "asc" }] });
    const available = lots.reduce((s, l) => s + l.quantity, 0);
    if (available < input.quantity) throw new ValidationError(`Only ${available} ${product.unit} of ${product.name} in stock.`);
    const unitPrice = input.mode === "sold" ? (pence(input.unitPricePounds) ?? product.retailPence ?? product.costPence ?? 0) : null;
    let remaining = input.quantity;
    let ledgerGroupId: string | null = null;
    if (input.mode === "sold") {
      const total = unitPrice! * input.quantity;
      ledgerGroupId = await postJournal(tx, { description: `${input.quantity} × ${product.name} sold to ${terms.artist.displayName}`, occurredAt: new Date(), lines: [{ account: "ARTIST_RECEIVABLE", debitPence: total }, { account: "STOCK_SALES", creditPence: total }], artistId: terms.artist.id, createdById: p.userId });
    }
    const movements = [];
    for (const lot of lots) {
      if (remaining <= 0) break;
      const take = Math.min(lot.quantity, remaining);
      await tx.inventoryLot.update({ where: { id: lot.id }, data: { quantity: { decrement: take } } });
      movements.push(await tx.stockMovement.create({ data: { lotId: lot.id, delta: -take, reason: input.mode === "sold" ? "sold_to_artist" : "issued_to_artist", artistId: terms.artist.id, unitPricePence: unitPrice, ledgerGroupId, note: input.note || null, actorId: p.userId } }));
      remaining -= take;
    }
    await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: input.mode === "sold" ? "stock.sold_to_artist" : "stock.issued_to_artist", entityType: "Product", entityId: product.id, after: { artistId: terms.artist.id, quantity: input.quantity, unitPricePence: unitPrice, ledgerGroupId } }, tx);
    return { movements, unitPricePence: unitPrice, ledgerGroupId };
  });
}

/** An artist's own stock history and current balance owed for purchases. */
export async function artistStockStatement(artistId: string) {
  const movements = await db.stockMovement.findMany({ where: { artistId }, include: { lot: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  const receivable = await db.financialLedgerEntry.aggregate({ _sum: { debitPence: true, creditPence: true }, where: { account: "ARTIST_RECEIVABLE", artistId } });
  return { movements, owedPence: (receivable._sum.debitPence ?? 0) - (receivable._sum.creditPence ?? 0) };
}

/** Record an artist settling their stock account (cash/bank), as a reversal-style credit. */
export async function recordArtistStockPayment(p: Principal, artistId: string, amountPence: number, method: "CASH" | "BANK", note: string) {
  if (!can(p, "finance.verify_manual_payment")) throw new ForbiddenError();
  if (amountPence <= 0) throw new ValidationError("Amount must be positive.");
  return db.$transaction(async (tx) => {
    const group = await postJournal(tx, { description: `Stock account payment from artist (${note})`, occurredAt: new Date(), lines: [{ account: method === "CASH" ? "CASH" : "BANK", debitPence: amountPence }, { account: "ARTIST_RECEIVABLE", creditPence: amountPence }], artistId, createdById: p.userId });
    await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "stock.artist_payment_recorded", entityType: "ArtistProfile", entityId: artistId, after: { amountPence, method, group }, reason: note }, tx);
    return group;
  });
}
