import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { nextOrderNumber } from "@/lib/orders";
import { encodeItemsMetadata, handleStripeEvent, processCheckoutCompleted, type CompletedSession } from "@/lib/stripe";
import { cleanupTestData, createTestProduct } from "./helpers";

function fakeSession(cartId: string, items: { variantId: string; quantity: number }[], overrides: Partial<CompletedSession> = {}): CompletedSession {
  return {
    id: `cs_test_rh_${randomUUID().slice(0, 12)}`,
    payment_status: "paid",
    payment_intent: "pi_test_rh_123",
    amount_subtotal: 2 * 2499,
    amount_total: 2 * 2499 + 395,
    shipping_cost: { amount_total: 395 },
    customer_details: { email: "Buyer@Example.com", name: "Sam Buyer" },
    collected_information: { shipping_details: { name: "Sam Buyer", address: { line1: "4 Fox & Goose Shopping Centre", city: "Birmingham", postal_code: "B8 2EP", country: "GB" } } },
    metadata: { cartId, shippingMethod: "UK Standard", ...encodeItemsMetadata(items) },
    ...overrides,
  };
}

describe("checkout.session.completed (database)", () => {
  let product: Awaited<ReturnType<typeof createTestProduct>>;
  let cartId: string;

  beforeAll(async () => {
    await cleanupTestData();
    product = await createTestProduct({ variants: [
      { size: "M", colour: "Black", stockQty: 5 },
      { size: "L", colour: "Black", stockQty: 1 },
    ] });
    const cart = await db.cart.create({ data: {} });
    cartId = cart.id;
    await db.cartItem.create({ data: { cartId, variantId: product.variants[0].id, quantity: 2 } });
  });

  afterAll(async () => {
    await db.cart.delete({ where: { id: cartId } }).catch(() => undefined);
    await cleanupTestData();
    await db.$disconnect();
  });

  it("creates a paid order with items, decrements stock and empties the cart", async () => {
    const m = product.variants.find((v) => v.size === "M")!;
    const session = fakeSession(cartId, [{ variantId: m.id, quantity: 2 }]);
    const eventId = `evt_test_rh_${randomUUID().slice(0, 12)}`;
    const result = await processCheckoutCompleted(eventId, session);
    expect(result.outcome).toBe("created");
    if (result.outcome !== "created") return;
    expect(result.orderNumber).toMatch(/^RH-\d{4}-\d{6}$/);
    expect(result.oversold).toEqual([]);

    const order = await db.order.findUniqueOrThrow({ where: { stripeSessionId: session.id }, include: { items: true } });
    expect(order.status).toBe("PAID");
    expect(order.email).toBe("buyer@example.com");
    expect(order.customerName).toBe("Sam Buyer");
    expect(order.subtotalPence).toBe(4998);
    expect(order.shippingPence).toBe(395);
    expect(order.totalPence).toBe(5393);
    expect(order.shippingMethod).toBe("UK Standard");
    expect(order.stripePaymentIntentId).toBe("pi_test_rh_123");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({ variantId: m.id, productName: product.name, size: "M", colour: "Black", unitPence: 2499, quantity: 2 });
    expect((order.shippingAddress as { postal_code: string }).postal_code).toBe("B8 2EP");

    const after = await db.productVariant.findUniqueOrThrow({ where: { id: m.id } });
    expect(after.stockQty).toBe(3);
    expect(await db.cartItem.count({ where: { cartId } })).toBe(0);
    expect(await db.webhookEvent.findUnique({ where: { eventId } })).not.toBeNull();
  });

  it("is idempotent: the same event id and the same session id are ignored", async () => {
    const m = product.variants.find((v) => v.size === "M")!;
    const session = fakeSession(cartId, [{ variantId: m.id, quantity: 1 }]);
    const eventId = `evt_test_rh_${randomUUID().slice(0, 12)}`;
    const first = await processCheckoutCompleted(eventId, session);
    expect(first.outcome).toBe("created");
    const stockAfterFirst = (await db.productVariant.findUniqueOrThrow({ where: { id: m.id } })).stockQty;

    const sameEvent = await processCheckoutCompleted(eventId, session);
    expect(sameEvent.outcome).toBe("duplicate");
    const sameSession = await processCheckoutCompleted(`evt_test_rh_${randomUUID().slice(0, 12)}`, session);
    expect(sameSession.outcome).toBe("duplicate");

    expect(await db.order.count({ where: { stripeSessionId: session.id } })).toBe(1);
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: m.id } })).stockQty).toBe(stockAfterFirst);
  });

  it("never lets stock go negative and flags the order when oversold", async () => {
    const l = product.variants.find((v) => v.size === "L")!;
    const session = fakeSession(cartId, [{ variantId: l.id, quantity: 3 }], { amount_subtotal: 3 * 2499, amount_total: 3 * 2499 + 395 });
    const result = await processCheckoutCompleted(`evt_test_rh_${randomUUID().slice(0, 12)}`, session);
    expect(result.outcome).toBe("created");
    if (result.outcome !== "created") return;
    expect(result.oversold).toEqual([l.sku]);
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: l.id } })).stockQty).toBe(0);
    const order = await db.order.findUniqueOrThrow({ where: { id: result.orderId } });
    expect(order.adminNote).toMatch(/below zero/);
  });

  it("ignores unpaid sessions and other event types", async () => {
    const m = product.variants.find((v) => v.size === "M")!;
    const unpaid = await processCheckoutCompleted(`evt_test_rh_${randomUUID().slice(0, 12)}`, fakeSession(cartId, [{ variantId: m.id, quantity: 1 }], { payment_status: "unpaid" }));
    expect(unpaid.outcome).toBe("ignored");
    const other = await handleStripeEvent({ id: `evt_test_rh_${randomUUID().slice(0, 12)}`, type: "payment_intent.created", data: { object: {} } });
    expect(other.outcome).toBe("ignored");
  });

  it("allocates order numbers sequentially within a year", async () => {
    const year = 2099;
    await db.orderCounter.deleteMany({ where: { year } });
    const at = new Date(Date.UTC(year, 5, 1));
    const a = await nextOrderNumber(db, at);
    const b = await nextOrderNumber(db, at);
    expect(a).toBe("RH-2099-000001");
    expect(b).toBe("RH-2099-000002");
    await db.orderCounter.deleteMany({ where: { year } });
  });
});
