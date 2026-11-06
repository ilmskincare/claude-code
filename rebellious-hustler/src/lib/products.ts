import { db } from "./db";
import type { Audience, Category } from "@/generated/prisma/enums";
import type { ProductCardData } from "@/components/ProductCard";

const cardInclude = {
  images: { orderBy: { position: "asc" as const }, take: 1 },
  variants: { select: { stockQty: true } },
};

type CardRow = {
  slug: string;
  name: string;
  pricePence: number;
  compareAtPence: number | null;
  audience: Audience;
  category: Category;
  images: { url: string; thumbUrl: string; alt: string }[];
  variants: { stockQty: number }[];
};

export function toCard(p: CardRow): ProductCardData {
  const img = p.images[0];
  return {
    slug: p.slug,
    name: p.name,
    pricePence: p.pricePence,
    compareAtPence: p.compareAtPence,
    audience: p.audience,
    category: p.category,
    image: img ? { url: img.url, thumbUrl: img.thumbUrl, alt: img.alt || p.name } : null,
    inStock: p.variants.some((v) => v.stockQty > 0),
  };
}

export type ShopSort = "newest" | "price-asc" | "price-desc";

export async function listLiveProducts(filter: { audience?: Audience | null; category?: Category | null; sort?: ShopSort } = {}) {
  const orderBy = filter.sort === "price-asc" ? { pricePence: "asc" as const } : filter.sort === "price-desc" ? { pricePence: "desc" as const } : { createdAt: "desc" as const };
  const rows = await db.product.findMany({
    where: { status: "LIVE", ...(filter.audience ? { audience: filter.audience } : {}), ...(filter.category ? { category: filter.category } : {}) },
    include: cardInclude,
    orderBy,
  });
  return rows.map(toCard);
}

export async function listFeaturedProducts(limit = 4) {
  const rows = await db.product.findMany({ where: { status: "LIVE", featured: true }, include: cardInclude, orderBy: { updatedAt: "desc" }, take: limit });
  if (rows.length < limit) {
    const more = await db.product.findMany({ where: { status: "LIVE", featured: false }, include: cardInclude, orderBy: { createdAt: "desc" }, take: limit - rows.length });
    rows.push(...more);
  }
  return rows.map(toCard);
}

export async function getLiveProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "LIVE" },
    include: { images: { orderBy: { position: "asc" } }, variants: { orderBy: [{ colour: "asc" }, { size: "asc" }] } },
  });
}

export async function relatedProducts(product: { id: string; category: Category; audience: Audience }, limit = 4) {
  const rows = await db.product.findMany({
    where: { status: "LIVE", id: { not: product.id }, OR: [{ category: product.category }, { audience: product.audience }] },
    include: cardInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toCard);
}
