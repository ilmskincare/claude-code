import { db, type Tx } from "./db";
import { emailShell, escapeHtml, sendEmail } from "./email";
import { env } from "./env";
import { formatPence } from "./money";

/** RH-YYYY-000001 */
export function formatOrderNumber(year: number, sequence: number): string {
  return `RH-${year}-${String(sequence).padStart(6, "0")}`;
}

/** Next sequential number for the year, allocated atomically through an upsert with increment. */
export async function nextOrderNumber(tx: Tx | typeof db, now = new Date()): Promise<string> {
  const year = now.getUTCFullYear();
  const counter = await tx.orderCounter.upsert({
    where: { year },
    create: { year, lastSequence: 1 },
    update: { lastSequence: { increment: 1 } },
  });
  return formatOrderNumber(year, counter.lastSequence);
}

export type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
};

export function formatAddressLines(a: ShippingAddress | null | undefined): string[] {
  if (!a) return [];
  return [a.name, a.line1, a.line2, a.city, a.postal_code, a.country === "GB" ? "United Kingdom" : a.country].filter((s): s is string => Boolean(s && s.trim()));
}

export type OrderForEmail = {
  number: string;
  email: string;
  customerName: string;
  shippingAddress: unknown;
  shippingMethod: string;
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  trackingRef?: string | null;
  items: { productName: string; size: string; colour: string; quantity: number; unitPence: number }[];
};

function orderLink(order: { number: string; email: string }) {
  return `${env().APP_BASE_URL}/orders/${order.number}?email=${encodeURIComponent(order.email)}`;
}

function itemsText(order: OrderForEmail) {
  return order.items.map((i) => `${i.quantity} x ${i.productName} (${i.size}, ${i.colour}) ${formatPence(i.unitPence * i.quantity)}`).join("\n");
}

function itemsHtml(order: OrderForEmail) {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#f3efe9;">${i.quantity} x ${escapeHtml(i.productName)}<br><span style="color:#8f8a86;font-size:13px;">${escapeHtml(i.size)}, ${escapeHtml(i.colour)}</span></td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;text-align:right;color:#f3efe9;">${formatPence(i.unitPence * i.quantity)}</td></tr>`,
    )
    .join("")}
<tr><td style="padding:8px 0;color:#8f8a86;">Delivery (${escapeHtml(order.shippingMethod)})</td><td style="padding:8px 0;text-align:right;color:#f3efe9;">${formatPence(order.shippingPence)}</td></tr>
<tr><td style="padding:8px 0;font-weight:bold;color:#f3efe9;">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#d4a53a;">${formatPence(order.totalPence)}</td></tr></table>`;
}

export async function sendOrderConfirmation(order: OrderForEmail) {
  const address = formatAddressLines(order.shippingAddress as ShippingAddress);
  const link = orderLink(order);
  const text = `Thanks for your order, ${order.customerName || "hustler"}.

Order ${order.number}

${itemsText(order)}
Delivery (${order.shippingMethod}): ${formatPence(order.shippingPence)}
Total: ${formatPence(order.totalPence)}

Delivering to:
${address.join("\n")}

See your order: ${link}

We will email again when it is on its way. Reply to this email or message us on Instagram if anything is wrong.

Rebellious Hustler, Birmingham`;
  const html = emailShell(
    `Thanks for your order, ${order.customerName || "hustler"}`,
    `<p style="color:#8f8a86;margin:0 0 8px;">Order <strong style="color:#f3efe9;">${escapeHtml(order.number)}</strong></p>
${itemsHtml(order)}
<p style="color:#8f8a86;margin:16px 0 4px;">Delivering to</p><p style="margin:0;color:#f3efe9;">${address.map(escapeHtml).join("<br>")}</p>
<p style="margin:24px 0;"><a href="${link}" style="background:#d61f2c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;">See your order</a></p>
<p style="color:#8f8a86;">We will email again when it is on its way. Reply to this email or message us on Instagram if anything is wrong.</p>`,
  );
  return sendEmail({ to: order.email, subject: `Order ${order.number} confirmed`, text, html });
}

export async function sendDispatchEmail(order: OrderForEmail) {
  const link = orderLink(order);
  const tracking = order.trackingRef ? `Tracking reference: ${order.trackingRef}` : "No tracking reference for this delivery.";
  const text = `Your order ${order.number} is on its way.

${itemsText(order)}

${tracking}

See your order: ${link}

Rebellious Hustler, Birmingham`;
  const html = emailShell(
    "Your order is on its way",
    `<p style="color:#8f8a86;margin:0 0 8px;">Order <strong style="color:#f3efe9;">${escapeHtml(order.number)}</strong> has been dispatched.</p>
${itemsHtml(order)}
<p style="color:#f3efe9;">${escapeHtml(tracking)}</p>
<p style="margin:24px 0;"><a href="${link}" style="background:#d61f2c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;">See your order</a></p>`,
  );
  return sendEmail({ to: order.email, subject: `Order ${order.number} dispatched`, text, html });
}
