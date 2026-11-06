import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatPence } from "@/lib/money";

export const metadata: Metadata = { title: "Orders" };

const STATUSES = ["PAID", "FULFILLED", "CANCELLED", "REFUNDED"] as const;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const orders = await db.order.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 200, include: { items: { select: { quantity: true } } } });

  return (
    <div>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-1 text-2xl font-extrabold">Orders</h1>
      <nav aria-label="Filter by status" className="mt-5">
        <ul className="nav-scroll">
          <li><Link href="/admin/orders" className="nav-link" aria-current={!status ? "page" : undefined}>All</Link></li>
          {STATUSES.map((s) => (
            <li key={s}><Link href={`/admin/orders?status=${s}`} className="nav-link" aria-current={status === s ? "page" : undefined}>{s.charAt(0) + s.slice(1).toLowerCase()}</Link></li>
          ))}
        </ul>
      </nav>
      {orders.length === 0 ? (
        <p className="hint mt-6">No orders {status ? `with status ${status.toLowerCase()}` : "yet"}.</p>
      ) : (
        <div className="table-wrap mt-4">
          <table className="data">
            <thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Items</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col">Placed</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} className="font-semibold text-accent">{o.number}</Link></td>
                  <td>{o.customerName || "(no name)"}<span className="hint block text-xs">{o.email}</span></td>
                  <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td>{formatPence(o.totalPence)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>{o.createdAt.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
