import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/admin-auth";
import { AUDIENCE_LABEL, CATEGORY_LABEL } from "@/lib/catalogue";
import { db } from "@/lib/db";
import { formatPence } from "@/lib/money";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ status?: string; deleted?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = ["DRAFT", "LIVE", "ARCHIVED"].includes(sp.status ?? "") ? (sp.status as "DRAFT" | "LIVE" | "ARCHIVED") : undefined;
  const products = await db.product.findMany({
    where: status ? { status } : {},
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: { select: { stockQty: true } } },
  });
  const samples = products.filter((p) => p.isSample).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-2xl font-extrabold">Products</h1>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">New product</Link>
      </div>
      {sp.deleted && <p role="status" className="mt-3 text-sm text-ok">Product deleted.</p>}
      {samples > 0 && <p className="mt-3 text-sm text-warn">{samples} of these are sample products from the seed. Edit them with real details and photos, or delete them.</p>}

      <nav aria-label="Filter by status" className="mt-5">
        <ul className="nav-scroll">
          {[{ v: undefined, l: "All" }, { v: "LIVE", l: "Live" }, { v: "DRAFT", l: "Draft" }, { v: "ARCHIVED", l: "Archived" }].map((f) => (
            <li key={f.l}><Link href={f.v ? `/admin/products?status=${f.v}` : "/admin/products"} className="nav-link" aria-current={status === f.v ? "page" : undefined}>{f.l}</Link></li>
          ))}
        </ul>
      </nav>

      {products.length === 0 ? (
        <p className="hint mt-6">No products here yet.</p>
      ) : (
        <div className="table-wrap mt-4">
          <table className="data">
            <thead><tr><th scope="col">Product</th><th scope="col">Range</th><th scope="col">Price</th><th scope="col">Stock</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {products.map((p) => {
                const stock = p.variants.reduce((s, v) => s + v.stockQty, 0);
                const img = p.images[0];
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <span className="relative block h-12 w-10 shrink-0 overflow-hidden rounded bg-surface-2">{img && <Image src={img.thumbUrl} alt="" fill sizes="40px" className="object-cover" />}</span>
                        <span>
                          <span className="block font-semibold text-accent">{p.name}</span>
                          <span className="hint block text-xs">/{p.slug}{p.isSample ? " (sample)" : ""}{p.featured ? " / featured" : ""}</span>
                        </span>
                      </Link>
                    </td>
                    <td>{AUDIENCE_LABEL[p.audience]} / {CATEGORY_LABEL[p.category]}</td>
                    <td>{formatPence(p.pricePence)}</td>
                    <td className={stock === 0 ? "text-danger" : ""}>{stock} across {p.variants.length} {p.variants.length === 1 ? "variant" : "variants"}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
