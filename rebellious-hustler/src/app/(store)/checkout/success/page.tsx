import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const order = session_id ? await db.order.findUnique({ where: { stripeSessionId: session_id }, select: { number: true, email: true } }) : null;
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="eyebrow">Payment received</p>
      <h1 className="script mt-2 text-5xl">Thank you</h1>
      <p className="mt-4 text-lg">Your order is in. We will email you a confirmation and again when it is on its way.</p>
      {order ? (
        <p className="mt-4">
          Your order number is <strong>{order.number}</strong>.{" "}
          <Link href={`/orders/${order.number}?email=${encodeURIComponent(order.email)}`} className="font-semibold text-accent underline">See your order</Link>
        </p>
      ) : (
        <p className="hint mt-4">Your order number will be in the confirmation email within a few minutes.</p>
      )}
      <Link href="/shop" className="btn btn-secondary mt-8">Back to the shop</Link>
    </div>
  );
}
