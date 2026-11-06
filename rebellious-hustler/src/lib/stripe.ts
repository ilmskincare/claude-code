import Stripe from "stripe";
import { db } from "./db";
import { env, stripeConfigured } from "./env";
import { getSettings } from "./settings";
import { shippingOptions, subtotalPence } from "./cart-math";
import { loadCartView } from "./cart";
import { nextOrderNumber, sendOrderConfirmation, type ShippingAddress } from "./orders";
import { MAX_LINE_QTY } from "./site";

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!stripeConfigured()) throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY.");
  if (!client) client = new Stripe(env().STRIPE_SECRET_KEY!);
  return client;
}

export type CheckoutLine = { variantId: string; quantity: number };

/**
 * Line items are built from database prices only; nothing from the browser is trusted.
 * Stock is re-checked here so a stale cart cannot buy what is gone.
 */
export async function buildLineItemsFromCart(cartId: string) {
  const cart = await loadCartView(cartId);
  if (cart.lines.length === 0) throw new CheckoutError("Your cart is empty.");
  if (cart.problems.length) throw new CheckoutError(cart.problems.join(" "));
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.lines.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency: "gbp",
      unit_amount: l.unitPence,
      product_data: {
        name: l.name,
        description: `${l.size}, ${l.colour}`,
        ...(l.image?.url.startsWith("http") ? { images: [l.image.url] } : {}),
        metadata: { variantId: l.variantId, sku: l.sku },
      },
    },
  }));
  const items: CheckoutLine[] = cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
  return { lineItems, items, subtotalPence: cart.subtotalPence };
}

export class CheckoutError extends Error {}

/** Compact "variantId:qty|variantId:qty" split across metadata keys (Stripe caps each value at 500 characters). */
export function encodeItemsMetadata(items: CheckoutLine[]): Record<string, string> {
  const joined = items.map((i) => `${i.variantId}:${i.quantity}`).join("|");
  const out: Record<string, string> = {};
  for (let i = 0, n = 0; i < joined.length; i += 480, n++) out[`items${n}`] = joined.slice(i, i + 480);
  return out;
}

export function decodeItemsMetadata(metadata: Record<string, string> | null | undefined): CheckoutLine[] {
  if (!metadata) return [];
  const parts: string[] = [];
  for (let n = 0; metadata[`items${n}`] !== undefined; n++) parts.push(metadata[`items${n}`]);
  const joined = parts.join("");
  if (!joined) return [];
  return joined
    .split("|")
    .map((pair) => {
      const [variantId, qty] = pair.split(":");
      return { variantId, quantity: Number(qty) };
    })
    .filter((l) => l.variantId && Number.isInteger(l.quantity) && l.quantity > 0 && l.quantity <= MAX_LINE_QTY);
}

/** Create a hosted Checkout session for the cart. Returns the URL to send the customer to. */
export async function createCheckoutSession(cartId: string, shipping: "standard" | "express"): Promise<string> {
  const { lineItems, items, subtotalPence: subtotal } = await buildLineItemsFromCart(cartId);
  const settings = await getSettings();
  const options = shippingOptions(subtotal, settings);
  const chosen = options.find((o) => o.id === shipping) ?? options[0];
  const base = env().APP_BASE_URL;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    currency: "gbp",
    line_items: lineItems,
    shipping_address_collection: { allowed_countries: ["GB"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: chosen.name,
          fixed_amount: { amount: chosen.pence, currency: "gbp" },
          delivery_estimate: chosen.id === "express" ? { minimum: { unit: "business_day", value: 1 }, maximum: { unit: "business_day", value: 2 } } : { minimum: { unit: "business_day", value: 2 }, maximum: { unit: "business_day", value: 4 } },
        },
      },
    ],
    phone_number_collection: { enabled: false },
    metadata: { cartId, shippingMethod: chosen.name, ...encodeItemsMetadata(items) },
    payment_intent_data: { metadata: { cartId } },
    success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/checkout/cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

/** The parts of a checkout.session.completed payload the order needs. Tests pass a plain object. */
export type CompletedSession = {
  id: string;
  payment_status?: string | null;
  payment_intent?: string | { id: string } | null;
  amount_subtotal?: number | null;
  amount_total?: number | null;
  shipping_cost?: { amount_total: number } | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  customer_email?: string | null;
  collected_information?: { shipping_details?: { name?: string | null; address?: ShippingAddress | null } | null } | null;
  shipping_details?: { name?: string | null; address?: ShippingAddress | null } | null;
  metadata?: Record<string, string> | null;
};

