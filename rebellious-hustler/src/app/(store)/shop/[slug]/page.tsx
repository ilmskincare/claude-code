import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { Gallery } from "@/components/Gallery";
import { ProductCard } from "@/components/ProductCard";
import { AUDIENCE_LABEL, AUDIENCE_SLUG, CATEGORY_LABEL, CATEGORY_SLUG } from "@/lib/catalogue";
import { formatPence } from "@/lib/money";
import { getLiveProductBySlug, relatedProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getLiveProductBySlug(slug);
  if (!product) return { title: "Not found" };
  const image = product.images[0];
  return {
    title: product.name,
    description: product.description.slice(0, 160) || `${product.name} from Rebellious Hustler, Birmingham.`,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: { title: product.name, description: product.description.slice(0, 200), images: image ? [{ url: image.url, alt: image.alt || product.name }] : undefined },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getLiveProductBySlug(slug);
  if (!product) notFound();
  const [related, settings] = await Promise.all([relatedProducts(product), getSettings()]);
  const onOffer = product.compareAtPence != null && product.compareAtPence > product.pricePence;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-1">
          <li><Link href="/shop" className="hover:text-accent">Shop</Link><span aria-hidden="true"> /</span></li>
          <li><Link href={`/shop?audience=${AUDIENCE_SLUG[product.audience]}`} className="hover:text-accent">{AUDIENCE_LABEL[product.audience]}</Link><span aria-hidden="true"> /</span></li>
          <li><Link href={`/shop?category=${CATEGORY_SLUG[product.category]}`} className="hover:text-accent">{CATEGORY_LABEL[product.category]}</Link></li>
        </ol>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <Gallery images={product.images.map((i) => ({ id: i.id, url: i.url, thumbUrl: i.thumbUrl, alt: i.alt || product.name }))} name={product.name} />

        <div>
          <h1 className="text-3xl font-extrabold leading-tight">{product.name}</h1>
          <p className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-accent" data-testid="product-price">{formatPence(product.pricePence)}</span>
            {onOffer && <s className="text-muted">{formatPence(product.compareAtPence!)}</s>}
            {onOffer && <span className="badge badge-accent">Offer</span>}
          </p>

          <div className="mt-6">
            <AddToCart variants={product.variants.map((v) => ({ id: v.id, size: v.size, colour: v.colour, stockQty: v.stockQty }))} />
          </div>

          <div className="prose-rh mt-8">
            <h2 className="text-lg">About this piece</h2>
            {product.description ? product.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>) : <p className="hint">Description coming soon.</p>}
          </div>

          <div className="card mt-6 divide-y divide-border text-sm">
            <div className="p-4">
              <p className="font-bold">Delivery</p>
              <p className="hint mt-1">UK Standard {formatPence(settings.shippingStandardPence)} (2 to 4 working days). UK Express {formatPence(settings.shippingExpressPence)} (1 to 2 working days). Free UK delivery on orders over {formatPence(settings.freeShippingThresholdPence)}.</p>
            </div>
            <div className="p-4">
              <p className="font-bold">Returns</p>
              <p className="hint mt-1">14 days to change your mind from the day you receive it, then 14 more days to send it back. Unworn, with tags. Faulty items are sorted at our cost. <Link href="/returns" className="text-accent underline">Full returns policy</Link>.</p>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="related">
          <h2 id="related" className="text-xl font-extrabold">You might also like</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
