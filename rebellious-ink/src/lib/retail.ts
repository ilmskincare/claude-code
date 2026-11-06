import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { postJournal } from "./finance/ledger";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";

export const retailSaleSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().int().min(1).max(100),
  unitPricePounds: z.coerce.number().min(0),
  method: z.enum(["CASH", "CARD_STRIPE", "BANK_TRANSFER"]),
  clientName: z.string().trim().max(120).optional().or(z.literal("")),
  clientEmail: z.string().trim().email().optional().or(z.literal("")),
  appointmentReference: z.string().trim().max(20).optional().or(z.literal("")),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

/**
 * A practitioner sells jewellery or aftercare retail to a client from studio stock.
 * Deducts earliest-expiry lots first, records the sale, and posts
 * Dr CASH/BANK/STRIPE_CLEARING, Cr STOCK_SALES. Who keeps the margin is settled
 * by the practitioner's arrangement (Phase 3 statements), not here.
 */
export async function recordRetailSale(p: Principal, practitionerId: string, input: z.infer<typeof retailSaleSchema>) {
  if (p.artistProfileId !== practitionerId && !can(p, "stock.manage")) throw new ForbiddenError();
  return db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new NotFoundError("Product not found");
    const lots = await tx.inventoryLot.findMany({ where: { productId: product.id, quantity: { gt: 0 } }, orderBy: [{ expiresAt: "asc" }, { receivedAt: "asc" }] });
    const available = lots.reduce((s, l) => s + l.quantity, 0);
    if (available < input.quantity) throw new ValidationError(`Only ${available} ${product.unit} of ${product.name} in stock.`);
    const unit = Math.round(input.unitPricePounds * 100);
    const total = unit * input.quantity;
    let appointmentId: string | null = null;
    let clientUserId: string | null = null;
    if (input.appointmentReference) {
      const a = await tx.appointment.findUnique({ where: { reference: input.appointmentReference.toUpperCase() } });
      if (!a) throw new ValidationError("No appointment with that reference.");
      appointmentId = a.id; clientUserId = a.clientId;
    } else if (input.clientEmail) {
      clientUserId = (await tx.user.findUnique({ where: { email: input.clientEmail.toLowerCase() } }))?.id ?? null;
    }
    const cash = input.method === "CASH" ? "CASH" : input.method === "BANK_TRANSFER" ? "BANK" : "STRIPE_CLEARING";
    const ledgerGroupId = total > 0 ? await postJournal(tx, { description: `Retail: ${input.quantity} × ${product.name}`, occurredAt: new Date(), lines: [{ account: cash, debitPence: total }, { account: "STOCK_SALES", creditPence: total }], artistId: practitionerId, appointmentId, createdById: p.userId }) : null;
    let remaining = input.quantity;
    for (const lot of lots) {
      if (remaining <= 0) break;
      const take = Math.min(lot.quantity, remaining);
      await tx.inventoryLot.update({ where: { id: lot.id }, data: { quantity: { decrement: take } } });
      await tx.stockMovement.create({ data: { lotId: lot.id, delta: -take, reason: "sold_to_client", artistId: practitionerId, unitPricePence: unit, ledgerGroupId, actorId: p.userId, note: input.note || null } });
      remaining -= take;
    }
    const sale = await tx.retailSale.create({ data: { practitionerId, clientUserId, clientName: input.clientName || null, appointmentId, productId: product.id, quantity: input.quantity, unitPricePence: unit, totalPence: total, method: input.method, note: input.note || null, ledgerGroupId } });
    await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "retail.sale_recorded", entityType: "RetailSale", entityId: sale.id, after: { productId: product.id, quantity: input.quantity, totalPence: total, method: input.method } }, tx);
    return sale;
  });
}

export async function retailSales(practitionerId?: string, take = 100) {
  return db.retailSale.findMany({ where: practitionerId ? { practitionerId } : {}, include: { product: true, practitioner: true }, orderBy: { createdAt: "desc" }, take });
}
