import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Checkout cancelled", robots: { index: false } };

export default function CheckoutCancelledPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="eyebrow">No payment taken</p>
      <h1 className="mt-2 text-3xl font-extrabold">Checkout cancelled</h1>
      <p className="mt-4 text-lg">Your cart is still here when you are ready.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/cart" className="btn btn-primary">Back to cart</Link>
        <Link href="/shop" className="btn btn-secondary">Keep shopping</Link>
      </div>
    </div>
  );
}
