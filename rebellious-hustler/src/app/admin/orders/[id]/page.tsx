import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FulfilForm, NoteForm } from "@/components/admin/OrderForms";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatPence } from "@/lib/money";
import { formatAddressLines, type ShippingAddress } from "@/lib/orders";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();
  const address = formatAddressLines(order.shippingAddress as ShippingAddress);
  const audit = await db.auditLog.findMany({ where: { entity: "Order", entityId: order.id }, orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <div>
      <p className="eyebrow"><Link href="/admin/orders" className="hover:underline">Orders</Link></p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{order.number}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="hint mt-1">Placed {order.createdAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-4" aria-labelledby="items">
            <h2 id="items" className="font-bold">Items</h2>
            <div className="table-wrap mt-2">
              <table className="data">
                <thead><tr><th scope="col">Product</th><th scope="col">SKU</th><th scope="col">Qty</th><th scope="col">Each</th><th scope="col">Line</th></tr></thead>
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.productName}<span className="hint block text-xs">{i.size}, {i.colour}</span></td>
                      <td className="font-mono text-xs">{i.sku}</td>
                      <td>{i.quantity}</td>
                      <td>{formatPence(i.unitPence)}</td>
                      <td>{formatPence(i.unitPence * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPence(order.subtotalPence)}</dd></div>
              <div className="flex justify-between"><dt>Delivery ({order.shippingMethod})</dt><dd>{formatPence(order.shippingPence)}</dd></div>
              <div className="flex justify-between border-t border-border pt-1 font-bold"><dt>Total</dt><dd>{formatPence(order.totalPence)}</dd></div>
            </dl>
          </section>

          <section className="card p-4" aria-labelledby="customer">
            <h2 id="customer" className="font-bold">Customer and delivery</h2>
            <p className="mt-2 text-sm">{order.customerName || "(no name)"}<br /><a href={`mailto:${order.email}`} className="text-accent underline">{order.email}</a></p>
            <address className="mt-3 not-italic text-sm">{address.map((l) => <span key={l} className="block">{l}</span>)}</address>
            <p className="hint mt-3 text-xs">Customer order page: <Link href={`/orders/${order.number}?email=${encodeURIComponent(order.email)}`} className="text-accent underline">/orders/{order.number}</Link></p>
          </section>

          <section className="card p-4" aria-labelledby="stripe">
            <h2 id="stripe" className="font-bold">Stripe</h2>
            <dl className="mt-2 space-y-1 text-xs">
              <div><dt className="hint inline">Checkout session: </dt><dd className="inline font-mono">{order.stripeSessionId}</dd></div>
              <div><dt className="hint inline">Payment intent: </dt><dd className="inline font-mono">{order.stripePaymentIntentId ?? "(none)"}</dd></div>
            </dl>
            <p className="hint mt-2 text-xs">Refunds are issued from the Stripe dashboard against the payment intent, then noted here.</p>
          </section>

          {audit.length > 0 && (
            <section className="card p-4" aria-labelledby="history">
              <h2 id="history" className="font-bold">History</h2>
              <ul className="mt-2 space-y-1 text-xs">
                {audit.map((a) => (
                  <li key={a.id}><span className="hint">{a.createdAt.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span> {a.actor}: {a.action}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="card p-4" aria-labelledby="fulfil">
            <h2 id="fulfil" className="font-bold">Dispatch</h2>
            {order.status === "FULFILLED" ? (
              <p className="mt-2 text-sm text-ok">Dispatched {order.fulfilledAt?.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}{order.trackingRef ? `, tracking ${order.trackingRef}` : ""}.</p>
            ) : order.status === "PAID" ? (
              <FulfilForm orderId={order.id} />
            ) : (
              <p className="hint mt-2 text-sm">This order is {order.status.toLowerCase()}.</p>
            )}
          </section>
          <section className="card p-4" aria-labelledby="note">
            <h2 id="note" className="font-bold">Cancel, refund or note</h2>
            <NoteForm orderId={order.id} adminNote={order.adminNote} status={order.status} />
          </section>
        </div>
      </div>
    </div>
  );
}
