import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPence } from "@/lib/money";
import { formatAddressLines, type ShippingAddress } from "@/lib/orders";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const STATUS_TEXT: Record<string, string> = {
  PAID: "Paid. We are getting it ready.",
  FULFILLED: "Dispatched.",
  CANCELLED: "Cancelled.",
  REFUNDED: "Refunded.",
};

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ email?: string }> }) {
  const { number } = await params;
  const { email } = await searchParams;
  const order = await db.order.findUnique({ where: { number: number.toUpperCase() }, include: { items: true } });
  const matches = order && email && order.email.toLowerCase() === email.trim().toLowerCase();

  if (!matches) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-2xl font-extrabold">Find your order</h1>
        <p className="hint mt-2">Enter the email address you used at checkout to see order {number.toUpperCase()}.</p>
        {email && <p role="alert" className="error mt-3">We could not find that order with that email address.</p>}
        <form method="get" className="mt-5 space-y-4">
          <div>
            <label htmlFor="email" className="field">Email address</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" defaultValue={email ?? ""} />
          </div>
          <button type="submit" className="btn btn-primary">Show my order</button>
        </form>
      </div>
    );
  }

  const address = formatAddressLines(order.shippingAddress as ShippingAddress);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="eyebrow">Order {order.number}</p>
      <h1 className="mt-1 text-3xl font-extrabold">{STATUS_TEXT[order.status] ?? order.status}</h1>
      <p className="hint mt-1">Placed {order.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
      {order.trackingRef && <p className="mt-3 text-sm">Tracking reference: <strong>{order.trackingRef}</strong></p>}

      <ul className="mt-6 divide-y divide-border">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-3 py-3 text-sm">
            <span>{i.quantity} x {i.productName}<span className="hint block">{i.size}, {i.colour}</span></span>
            <span className="font-semibold">{formatPence(i.unitPence * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPence(order.subtotalPence)}</dd></div>
        <div className="flex justify-between"><dt>Delivery ({order.shippingMethod})</dt><dd>{formatPence(order.shippingPence)}</dd></div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total paid</dt><dd>{formatPence(order.totalPence)}</dd></div>
      </dl>

      <div className="card mt-6 p-4 text-sm">
        <p className="font-bold">Delivering to</p>
        <address className="mt-1 not-italic">{address.map((l) => <span key={l} className="block">{l}</span>)}</address>
      </div>

      <p className="hint mt-6 text-sm">Problem with your order? <Link href="/contact" className="text-gold underline">Get in touch</Link> and quote {order.number}. See our <Link href="/returns" className="text-gold underline">returns policy</Link> for how to send something back.</p>
    </div>
  );
}
