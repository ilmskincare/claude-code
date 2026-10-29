import Link from "next/link";
import { db } from "@/lib/db";
import { designsForManagement } from "@/lib/flash";
import { signedUrl } from "@/lib/storage";
import { DesignImage } from "./design-image";
import { PageHeader, Stat } from "./ui";
import { BulkPriceForm, RetireButton } from "./design-forms";
import { formatPence } from "@/lib/money";

/** Shared by the owner (all artists) and each artist (own designs). */
export async function FlashManager({ artistId, basePath, canBulk }: { artistId?: string; basePath: "/owner/flash" | "/studio/flash"; canBulk: boolean }) {
  const [{ rows, settings }, sheets] = await Promise.all([designsForManagement(artistId), db.flashSheet.findMany({ where: artistId ? { artistId } : {}, include: { artist: { select: { displayName: true } }, _count: { select: { designs: true } } }, orderBy: { createdAt: "desc" } })]);
  const live = rows.filter((r) => r.status !== "RETIRED");
  const retired = rows.filter((r) => r.status === "RETIRED");
  const row = (d: (typeof rows)[number]) => <tr key={d.id}><td><div className="flex items-center gap-3"><DesignImage src={signedUrl(d.imageKey, 3600)} alt="" hotspot={{ x: d.hotspotX, y: d.hotspotY, w: d.hotspotW, h: d.hotspotH }} className="w-12 h-12 rounded-lg shrink-0" /><div><Link href={`${basePath}/${d.id}`} className="underline">{d.title}</Link><br /><span className="text-xs opacity-60">{d.theme ?? ""}{d.sheet ? ` · ${d.sheet.title}` : ""} · {d.collection.toLowerCase()}</span></div></div></td><td>{d.artist.displayName}</td><td>{formatPence(d.prices.small)}{settings.palmEnabled ? ` / ${formatPence(d.prices.palm)}` : ""}{d.priceSmallPence == null && d.pricePalmPence == null ? <span className="block text-xs opacity-60">default</span> : null}</td><td>{d.prices.apprenticeSmall != null ? `${formatPence(d.prices.apprenticeSmall)}${settings.palmEnabled ? ` / ${formatPence(d.prices.apprenticePalm ?? 0)}` : ""}` : "—"}</td><td>{d.repeatable ? "repeatable" : "one-off"}</td><td><span className={`badge ${d.status === "AVAILABLE" ? "badge-acid" : d.status === "HELD" ? "badge-warn" : "badge-muted"}`}>{d.status.toLowerCase()}</span></td><td>{d.status !== "RETIRED" && <RetireButton id={d.id} />}</td></tr>;
  const gbp = (p: number) => `£${(p / 100).toFixed(0)}`;
  const artistSlugs = [...new Set(rows.map((r) => r.artist.slug))];
  return (<>
    <PageHeader title={artistId ? "My flash" : "Flash catalogue"} intro={`Defaults: ${gbp(settings.smallPence)} up to ${settings.smallMaxCm} cm${settings.palmEnabled ? ` / Palm ${gbp(settings.palmPence)}` : ""}, apprentice ${gbp(settings.apprenticeSmallPence)}${settings.palmEnabled ? ` / ${gbp(settings.apprenticePalmPence)}` : ""}. ${canBulk ? "Change defaults under Settings; every design without its own price follows them." : "Leave a price blank to follow the studio default."}`} actions={<><Link href={`${basePath}/new`} className="btn btn-primary">Add design</Link><Link href={`${basePath}/sheets/new`} className="btn btn-secondary">Upload a sheet</Link></>} />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"><Stat label="Live designs" value={live.length} /><Stat label="One-offs still available" value={live.filter((r) => !r.repeatable && r.status === "AVAILABLE").length} /><Stat label="Booked one-offs" value={rows.filter((r) => r.status === "BOOKED").length} /></div>
    {canBulk && <div className="mb-6"><BulkPriceForm /></div>}
    <section className="card p-4 mb-6">
      <h2 className="text-xl font-bold mb-2">Shareable sheets with prices</h2>
      <p className="text-sm opacity-80 mb-2">Rendered from the live catalogue, so prices are always current. Instagram feed 1080×1350, story 1080×1920, and an A4 PDF for the studio wall, each with a QR code to the design.</p>
      <ul className="text-sm space-y-1">{artistSlugs.map((slug) => { const name = rows.find((r) => r.artist.slug === slug)!.artist.displayName; return <li key={slug}><strong>{name}:</strong> <a className="underline" href={`/api/flash/sheet-image?artist=${slug}&format=feed`} target="_blank" rel="noreferrer">feed image</a> · <a className="underline" href={`/api/flash/sheet-image?artist=${slug}&format=story`} target="_blank" rel="noreferrer">story image</a> · <a className="underline" href={`/api/flash/sheet-pdf?artist=${slug}`} target="_blank" rel="noreferrer">A4 PDF</a></li>; })}{artistSlugs.length === 0 && <li className="opacity-60">Add designs first.</li>}</ul>
    </section>
    {sheets.length > 0 && <section className="card p-4 mb-6"><h2 className="text-xl font-bold mb-2">Uploaded sheets</h2><ul className="text-sm space-y-1">{sheets.map((s) => <li key={s.id}><Link href={`${basePath}/sheets/${s.id}`} className="underline">{s.title}</Link> · {s.artist.displayName} · {s._count.designs} design{s._count.designs === 1 ? "" : "s"} marked</li>)}</ul></section>}
    <table className="data"><thead><tr><th>Design</th><th>Artist</th><th>{settings.palmEnabled ? "Small / Palm" : "Price"}</th><th>Apprentice</th><th>Type</th><th>Status</th><th></th></tr></thead><tbody>
      {live.map(row)}
      {live.length === 0 && <tr><td colSpan={7} className="opacity-60">No designs yet.</td></tr>}
    </tbody></table>
    {retired.length > 0 && <details className="mt-6"><summary className="cursor-pointer font-semibold">Retired designs ({retired.length}): off the site, kept on record</summary><table className="data mt-2"><thead><tr><th>Design</th><th>Artist</th><th>{settings.palmEnabled ? "Small / Palm" : "Price"}</th><th>Apprentice</th><th>Type</th><th>Status</th><th></th></tr></thead><tbody>{retired.map(row)}</tbody></table></details>}
  </>);
}
