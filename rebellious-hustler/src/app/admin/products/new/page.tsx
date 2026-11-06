import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div>
      <p className="eyebrow"><Link href="/admin/products" className="hover:underline">Products</Link></p>
      <h1 className="mt-1 text-2xl font-extrabold">New product</h1>
      <p className="hint mt-1">It starts as a draft. Add photos after saving, then publish it live.</p>
      <div className="mt-6">
        <ProductForm product={null} />
      </div>
    </div>
  );
}
