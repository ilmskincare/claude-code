import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import { isProduction } from "./env";
import { sign, unsign } from "./signing";
import { clampQuantity, itemCount, subtotalPence } from "./cart-math";
import { MAX_LINE_QTY } from "./site";

export const CART_COOKIE = "rh_cart";
const CART_DAYS = 30;

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: {
        include: { product: { include: { images: { orderBy: { position: "asc" as const }, take: 1 } } } },
      },
    },
  },
};

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  colour: string;
  sku: string;
  unitPence: number;
  quantity: number;
  stockQty: number;
  live: boolean;
  image: { url: string; thumbUrl: string; alt: string } | null;
};

export type CartView = { id: string | null; lines: CartLine[]; subtotalPence: number; count: number; problems: string[] };

function cookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: isProduction(), path: "/", maxAge: CART_DAYS * 86400 };
}

/** The cart id from the signed cookie, or null. */
export async function readCartId(): Promise<string | null> {
  const store = await cookies();
  return unsign(store.get(CART_COOKIE)?.value);
}

/** Find the cart named by the cookie or create one and set the cookie (server actions only). */
export async function getOrCreateCartId(): Promise<string> {
  const existing = await readCartId();
  if (existing) {
    const found = await db.cart.findUnique({ where: { id: existing }, select: { id: true } });
    if (found) return found.id;
  }
  const created = await db.cart.create({ data: {} });
  const store = await cookies();
  store.set(CART_COOKIE, sign(created.id), cookieOptions());
  return created.id;
}

/** Build the cart as the page shows it, from live database prices and stock. */
export async function loadCartView(cartId: string | null): Promise<CartView> {
  if (!cartId) return { id: null, lines: [], subtotalPence: 0, count: 0, problems: [] };
  const cart = await db.cart.findUnique({ where: { id: cartId }, include: cartInclude });
  if (!cart) return { id: null, lines: [], subtotalPence: 0, count: 0, problems: [] };
  const problems: string[] = [];
  const lines: CartLine[] = cart.items.map((item) => {
    const v = item.variant;
    const p = v.product;
    const img = p.images[0];
    const live = p.status === "LIVE";
    if (!live) problems.push(`${p.name} is no longer available.`);
    else if (v.stockQty < item.quantity) problems.push(`${p.name} (${v.size}, ${v.colour}): only ${v.stockQty} left.`);
    return {
      variantId: v.id,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      size: v.size,
      colour: v.colour,
      sku: v.sku,
      unitPence: p.pricePence,
      quantity: item.quantity,
      stockQty: v.stockQty,
      live,
      image: img ? { url: img.url, thumbUrl: img.thumbUrl, alt: img.alt || p.name } : null,
    };
  });
  return { id: cart.id, lines, subtotalPence: subtotalPence(lines), count: itemCount(lines), problems };
}

export const getCart = cache(async (): Promise<CartView> => loadCartView(await readCartId()));

export type CartChange = { ok: true; quantity: number; message?: string } | { ok: false; message: string };

/** Add to a line (or create it), capped at the stock on hand and the per-line maximum. */
export async function addToCart(cartId: string, variantId: string, quantity: number): Promise<CartChange> {
  const variant = await db.productVariant.findUnique({ where: { id: variantId }, include: { product: { select: { status: true, name: true } } } });
  if (!variant || variant.product.status !== "LIVE") return { ok: false, message: "That item is not available." };
  if (variant.stockQty < 1) return { ok: false, message: "That size and colour is sold out." };
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const wanted = (existing?.quantity ?? 0) + quantity;
  const allowed = clampQuantity(wanted, variant.stockQty);
  if (allowed === 0) return { ok: false, message: "That size and colour is sold out." };
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity: allowed },
    update: { quantity: allowed },
  });
  const capped = allowed < wanted;
  return {
    ok: true,
    quantity: allowed,
    message: capped ? (allowed >= MAX_LINE_QTY ? `Maximum ${MAX_LINE_QTY} per item.` : `Only ${variant.stockQty} in stock, so we added what we could.`) : undefined,
  };
}

/** Set a line to an exact quantity; 0 removes it. */
export async function setCartQuantity(cartId: string, variantId: string, quantity: number): Promise<CartChange> {
  if (quantity <= 0) {
    await db.cartItem.deleteMany({ where: { cartId, variantId } });
    return { ok: true, quantity: 0 };
  }
  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return { ok: false, message: "That item is not available." };
  const allowed = clampQuantity(quantity, variant.stockQty);
  if (allowed === 0) {
    await db.cartItem.deleteMany({ where: { cartId, variantId } });
    return { ok: false, message: "That size and colour is sold out, so it was removed." };
  }
  await db.cartItem.updateMany({ where: { cartId, variantId }, data: { quantity: allowed } });
  return { ok: true, quantity: allowed, message: allowed < quantity ? `Only ${allowed} available.` : undefined };
}

export async function clearCart(cartId: string) {
  await db.cartItem.deleteMany({ where: { cartId } });
}
