/* eslint-disable @next/next/no-img-element -- signed, short-lived URLs */
import Link from "next/link";
import { catalogue, sheetsForCatalogue } from "@/lib/flash";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { FlashTile } from "@/components/flash-tile";
import { signedUrl } from "@/lib/storage";

export const metadata = { title: "Flash" };
type SP = { view?: string; theme?: string; artist?: string; size?: string; min?: string; max?: string; apprentice?: string; oneoff?: string; colour?: string };

export default async function FlashPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const view = sp.view === "sheets" ? "sheets" : "designs";
  const size = sp.size === "palm" ? "palm" : "small";
  const [{ items, themes, settings }, sheets, artists] = await Promise.all([
    catalogue({ theme: sp.theme || undefined, artist: sp.artist || undefined, size, minPence: sp.min ? Number(sp.min) * 100 : undefined, maxPence: sp.max ? Number(sp.max) * 100 : undefined, apprentice: sp.apprentice === "1", oneOff: sp.oneoff === "1", colour: sp.colour === "COLOUR" || sp.colour === "BLACK" ? sp.colour : undefined }),
    view === "sheets" ? sheetsForCatalogue(sp.artist || undefined) : Promise.resolve([]),
    db.artistProfile.findMany({ where: { isPublished: true, designs: { some: { status: { not: "RETIRED" }, collection: "CATALOGUE" } } }, select: { slug: true, displayName: true }, orderBy: { displayName: "asc" } }),
  ]);
  const gbp = (p: number) => `£${(p / 100).toFixed(0)}`;
  const q = (over: Partial<SP>) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ ...sp, ...over })) if (v) u.set(k, String(v)); return `/flash?${u.toString()}`; };
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="Flash" intro={settings.palmEnabled ? `Ready-drawn designs at fixed prices: Small (up to ${settings.smallMaxCm} cm) ${gbp(settings.smallPence)}, Palm (up to ${settings.palmMaxCm} cm) ${gbp(settings.palmPence)}. Supervised apprentice pieces from ${gbp(settings.apprenticeSmallPence)}. The price you see is the price you pay; the deposit comes off it.` : `Ready-drawn designs at a fixed price: ${gbp(settings.smallPence)} for up to ${settings.sizeOptionsCm[settings.sizeOptionsCm.length - 1]} cm on flat, easy areas, unless the design says otherwise. Supervised apprentice pieces from ${gbp(settings.apprenticeSmallPence)}. The price you see is the price you pay; the deposit comes off it.`} />
      <div className="flex flex-wrap items-center gap-2 mb-4" role="tablist" aria-label="View">
        <Link role="tab" aria-selected={view === "designs"} href={q({ view: "designs" })} className={`btn ${view === "designs" ? "btn-primary" : "btn-secondary"}`}>Designs</Link>
        <Link role="tab" aria-selected={view === "sheets"} href={q({ view: "sheets" })} className={`btn ${view === "sheets" ? "btn-primary" : "btn-secondary"}`}>Sheets</Link>
      </div>
      <form method="get" action="/flash" className="card p-4 grid sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 items-end">
        <input type="hidden" name="view" value={view} />
        <div><label className="field" htmlFor="theme">Theme</label><select id="theme" name="theme" className="select" defaultValue={sp.theme ?? ""}><option value="">Any</option>{themes.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
        <div><label className="field" htmlFor="artist">Artist</label><select id="artist" name="artist" className="select" defaultValue={sp.artist ?? ""}><option value="">Any</option>{artists.map((a) => <option key={a.slug} value={a.slug}>{a.displayName}</option>)}</select></div>
        {settings.palmEnabled ? <div><label className="field" htmlFor="size">Price shown for</label><select id="size" name="size" className="select" defaultValue={size}><option value="small">Small</option><option value="palm">Palm</option></select></div> : <input type="hidden" name="size" value="small" />}
        <div className="grid grid-cols-2 gap-1"><div><label className="field" htmlFor="min">Min £</label><input id="min" name="min" type="number" min={0} className="input" defaultValue={sp.min ?? ""} /></div><div><label className="field" htmlFor="max">Max £</label><input id="max" name="max" type="number" min={0} className="input" defaultValue={sp.max ?? ""} /></div></div>
        <div><label className="field" htmlFor="colour">Colour</label><select id="colour" name="colour" className="select" defaultValue={sp.colour ?? ""}><option value="">Any</option><option value="BLACK">Black</option><option value="COLOUR">Colour</option></select></div>
        <div className="flex flex-col gap-1 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="apprentice" value="1" defaultChecked={sp.apprentice === "1"} /> Apprentice available</label><label className="flex items-center gap-2"><input type="checkbox" name="oneoff" value="1" defaultChecked={sp.oneoff === "1"} /> One-off only</label><button className="btn btn-secondary mt-1">Filter</button></div>
      </form>
      {view === "designs" ? (
        items.length === 0 ? <p className="opacity-70">No designs match. Try fewer filters.</p> : <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{items.map((d) => <FlashTile key={d.id} d={d} palmEnabled={settings.palmEnabled} />)}</ul>
      ) : (
        sheets.length === 0 ? <p className="opacity-70">No sheets posted yet. Switch to Designs.</p> : <ul className="space-y-8">{sheets.map((s) => (
          <li key={s.id} className="card p-4">
            <h2 className="text-2xl font-bold">{s.title}</h2><p className="hint mb-3">{s.artist.displayName} · tap a numbered design to open it</p>
            <div className="relative"><img src={signedUrl(s.imageKey, 3600)} alt={`${s.title} flash sheet by ${s.artist.displayName}`} className="w-full h-auto rounded-lg" />
              {s.designs.map((d, i) => d.hotspotX != null && <Link key={d.id} href={`/flash/${d.id}`} aria-label={`${i + 1}: ${d.title}`} className="absolute border-2 border-acid/80 rounded hover:bg-acid/20 focus:bg-acid/20" style={{ left: `${d.hotspotX}%`, top: `${d.hotspotY}%`, width: `${d.hotspotW}%`, height: `${d.hotspotH}%` }}><span className="absolute -top-3 -left-1 badge badge-acid">{i + 1}</span></Link>)}
            </div>
            <ol className="mt-3 grid sm:grid-cols-2 gap-1 text-sm">{s.designs.map((d, i) => <li key={d.id}><Link href={`/flash/${d.id}`} className="hover:underline">{i + 1}. {d.title}</Link>{d.status === "BOOKED" ? <span className="badge badge-muted ml-2">Booked</span> : null}</li>)}</ol>
          </li>
        ))}</ul>
      )}
      <p className="hint mt-8">Flash prices apply to small sizes (up to {settings.sizeOptionsCm[settings.sizeOptionsCm.length - 1]} cm) on flat, easy areas: outer upper arm, forearm, top of the shoulder, outer thigh and calf. A different size or place is a custom price: ask the desk. Our apprentices are trained and supervised: lower price, same hygiene standards, same aftercare and free touch-up.</p>
    </div>
  );
}
