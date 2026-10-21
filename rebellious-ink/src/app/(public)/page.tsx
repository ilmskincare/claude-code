/* eslint-disable @next/next/no-img-element -- images are served through short-lived signed URLs that next/image cannot optimise */
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { signedUrl } from "@/lib/storage";

export default async function HomePage() {
  const artists = await db.artistProfile.findMany({ where: { isPublished: true }, include: { portfolioItems: { where: { publishedAt: { not: null }, isCover: true }, include: { asset: true }, take: 1 } }, orderBy: { displayName: "asc" } });
  return (
    <>
      <section className="dark-shell">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <p className="text-acid-bright uppercase tracking-[.3em] text-sm mb-4">Tattoo &amp; piercing studio</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">Bold work.<br />Honest advice.<br /><span className="text-acid">Properly done.</span></h1>
            <p className="mt-6 text-lg max-w-xl opacity-85">Browse real, healed work from our artists, tell us what you have in mind, and talk it through directly with the person who will tattoo or pierce you. No pressure, no pretend availability.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/enquire" className="btn btn-primary">Start an enquiry</Link>
              <Link href="/artists" className="btn btn-secondary">Meet the artists</Link>
            </div>
            <p className="mt-6 text-sm opacity-60">18+ for tattooing. Photographic ID checked at every appointment.</p>
          </div>
          <div className="justify-self-center"><Image src="/brand/rebellious-ink-logo.jpg" alt="" width={360} height={360} className="rounded-full shadow-[0_0_80px_rgba(140,176,0,.35)]" priority /></div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between mb-6"><h2 className="text-3xl font-bold">Artists</h2><Link href="/artists" className="underline">See all</Link></div>
        {artists.length === 0 ? <p className="opacity-70">Artist profiles are being set up.</p> : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((a) => (
              <li key={a.id} className="card overflow-hidden">
                <Link href={`/artists/${a.slug}`}>
                  <div className="aspect-[4/3] bg-steel relative">
                    {a.portfolioItems[0] ? <img src={signedUrl(a.portfolioItems[0].asset.storageKey, 3600)} alt={a.portfolioItems[0].caption ?? `Work by ${a.displayName}`} className="w-full h-full object-cover" /> : <div className="absolute inset-0 grid place-items-center text-bone/50">Portfolio coming soon</div>}
                  </div>
                  <div className="p-4"><h3 className="text-xl font-bold">{a.displayName}</h3><p className="hint mt-1">{a.styles.join(" · ") || a.kind.replace("_", " ").toLowerCase()}</p></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-14 grid gap-6 md:grid-cols-3">
        {[
          ["1. Tell us your idea", "Size, placement, style, budget and references. Pick an artist or let us match you."],
          ["2. Talk it through", "Your artist replies in your private thread, then sends a clear quote with the deposit and terms."],
          ["3. Book and prepare", "Choose a genuinely free slot, pay your deposit securely, then get your preparation and aftercare guides."],
        ].map(([t, d]) => <div key={t} className="card p-6"><h3 className="text-lg font-bold">{t}</h3><p className="mt-2 opacity-80">{d}</p></div>)}
      </section>
    </>
  );
}
