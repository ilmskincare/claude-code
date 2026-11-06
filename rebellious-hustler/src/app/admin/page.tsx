import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatPence } from "@/lib/money";
import { LOW_STOCK_THRESHOLD } from "@/lib/site";
import { missingEnv } from "@/lib/env";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata: Metadata = { title: "Dashboard" };

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const paidStatuses = ["PAID", "FULFILLED"] as const;
  const [today, week, revenueToday, revenueWeek, lowStock, awaiting, recent, sampleCount] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: startOfToday() }, status: { in: [...paidStatuses] } } }),
    db.order.count({ where: { createdAt: { gte: startOfWeek() }, status: { in: [...paidStatuses] } } }),
    db.order.aggregate({ _sum: { totalPence: true }, where: { createdAt: { gte: startOfToday() }, status: { in: [...paidStatuses] } } }),
    db.order.aggregate({ _sum: { totalPence: true }, where: { createdAt: { gte: startOfWeek() }, status: { in: [...paidStatuses] } } }),
    db.productVariant.count({ where: { stockQty: { lte: LOW_STOCK_THRESHOLD }, product: { status: "LIVE" } } }),
    db.order.count({ where: { status: "PAID" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, number: true, customerName: true, email: true, totalPence: true, status: true, createdAt: true } }),
    db.product.count({ where: { isSample: true } }),
  ]);
  const missing = missingEnv();

  return (
    <div>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-1 text-2xl font-extrabold">Dashboard</h1>
      {sp.password === "changed" && <p role="status" className="mt-3 text-sm text-ok">Password changed.</p>}

      {missing.length > 0 && (
        <div className="card mt-4 border-warn p-4 text-sm" role="status">
          <p className="font-bold text-warn">Not fully connected yet</p>
          <p className="hint mt-1">Missing: {missing.map((m) => m.name).join(", ")}. <Link href="/admin/settings" className="text-accent underline">See what each one does</Link>.</p>
        </div>
      )}
      {sampleCount > 0 && (
        <p className="hint mt-3 text-sm">{sampleCount} sample {sampleCount === 1 ? "product is" : "products are"} still in the catalogue. Replace them with real products and photos before launch.</p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Orders today" value={String(today)} />
        <Stat label="Orders this week" value={String(week)} />
        <Stat label="Revenue today" value={formatPence(revenueToday._sum.totalPence ?? 0)} />
        <Stat label="Revenue this week" value={formatPence(revenueWeek._sum.totalPence ?? 0)} />
      </dl>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/orders?status=PAID" className="card p-4 hover:border-accent">
          <p className="hint">To dispatch</p>
          <p className="text-2xl font-extrabold">{awaiting}</p>
        </Link>
        <Link href="/admin/stock" className="card p-4 hover:border-accent">
          <p className="hint">Low stock variants ({LOW_STOCK_THRESHOLD} or fewer)</p>
          <p className={`text-2xl font-extrabold ${lowStock > 0 ? "text-warn" : ""}`}>{lowStock}</p>
        </Link>
      </div>

      <section className="mt-8" aria-labelledby="recent">
        <div className="flex items-center justify-between">
          <h2 id="recent" className="text-lg font-bold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-accent underline">All orders</Link>
        </div>
        {recent.length === 0 ? (
          <p className="hint mt-3">No orders yet.</p>
        ) : (
          <div className="table-wrap mt-3">
            <table className="data">
              <thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col">Placed</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders/${o.id}`} className="font-semibold text-accent">{o.number}</Link></td>
                    <td>{o.customerName || o.email}</td>
                    <td>{formatPence(o.totalPence)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>{o.createdAt.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <dt className="hint">{label}</dt>
      <dd className="mt-1 text-2xl font-extrabold">{value}</dd>
    </div>
  );
}
