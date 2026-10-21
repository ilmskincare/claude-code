import Link from "next/link";
import { DesignImage } from "./design-image";
import { signedUrl } from "@/lib/storage";

const gbp = (p: number) => `£${(p / 100).toFixed(0)}`;
export type TileDesign = { id: string; title: string; imageKey: string; theme: string | null; repeatable: boolean; isBooked: boolean; isHeld: boolean; colourMode: string; hotspotX: number | null; hotspotY: number | null; hotspotW: number | null; hotspotH: number | null; artist: { displayName: string; slug: string }; prices: { small: number; palm: number; apprenticeSmall: number | null; apprenticePalm: number | null } };

export function FlashTile({ d }: { d: TileDesign }) {
  return (
    <li className="card overflow-hidden relative flex flex-col">
      <Link href={`/flash/${d.id}`} className="block">
        <DesignImage src={signedUrl(d.imageKey, 3600)} alt={`${d.title} by ${d.artist.displayName}`} hotspot={{ x: d.hotspotX, y: d.hotspotY, w: d.hotspotW, h: d.hotspotH }} className={`aspect-square w-full ${d.isBooked ? "opacity-50 grayscale" : ""}`} />
      </Link>
      <div className="p-3 text-sm flex-1 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2"><Link href={`/flash/${d.id}`} className="font-bold hover:underline">{d.title}</Link>{d.isBooked ? <span className="badge badge-muted">Booked</span> : d.repeatable ? <span className="badge badge-outline">Repeatable</span> : <span className="badge badge-acid">One-off</span>}</div>
        <p className="opacity-75"><Link href={`/artists/${d.artist.slug}`} className="hover:underline">{d.artist.displayName}</Link>{d.theme ? ` · ${d.theme}` : ""}{d.colourMode === "COLOUR" ? " · colour" : ""}</p>
        <p className="mt-auto"><span className="badge badge-outline mr-1">Small {gbp(d.prices.small)}</span><span className="badge badge-outline">Palm {gbp(d.prices.palm)}</span>{d.prices.apprenticeSmall != null && <span className="badge badge-acid ml-1">Apprentice from {gbp(d.prices.apprenticeSmall)}</span>}</p>
      </div>
    </li>
  );
}
