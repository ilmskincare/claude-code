import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { addToCart, loadCartView, setCartQuantity } from "@/lib/cart";
import { buildLineItemsFromCart, CheckoutError } from "@/lib/stripe";
import { cleanupTestData, createTestProduct } from "./helpers";

describe("cart and Stripe line items (database)", () => {
  let product: Awaited<ReturnType<typeof createTestProduct>>;
  let cartId: string;

  beforeAll(async () => {
    await cleanupTestData();
    product = await createTestProduct({ pricePence: 2499, variants: [
      { size: "M", colour: "Black", stockQty: 3 },
      { size: "L", colour: "Black", stockQty: 0 },
      { size: "S", colour: "Blue", stockQty: 50 },
    ] });
    cartId = (await db.cart.create({ data: {} })).id;
  });

  afterAll(async () => {
    await db.cart.delete({ where: { id: cartId } }).catch(() => undefined);
    await cleanupTestData();
    await db.$disconnect();
  });

  const variant = (size: string, colour: string) => product.variants.find((v) => v.size === size && v.colour === colour)!;

  it("creates a product with variants", async () => {
    const found = await db.product.findUnique({ where: { slug: product.slug }, include: { variants: true } });
    expect(found?.variants).toHaveLength(3);
    expect(found?.status).toBe("LIVE");
  });

  it("adds to the cart, caps at stock and refuses sold out variants", async () => {
    const ok = await addToCart(cartId, variant("M", "Black").id, 2);
    expect(ok).toEqual({ ok: true, quantity: 2, message: undefined });

    const capped = await addToCart(cartId, variant("M", "Black").id, 5);
    expect(capped.ok).toBe(true);
    if (capped.ok) {
      expect(capped.quantity).toBe(3);
      expect(capped.message).toMatch(/Only 3 in stock/);
    }

    const soldOut = await addToCart(cartId, variant("L", "Black").id, 1);
    expect(soldOut.ok).toBe(false);

    const maxed = await addToCart(cartId, variant("S", "Blue").id, 25);
    expect(maxed.ok && maxed.quantity).toBe(10);
  });

  it("builds the cart view from database prices", async () => {
    const view = await loadCartView(cartId);
    expect(view.lines).toHaveLength(2);
    expect(view.count).toBe(13);
    expect(view.subtotalPence).toBe(13 * 2499);
    expect(view.problems).toEqual([]);
  });

  it("updates and removes lines", async () => {
    await setCartQuantity(cartId, variant("S", "Blue").id, 1);
    await setCartQuantity(cartId, variant("M", "Black").id, 0);
    const view = await loadCartView(cartId);
    expect(view.lines.map((l) => [l.size, l.quantity])).toEqual([["S", 1]]);
  });

  it("builds Stripe line items from the database, never from the client", async () => {
    await db.product.update({ where: { id: product.id }, data: { pricePence: 2999 } });
    const { lineItems, items, subtotalPence } = await buildLineItemsFromCart(cartId);
    expect(lineItems).toHaveLength(1);
    expect(lineItems[0].quantity).toBe(1);
    expect(lineItems[0].price_data?.currency).toBe("gbp");
    expect(lineItems[0].price_data?.unit_amount).toBe(2999);
    expect(lineItems[0].price_data?.product_data?.name).toBe(product.name);
    expect(items).toEqual([{ variantId: variant("S", "Blue").id, quantity: 1 }]);
    expect(subtotalPence).toBe(2999);
  });

  it("re-checks stock at checkout and refuses when it has gone", async () => {
    await db.productVariant.update({ where: { id: variant("S", "Blue").id }, data: { stockQty: 0 } });
    await expect(buildLineItemsFromCart(cartId)).rejects.toBeInstanceOf(CheckoutError);
    await db.productVariant.update({ where: { id: variant("S", "Blue").id }, data: { stockQty: 50 } });
  });

  it("refuses an empty cart", async () => {
    const empty = await db.cart.create({ data: {} });
    await expect(buildLineItemsFromCart(empty.id)).rejects.toThrow(/empty/);
    await db.cart.delete({ where: { id: empty.id } });
  });
});
