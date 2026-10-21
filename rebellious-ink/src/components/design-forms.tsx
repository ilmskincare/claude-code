/* eslint-disable @next/next/no-img-element -- signed, short-lived URLs */
"use client";
import { useActionState, useRef, useState } from "react";
import { saveDesignAction, uploadSheetAction, addHotspotAction, bulkPriceAction, retireDesignAction } from "@/app/actions/flash";
import { Alert } from "./ui";

type Artist = { id: string; displayName: string };
type D = { id?: string; title?: string; theme?: string | null; colourMode?: string; collection?: string; priceSmallPence?: number | null; pricePalmPence?: number | null; apprenticeAvailable?: boolean; apprenticeSmallPence?: number | null; apprenticePalmPence?: number | null; repeatable?: boolean; editionSize?: number | null; funLine?: string | null; artistId?: string; imageUrl?: string | null };
const COLLECTIONS = ["CATALOGUE", "GUMBALL", "TAROT", "CLAW", "DROP", "ADVENT", "NEEDLE_TOWN"];
const pounds = (p?: number | null) => (p != null ? (p / 100).toFixed(2) : "");

export function DesignForm({ artists, fixedArtistId, design, defaults }: { artists: Artist[]; fixedArtistId?: string; design?: D; defaults: { small: number; palm: number; apprenticeSmall: number; apprenticePalm: number } }) {
  const [state, action, pending] = useActionState(saveDesignAction, undefined);
  const v = design ?? {};
  return (
    <form action={action} className="card p-5 space-y-3" encType="multipart/form-data">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Saved.</Alert>}
      {v.id && <input type="hidden" name="id" value={v.id} />}
      {fixedArtistId ? <input type="hidden" name="artistId" value={fixedArtistId} /> : <div><label className="field" htmlFor="artistId">Artist</label><select id="artistId" name="artistId" className="select" defaultValue={v.artistId ?? ""}>{artists.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}</select></div>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="field" htmlFor="title">Title</label><input id="title" name="title" className="input" defaultValue={v.title ?? ""} required maxLength={80} /></div>
        <div><label className="field" htmlFor="theme">Theme</label><input id="theme" name="theme" className="input" defaultValue={v.theme ?? ""} placeholder="e.g. botanical, celestial, blackwork" list="themes" /></div>
        <div><label className="field" htmlFor="colourMode">Colour</label><select id="colourMode" name="colourMode" className="select" defaultValue={v.colourMode ?? "BLACK"}><option value="BLACK">Black</option><option value="COLOUR">Colour</option></select></div>
        <div><label className="field" htmlFor="collection">Collection</label><select id="collection" name="collection" className="select" defaultValue={v.collection ?? "CATALOGUE"}>{COLLECTIONS.map((c) => <option key={c} value={c}>{c.replace("_", " ").toLowerCase()}</option>)}</select></div>
        <div><label className="field" htmlFor="priceSmall">Small price (£, blank = default £{(defaults.small / 100).toFixed(0)})</label><input id="priceSmall" name="priceSmall" type="number" step="0.01" min={0} className="input" defaultValue={pounds(v.priceSmallPence)} /></div>
        <div><label className="field" htmlFor="pricePalm">Palm price (£, blank = default £{(defaults.palm / 100).toFixed(0)})</label><input id="pricePalm" name="pricePalm" type="number" step="0.01" min={0} className="input" defaultValue={pounds(v.pricePalmPence)} /></div>
        <div className="sm:col-span-2 grid sm:grid-cols-3 gap-3 card p-3 bg-surface-muted">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="apprenticeAvailable" defaultChecked={v.apprenticeAvailable ?? false} /> Offer at apprentice tier (supervised)</label>
          <div><label className="field" htmlFor="apprenticeSmall">Apprentice small (£, blank = £{(defaults.apprenticeSmall / 100).toFixed(0)})</label><input id="apprenticeSmall" name="apprenticeSmall" type="number" step="0.01" min={0} className="input" defaultValue={pounds(v.apprenticeSmallPence)} /></div>
          <div><label className="field" htmlFor="apprenticePalm">Apprentice palm (£, blank = £{(defaults.apprenticePalm / 100).toFixed(0)})</label><input id="apprenticePalm" name="apprenticePalm" type="number" step="0.01" min={0} className="input" defaultValue={pounds(v.apprenticePalmPence)} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="repeatable" defaultChecked={v.repeatable ?? true} /> Repeatable (untick for a one-off that retires once booked)</label>
        <div><label className="field" htmlFor="editionSize">Edition size (Needle Town, optional)</label><input id="editionSize" name="editionSize" type="number" min={1} className="input" defaultValue={v.editionSize ?? ""} /></div>
        <div className="sm:col-span-2"><label className="field" htmlFor="funLine">Fun line for the tarot reveal (optional, no fortune-telling claims)</label><input id="funLine" name="funLine" className="input" maxLength={120} defaultValue={v.funLine ?? ""} /></div>
        <div className="sm:col-span-2 flex gap-4 items-start">
          {v.imageUrl && <img src={v.imageUrl} alt="" className="w-24 h-24 rounded-lg object-cover border border-graphite" />}
          <div className="flex-1"><label className="field" htmlFor="image">{v.id ? "Replace image (optional)" : "Design image"}</label><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input" required={!v.id} /><p className="hint">Original artwork only. No film, cartoon, game or brand characters.</p></div>
        </div>
      </div>
      <datalist id="themes"><option value="botanical" /><option value="old-school" /><option value="celestial" /><option value="blackwork" /><option value="fine line" /><option value="lettering" /><option value="animals" /><option value="luck" /></datalist>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : v.id ? "Save changes" : "Add design"}</button>
    </form>
  );
}

