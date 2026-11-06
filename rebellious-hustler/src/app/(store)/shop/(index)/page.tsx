import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { AUDIENCE_LABEL, AUDIENCE_SLUG, CATEGORY_LABEL, CATEGORY_SLUG, audienceFromSlug, categoryFromSlug } from "@/lib/catalogue";
import { listLiveProducts, type ShopSort } from "@/lib/products";

type Search = { audience?: string; category?: string; sort?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const sp = await searchParams;
  const audience = audienceFromSlug(sp.audience);
  const category = categoryFromSlug(sp.category);
  const parts = [audience ? AUDIENCE_LABEL[audience] : null, category ? CATEGORY_LABEL[category] : null].filter(Boolean);
  const title = parts.length ? `${parts.join(" ")} | Shop` : "Shop";
  return { title, description: "Shop Rebellious Hustler tracksuits, hoodies, t-shirts, sportswear and accessories for men, women, boys and girls.", alternates: { canonical: "/shop" } };
}

const SORTS: { id: ShopSort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

function href(next: Search) {
  const q = new URLSearchParams();
  if (next.audience) q.set("audience", next.audience);
  if (next.category) q.set("category", next.category);
  if (next.sort && next.sort !== "newest") q.set("sort", next.sort);
  const s = q.toString();
  return s ? `/shop?${s}` : "/shop";
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const audience = audienceFromSlug(sp.audience);
  const category = categoryFromSlug(sp.category);
  const sort: ShopSort = SORTS.some((s) => s.id === sp.sort) ? (sp.sort as ShopSort) : "newest";
  const products = await listLiveProducts({ audience, category, sort });
  const current: Search = { audience: audience ? AUDIENCE_SLUG[audience] : undefined, category: category ? CATEGORY_SLUG[category] : undefined, sort };
  const heading = [audience ? AUDIENCE_LABEL[audience] : null, category ? CATEGORY_LABEL[category] : null].filter(Boolean).join(" ") || "Everything";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="eyebrow">Shop</p>
      <h1 className="mt-1 text-3xl font-extrabold">{heading}</h1>

      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside aria-label="Filters" className="space-y-5">
          <nav aria-label="Range">
            <p className="display text-xs text-muted">Range</p>
            <ul className="nav-scroll mt-2 lg:flex-col lg:items-start">
              <li><Link href={href({ ...current, audience: undefined })} className="nav-link" aria-current={!audience ? "page" : undefined}>All</Link></li>
              {(Object.keys(AUDIENCE_LABEL) as (keyof typeof AUDIENCE_LABEL)[]).map((a) => (
                <li key={a}><Link href={href({ ...current, audience: AUDIENCE_SLUG[a] })} className="nav-link" aria-current={audience === a ? "page" : undefined}>{AUDIENCE_LABEL[a]}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Category">
            <p className="display text-xs text-muted">Category</p>
            <ul className="nav-scroll mt-2 lg:flex-col lg:items-start">
              <li><Link href={href({ ...current, category: undefined })} className="nav-link" aria-current={!category ? "page" : undefined}>All</Link></li>
              {(Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]).map((c) => (
                <li key={c}><Link href={href({ ...current, category: CATEGORY_SLUG[c] })} className="nav-link" aria-current={category === c ? "page" : undefined}>{CATEGORY_LABEL[c]}</Link></li>
              ))}
            </ul>
          </nav>
        </aside>

        <section aria-labelledby="results">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="results" className="text-sm text-muted">{products.length} {products.length === 1 ? "product" : "products"}</h2>
            <form method="get" action="/shop" className="flex items-center gap-2">
              {current.audience && <input type="hidden" name="audience" value={current.audience} />}
              {current.category && <input type="hidden" name="category" value={current.category} />}
              <label htmlFor="sort" className="text-sm font-semibold">Sort</label>
              <select id="sort" name="sort" defaultValue={sort} className="select w-auto min-w-[11rem]">
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-secondary btn-sm">Go</button>
            </form>
          </div>
          {products.length === 0 ? (
            <p className="card mt-6 p-8 text-center text-muted">Nothing here yet. Check back soon or message us on Instagram.</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {products.map((p, i) => (
                <ProductCard key={p.slug} product={p} priority={i < 2} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
