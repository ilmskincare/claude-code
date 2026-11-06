import Image from "next/image";
import Link from "next/link";
import { formatPence } from "@/lib/money";
import { AUDIENCE_LABEL, CATEGORY_LABEL } from "@/lib/catalogue";
import type { Audience, Category } from "@/generated/prisma/enums";

export type ProductCardData = {
  slug: string;
  name: string;
  pricePence: number;
  compareAtPence: number | null;
  audience: Audience;
  category: Category;
  image: { url: string; thumbUrl: string; alt: string } | null;
  inStock: boolean;
};

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  return (
    <Link href={`/shop/${product.slug}`} className="product-card card group block overflow-hidden" data-testid="product-card">
      <div className="aspect-product relative overflow-hidden bg-surface-2">
        {product.image ? (
          <Image src={product.image.thumbUrl} alt={product.image.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover" priority={priority} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">No photo yet</div>
        )}
        {!product.inStock && <span className="badge badge-muted absolute left-3 top-3">Sold out</span>}
        {product.compareAtPence && product.compareAtPence > product.pricePence && product.inStock && <span className="badge badge-accent absolute left-3 top-3">Offer</span>}
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-xs text-muted">{AUDIENCE_LABEL[product.audience]} / {CATEGORY_LABEL[product.category]}</p>
        <h3 className="mt-1 font-bold leading-snug group-hover:text-accent">{product.name}</h3>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-bold text-accent">{formatPence(product.pricePence)}</span>
          {product.compareAtPence && product.compareAtPence > product.pricePence && <s className="text-sm text-muted">{formatPence(product.compareAtPence)}</s>}
        </p>
      </div>
    </Link>
  );
}
