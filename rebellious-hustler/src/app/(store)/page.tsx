import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { listFeaturedProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rebellious Hustler | Birmingham streetwear",
  description: SITE.description,
  alternates: { canonical: "/" },
};

const TILES = [
  { href: "/shop?audience=mens", label: "Mens", blurb: "Tracksuits, hoodies, tees" },
  { href: "/shop?audience=womens", label: "Womens", blurb: "Crop hoodies, sets, tees" },
  { href: "/shop?audience=boys", label: "Boys", blurb: "Ages 3 to 14" },
  { href: "/shop?audience=girls", label: "Girls", blurb: "Ages 3 to 14" },
];

export default async function HomePage() {
  const [featured, settings] = await Promise.all([listFeaturedProducts(4), getSettings()]);
  const handle = settings.instagramHandle || SITE.instagramHandle;
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="eyebrow">Birmingham, UK</p>
            <h1 className="script mt-3 text-[3.4rem] leading-[0.95] sm:text-[4.6rem] md:text-[5.2rem]">Rebellious Hustler</h1>
            <p className="display mt-4 text-sm text-gold sm:text-base">{SITE.madeOf}</p>
            <p className="mt-5 max-w-md text-lg text-bone/90">Streetwear for the whole family. Mens, womens, boys and girls. Tracksuits, hoodies, tees, sportswear and accessories, straight out of Fox &amp; Goose.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary">Shop everything</Link>
              <Link href="/about" className="btn btn-secondary">The movement</Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm md:max-w-md">
            <Image src="/brand/rebellious-hustler-logo.png" alt="Rebellious Hustler bear logo: a bear in a red hoodie, tartan flat cap, sunglasses and gold chains" width={320} height={320} priority className="w-full rounded-2xl border border-border bg-night" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="ranges">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Who it is for</p>
            <h2 id="ranges" className="mt-1 text-2xl font-extrabold">Pick your range</h2>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-gold hover:underline">All products</Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {TILES.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="card group flex h-full flex-col justify-between p-4 transition hover:border-gold sm:p-6">
                <span className="display text-xl group-hover:text-gold sm:text-2xl">{t.label}</span>
                <span className="mt-6 text-sm text-muted">{t.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="featured">
        <p className="eyebrow">Fresh in</p>
        <h2 id="featured" className="mt-1 text-2xl font-extrabold">Featured pieces</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 2} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="eyebrow">The movement</p>
            <h2 className="display mt-2 text-2xl sm:text-3xl">{SITE.straplineDisplay}</h2>
            <p className="mt-5 text-lg">We pride ourselves on being approachable, loyal and honest, with a family atmosphere and no discrimination. One shop in Birmingham, one brand, one voice. Join the movement.</p>
            <p className="mt-3 text-muted">High quality clothing for men, women, boys and girls. Tracksuits, t-shirts, hoodies, sportswear and accessories.</p>
          </div>
          <div className="card-2 p-6">
            <p className="display text-sm text-gold">Come and see us</p>
            <p className="mt-3">{settings.storeAddress || SITE.address}</p>
            <p className="mt-4 text-sm text-muted">Follow the drops and message us to order anything you cannot find online.</p>
            <a href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-5 w-full sm:w-auto">Instagram @{handle}</a>
          </div>
        </div>
      </section>
    </>
  );
}