export type WebhookOutcome =
  | { outcome: "duplicate" }
  | { outcome: "ignored"; reason: string }
  | { outcome: "created"; orderId: string; orderNumber: string; oversold: string[] };

/** Handle a verified event. Duplicate deliveries are detected by event id and by Stripe session id. */
export async function handleStripeEvent(event: { id: string; type: string; data: { object: unknown } }): Promise<WebhookOutcome> {
  if (event.type !== "checkout.session.completed") {
    await db.webhookEvent.createMany({ data: [{ provider: "stripe", eventId: event.id, type: event.type }], skipDuplicates: true });
    return { outcome: "ignored", reason: `Unhandled event type ${event.type}` };
  }
  return processCheckoutCompleted(event.id, event.data.object as CompletedSession);
}

/**
 * Create the order for a paid Checkout session: allocate the order number, snapshot the items,
 * decrement stock atomically, clear the cart and email the customer. Safe to call twice.
 */
export async function processCheckoutCompleted(eventId: string, session: CompletedSession): Promise<WebhookOutcome> {
  if (session.payment_status && session.payment_status !== "paid") return { outcome: "ignored", reason: `Payment status ${session.payment_status}` };
  const existing = await db.order.findUnique({ where: { stripeSessionId: session.id }, select: { id: true } });
  if (existing) {
    await db.webhookEvent.createMany({ data: [{ provider: "stripe", eventId, type: "checkout.session.completed" }], skipDuplicates: true });
    return { outcome: "duplicate" };
  }
  const items = decodeItemsMetadata(session.metadata);
  if (items.length === 0) return { outcome: "ignored", reason: "No items in session metadata" };
  const email = (session.customer_details?.email ?? session.customer_email ?? "").trim().toLowerCase();
  if (!email) return { outcome: "ignored", reason: "No customer email on session" };

  const variants = await db.productVariant.findMany({ where: { id: { in: items.map((i) => i.variantId) } }, include: { product: true } });
  const byId = new Map(variants.map((v) => [v.id, v]));
  const orderItems = items
    .filter((i) => byId.has(i.variantId))
    .map((i) => {
      const v = byId.get(i.variantId)!;
      return { variantId: v.id, productName: v.product.name, size: v.size, colour: v.colour, sku: v.sku, unitPence: v.product.pricePence, quantity: i.quantity };
    });
  if (orderItems.length === 0) return { outcome: "ignored", reason: "No known variants in session" };

  const shippingDetails = session.collected_information?.shipping_details ?? session.shipping_details ?? null;
  const subtotal = session.amount_subtotal ?? subtotalPence(orderItems);
  const shippingPence = session.shipping_cost?.amount_total ?? 0;
  const total = session.amount_total ?? subtotal + shippingPence;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const customerName = shippingDetails?.name ?? session.customer_details?.name ?? "";
  const address = { ...(shippingDetails?.address ?? {}), name: customerName };

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.webhookEvent.create({ data: { provider: "stripe", eventId, type: "checkout.session.completed" } });
      const number = await nextOrderNumber(tx);
      const order = await tx.order.create({
        data: {
          number,
          status: "PAID",
          email,
          customerName,
          shippingAddress: address,
          shippingMethod: session.metadata?.shippingMethod ?? "UK Standard",
          subtotalPence: subtotal,
          shippingPence,
          totalPence: total,
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          items: { create: orderItems },
        },
        include: { items: true },
      });
      const oversold: string[] = [];
      for (const item of orderItems) {
        const dec = await tx.productVariant.updateMany({ where: { id: item.variantId, stockQty: { gte: item.quantity } }, data: { stockQty: { decrement: item.quantity } } });
        if (dec.count === 0) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQty: 0 } });
          oversold.push(item.sku);
        }
      }
      if (oversold.length) {
        await tx.order.update({ where: { id: order.id }, data: { adminNote: `Stock went below zero for: ${oversold.join(", ")}. Check the shelf before dispatch.` } });
      }
      const cartId = session.metadata?.cartId;
      if (cartId) await tx.cartItem.deleteMany({ where: { cartId } });
      return { order, oversold };
    });

    try {
      await sendOrderConfirmation(result.order);
    } catch (err) {
      console.error("order confirmation email failed", err);
    }
    return { outcome: "created", orderId: result.order.id, orderNumber: result.order.number, oversold: result.oversold };
  } catch (err) {
    if (isUniqueViolation(err)) return { outcome: "duplicate" };
    throw err;
  }
}

function isUniqueViolation(err: unknown) {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";
}
