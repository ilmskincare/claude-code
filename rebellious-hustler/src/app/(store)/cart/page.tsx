import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { removeFromCartAction, updateCartAction } from "../actions";
import { CheckoutButton } from "@/components/CheckoutButton";
import { getCart } from "@/lib/cart";
import { amountToFreeShipping, shippingOptions } from "@/lib/cart-math";
import { stripeConfigured } from "@/lib/env";
import { formatPence } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { MAX_LINE_QTY, SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage() {
  const [cart, settings] = await Promise.all([getCart(), getSettings()]);
  const options = shippingOptions(cart.subtotalPence, settings);
  const toFree = amountToFreeShipping(cart.subtotalPence, settings);
  const handle = settings.instagramHandle || SITE.instagramHandle;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Your cart</h1>

      {cart.lines.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="text-lg font-semibold">Nothing in here yet.</p>
          <Link href="/shop" className="btn btn-primary mt-5">Start shopping</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section aria-label="Items">
            {cart.problems.length > 0 && (
              <div role="alert" className="card mb-4 border-warn p-4 text-sm">
                <p className="font-bold text-warn">Please check your cart</p>
                <ul className="mt-1 list-disc pl-5">{cart.problems.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            )}
            <ul className="divide-y divide-border">
              {cart.lines.map((line) => (
                <li key={line.variantId} className="flex gap-4 py-4" data-testid="cart-line">
                  <Link href={`/shop/${line.slug}`} className="relative h-28 w-[5.5rem] shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {line.image && <Image src={line.image.thumbUrl} alt={line.image.alt} fill sizes="88px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/shop/${line.slug}`} className="font-bold hover:text-gold">{line.name}</Link>
                        <p className="hint">{line.size}, {line.colour}</p>
                      </div>
                      <p className="font-bold">{formatPence(line.unitPence * line.quantity)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <form action={updateCartAction} className="flex items-center gap-2">
                        <input type="hidden" name="variantId" value={line.variantId} />
                        <label htmlFor={`qty-${line.variantId}`} className="text-sm">Qty</label>
                        <select id={`qty-${line.variantId}`} name="quantity" defaultValue={line.quantity} className="select w-20 py-1" style={{ minHeight: "2.4rem" }}>
                          {Array.from({ length: Math.max(line.quantity, Math.min(MAX_LINE_QTY, line.stockQty)) }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <button type="submit" className="btn btn-secondary btn-sm">Update</button>
                      </form>
                      <form action={removeFromCartAction}>
                        <input type="hidden" name="variantId" value={line.variantId} />
                        <button type="submit" className="btn btn-ghost btn-sm">Remove</button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/shop" className="mt-4 inline-block text-sm font-semibold text-gold hover:underline">Continue shopping</Link>
          </section>

          <aside className="card h-fit p-5" aria-label="Order summary">
            <h2 className="text-lg font-extrabold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal ({cart.count} {cart.count === 1 ? "item" : "items"})</dt><dd data-testid="cart-subtotal">{formatPence(cart.subtotalPence)}</dd></div>
              <div className="flex justify-between"><dt>Delivery estimate</dt><dd>{options[0].pence === 0 ? "Free" : `from ${formatPence(options[0].pence)}`}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total</dt><dd>{formatPence(cart.subtotalPence + options[0].pence)}</dd></div>
            </dl>
            {toFree > 0 ? (
              <p className="hint mt-3 text-xs">Spend {formatPence(toFree)} more for free UK delivery.</p>
            ) : (
              <p className="mt-3 text-xs text-ok">You have free UK delivery.</p>
            )}
            <div className="mt-5">
              {stripeConfigured() ? (
                <CheckoutButton options={options} disabled={cart.problems.length > 0} />
              ) : (
                <div className="card-2 p-4 text-sm" role="status">
                  <p className="font-bold">Online checkout is being connected. Message us on Instagram to order.</p>
                  <a href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-3 w-full">Message @{handle}</a>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
