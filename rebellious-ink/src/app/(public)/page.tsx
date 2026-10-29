/* eslint-disable @next/next/no-img-element -- images are served through short-lived signed URLs that next/image cannot optimise */
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { signedUrl } from "@/lib/storage";
import { livePromotions } from "@/lib/promotions";
import { gumballSettings } from "@/lib/gumball";
import { PromotionRibbon } from "@/components/promotion-ribbon";

export default async function HomePage() {
  const [gumball, artists, promos] = await Promise.all([gumballSettings(), db.artistProfile.findMany({ where: { isPublished: true, isHouse: false }, include: { portfolioItems: { where: { publishedAt: { not: null }, isCover: true }, include: { asset: true }, take: 1 } }, orderBy: { displayName: "asc" } }), livePromotions()]);
  return (
    <>
      <section className="dark-shell">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <p className="text-acid-bright uppercase tracking-[.3em] text-sm mb-4">Tattoo &amp; piercing studio</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">Bold work.<br />Honest advice.<br /><span className="text-acid">Sterile precision.</span></h1>
            <p className="mt-6 text-lg max-w-xl opacity-85">Around here we don&apos;t do pretentious or shortcuts. This is the tattoo studio for the people, built on high-calibre artistry and zero compromise on your safety. We cater to the Rebellious Hustlers who grind hard and live by their own rules. We match that energy with honesty, elite talent and a sterile environment that treats your skin with the respect it deserves. No pressure, no fake promises or availability. Talk directly to your artist or piercer, browse real healed work and get straight answers.</p>
            <p className="mt-4 text-xl font-bold text-acid-bright">Pain is temporary, ink is forever.</p>
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
              <li key={a.id} className="card overflow-hidden relative">
                {promos.byArtist.get(a.id) && <PromotionRibbon title={promos.byArtist.get(a.id)!.title} />}
                <Link href={`/artists/${a.slug}`}>
                  <div className="aspect-[4/3] bg-steel relative">
                    {a.portfolioItems[0] ? <img src={signedUrl(a.portfolioItems[0].asset.storageKey, 3600)} alt={a.portfolioItems[0].caption ?? `Work by ${a.displayName}`} className="w-full h-full object-cover" /> : <div className="absolute inset-0 grid place-items-center text-bone/50">Portfolio coming soon</div>}
                  </div>
                  <div className="p-4 flex items-center gap-3">{a.avatarKey && <img src={signedUrl(a.avatarKey, 3600)} alt="" className="w-12 h-12 rounded-full object-cover bg-bone shrink-0" />}<div><h3 className="text-xl font-bold">{a.displayName}</h3><p className="hint mt-1">{a.styles.join(" · ") || a.kind.replace("_", " ").toLowerCase()}</p></div></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-14" aria-labelledby="cash-sign">
        <aside className="card border-2 border-acid p-6 md:p-8 md:flex md:gap-8 md:items-start">
          <div className="md:w-64 shrink-0"><p className="text-acid-deep uppercase tracking-[.3em] text-sm">A note from the studio</p><h2 id="cash-sign" className="text-3xl font-bold leading-tight mt-1">Cash is king, because every percentage counts.</h2></div>
          <div className="mt-4 md:mt-0 space-y-3 text-[15px] opacity-90">
            <p>At Rebellious Ink we value the true cost of our craftsmanship. For every Rebellious Hustler on our team the priority is simple: pay in cash and the artist keeps 100 per cent of what they earn. Card processors take a cut of every tap, straight out of an independent artist&apos;s pocket.</p>
            <p>Choosing cash supports the studio&apos;s financial health and creative independence. Here is why cash keeps us strong:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>No processing deductions.</strong> Every penny goes to the work.</li>
              <li><strong>Immediate cash flow.</strong> We reinvest in premium inks, better equipment and client comfort.</li>
              <li><strong>Straightforward transactions.</strong> Simple, quick, and in the studio&apos;s own hands.</li>
            </ul>
            <p>We appreciate your support in keeping our business thriving and independent. Deposits are taken when you book; the balance on the day is best paid in cash, and we always give a receipt.</p>
            <div className="pt-2 flex flex-wrap gap-2"><Link href="/enquire" className="btn btn-primary">Book now</Link><Link href="/flash" className="btn btn-secondary">See the flash wall</Link></div>
          </div>
        </aside>
      </section>
      {gumball.enabled && (
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="card p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center border-2 border-acid">
          <div><p className="text-acid-deep uppercase tracking-[.3em] text-sm mb-2">Get what you get</p><h2 className="text-3xl font-bold">The gumball machine, online</h2><p className="mt-2 opacity-85 max-w-2xl">Turn the crank, the machine picks one small design from our artists, you book it at one fixed price. Free to spin, no swaps, 18+ only.</p></div>
          <div className="flex flex-col gap-2"><Link href="/play/gumball" className="btn btn-primary text-lg">Turn the crank</Link><Link href="/play/trio" className="btn btn-secondary">Or try the three machines</Link></div>
        </div>
      </section>
      )}
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