export function SheetUploadForm({ artists, fixedArtistId }: { artists: Artist[]; fixedArtistId?: string }) {
  const [state, action, pending] = useActionState(uploadSheetAction, undefined);
  return (
    <form action={action} className="card p-5 space-y-3" encType="multipart/form-data">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {fixedArtistId ? null : <div><label className="field" htmlFor="sartistId">Artist</label><select id="sartistId" name="artistId" className="select">{artists.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}</select></div>}
      <div><label className="field" htmlFor="stitle">Sheet title</label><input id="stitle" name="title" className="input" required maxLength={80} placeholder="e.g. Autumn flash sheet 1" /></div>
      <div><label className="field" htmlFor="simage">Sheet image</label><input id="simage" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input" required /></div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Uploading…" : "Upload sheet, then mark the designs"}</button>
    </form>
  );
}

/** Drag a box over each design on the sheet, name it, add. Coordinates are percentages so any screen works. */
export function HotspotEditor({ sheetId, imageUrl, existing }: { sheetId: string; imageUrl: string; existing: { id: string; title: string; x: number; y: number; w: number; h: number }[] }) {
  const [state, action, pending] = useActionState(addHotspotAction, undefined);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const pct = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return { x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) }; };
  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div ref={ref} className="relative select-none touch-none cursor-crosshair" onPointerDown={(e) => { start.current = pct(e); setBox({ ...start.current, w: 0, h: 0 }); (e.target as Element).setPointerCapture?.(e.pointerId); }} onPointerMove={(e) => { if (!start.current) return; const p = pct(e); setBox({ x: Math.min(start.current.x, p.x), y: Math.min(start.current.y, p.y), w: Math.abs(p.x - start.current.x), h: Math.abs(p.y - start.current.y) }); }} onPointerUp={() => { start.current = null; }}>
        <img src={imageUrl} alt="Flash sheet" className="w-full h-auto rounded-lg" draggable={false} />
        {existing.map((d, i) => <div key={d.id} className="absolute border-2 border-acid/70 rounded" style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, height: `${d.h}%` }}><span className="absolute -top-3 -left-1 badge badge-acid">{i + 1}</span></div>)}
        {box && box.w > 0 && <div className="absolute border-2 border-dashed border-bone bg-acid/20 rounded" style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }} />}
      </div>
      <form action={action} className="card p-4 space-y-2 h-fit">
        <p className="hint">Drag a box around a design on the sheet, then name it.</p>
        {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Added. Drag the next one.</Alert>}
        <input type="hidden" name="sheetId" value={sheetId} />
        {(["x", "y", "w", "h"] as const).map((k) => <input key={k} type="hidden" name={k} value={box ? box[k].toFixed(2) : ""} />)}
        <div><label className="field" htmlFor="htitle">Design title</label><input id="htitle" name="title" className="input" required maxLength={80} /></div>
        <div><label className="field" htmlFor="htheme">Theme</label><input id="htheme" name="theme" className="input" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="apprenticeAvailable" /> Apprentice tier</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="repeatable" defaultChecked /> Repeatable</label>
        <p className="text-xs opacity-70">{box && box.w > 1 ? `Box: ${box.w.toFixed(0)}% × ${box.h.toFixed(0)}%` : "No box drawn yet"}</p>
        <button className="btn btn-primary" disabled={pending || !box || box.w < 1 || box.h < 1}>Add design from sheet</button>
      </form>
    </div>
  );
}

export function BulkPriceForm() {
  const [state, action, pending] = useActionState(bulkPriceAction, undefined);
  return (
    <form action={action} className="card p-4 space-y-2">
      <h3 className="font-bold">Bulk adjust overrides</h3>
      {state?.error && <Alert tone={state.ok ? "success" : "danger"}>{state.error}</Alert>}
      <div className="flex flex-wrap gap-2 items-end">
        <div><label className="field" htmlFor="bsize">Size</label><select id="bsize" name="size" className="select"><option value="small">Small</option><option value="palm">Palm</option></select></div>
        <div><label className="field" htmlFor="delta">Change (£, negative to lower)</label><input id="delta" name="deltaPounds" type="number" step="1" className="input" placeholder="10" required /></div>
        <button className="btn btn-secondary" disabled={pending}>Apply</button>
      </div>
      <p className="hint">Only designs with their own price move. Designs on the default follow the default in Settings.</p>
    </form>
  );
}

export function RetireButton({ id }: { id: string }) {
  return <form action={retireDesignAction}><input type="hidden" name="id" value={id} /><button className="underline text-sm text-danger">Retire</button></form>;
}
