import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageManager } from "@/components/admin/ImageManager";
import { ProductForm } from "@/components/admin/ProductForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { deleteProductAction, setProductStatusAction } from "../../actions";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; error?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const product = await db.product.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } }, variants: { orderBy: [{ colour: "asc" }, { size: "asc" }] } } });
  if (!product) notFound();

  return (
    <div>
      <p className="eyebrow"><Link href="/admin/products" className="hover:underline">Products</Link></p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{product.name}</h1>
        <StatusBadge status={product.status} />
        {product.isSample && <span className="badge badge-warn">Sample product</span>}
      </div>
      {product.isSample && <p className="mt-2 text-sm text-warn">This is a sample from the seed data with a placeholder image. Saving it with real details clears the sample flag.</p>}
      {sp.created && <p role="status" className="mt-3 text-sm text-ok">Product created as a draft. Add photos, then publish it live.</p>}
      {sp.error && <p role="alert" className="error mt-3">{sp.error}</p>}
      {product.status === "LIVE" && <p className="hint mt-2 text-sm"><Link href={`/shop/${product.slug}`} className="text-accent underline">View on the shop</Link></p>}

      <div className="card mt-5 flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm font-semibold">Visibility</span>
        {product.status !== "LIVE" && (
          <form action={setProductStatusAction}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="status" value="LIVE" />
            <button type="submit" className="btn btn-primary btn-sm">Publish live</button>
          </form>
        )}
        {product.status !== "DRAFT" && (
          <form action={setProductStatusAction}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="status" value="DRAFT" />
            <button type="submit" className="btn btn-secondary btn-sm">Back to draft</button>
          </form>
        )}
        {product.status !== "ARCHIVED" && (
          <form action={setProductStatusAction}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="status" value="ARCHIVED" />
            <button type="submit" className="btn btn-ghost btn-sm">Archive</button>
          </form>
        )}
        <span className="hint text-xs">Live products show in the shop. Drafts and archived products are hidden but keep their stock and order history.</span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="details">
          <h2 id="details" className="text-lg font-bold">Details</h2>
          <div className="mt-3">
            <ProductForm product={{ id: product.id, name: product.name, slug: product.slug, description: product.description, audience: product.audience, category: product.category, pricePence: product.pricePence, compareAtPence: product.compareAtPence, featured: product.featured, variants: product.variants.map((v) => ({ id: v.id, size: v.size, colour: v.colour, sku: v.sku, stockQty: v.stockQty })) }} />
          </div>
        </section>
        <section aria-labelledby="photos">
          <h2 id="photos" className="text-lg font-bold">Photos</h2>
          <p className="hint mt-1 text-sm">JPEG, PNG, WEBP or HEIC up to 20 MB. Resized to 1600 px with a 600 px thumbnail. The first photo is the one on the shop grid.</p>
          <div className="mt-3">
            <ImageManager productId={product.id} images={product.images.map((i) => ({ id: i.id, url: i.url, thumbUrl: i.thumbUrl, alt: i.alt, isPlaceholder: i.storageKey.startsWith("placeholders/") }))} />
          </div>

          <div className="card mt-8 p-4">
            <h3 className="font-bold text-danger">Delete product</h3>
            <p className="hint mt-1 text-sm">Only for products nobody has ordered. Otherwise archive it.</p>
            <form action={deleteProductAction} className="mt-3">
              <input type="hidden" name="productId" value={product.id} />
              <button type="submit" className="btn btn-danger-outline btn-sm">Delete permanently</button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
