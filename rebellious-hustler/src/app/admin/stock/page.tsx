import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { LOW_STOCK_THRESHOLD } from "@/lib/site";

export const metadata: Metadata = { title: "Stock" };

export default async function AdminStockPage({ searchParams }: { searchParams: Promise<{ threshold?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const parsed = Number(sp.threshold);
  const threshold = Number.isInteger(parsed) && parsed >= 0 && parsed <= 1000 ? parsed : LOW_STOCK_THRESHOLD;
  const variants = await db.productVariant.findMany({
    where: { stockQty: { lte: threshold }, product: { status: { not: "ARCHIVED" } } },
    include: { product: { select: { id: true, name: true, status: true } } },
    orderBy: [{ stockQty: "asc" }, { product: { name: "asc" } }],
  });

  return (
    <div>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-1 text-2xl font-extrabold">Low stock</h1>
      <form method="get" className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="threshold" className="field">Show variants with stock at or below</label>
          <input id="threshold" name="threshold" type="number" min={0} max={1000} defaultValue={threshold} className="input w-28" />
        </div>
        <button type="submit" className="btn btn-secondary">Update</button>
      </form>
      {variants.length === 0 ? (
        <p className="hint mt-6">Nothing at or below {threshold}. Stock looks healthy.</p>
      ) : (
        <div className="table-wrap mt-4">
          <table className="data">
            <thead><tr><th scope="col">Product</th><th scope="col">Size</th><th scope="col">Colour</th><th scope="col">SKU</th><th scope="col">Stock</th></tr></thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td><Link href={`/admin/products/${v.product.id}`} className="font-semibold text-accent">{v.product.name}</Link>{v.product.status !== "LIVE" && <span className="hint block text-xs">{v.product.status.toLowerCase()}</span>}</td>
                  <td>{v.size}</td>
                  <td>{v.colour}</td>
                  <td className="font-mono text-xs">{v.sku}</td>
                  <td className={v.stockQty === 0 ? "font-bold text-danger" : "font-bold text-warn"}>{v.stockQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="hint mt-4 text-sm">Update stock numbers on each product&apos;s edit page.</p>
    </div>
  );
}
