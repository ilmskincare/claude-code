"use client";
import { useActionState } from "react";
import { saveProductAction, receiveStockAction, adjustStockAction, issueStockAction, artistStockPaymentAction } from "@/app/actions/inventory";
import { Alert } from "./ui";

const CATS = ["ink", "needle", "cartridge", "glove", "barrier", "cleaning", "dressing", "transfer_paper", "sterilisation", "jewellery", "aftercare_retail", "other"];
type P = { id?: string; sku?: string; name?: string; category?: string; brand?: string | null; colour?: string | null; unit?: string; reorderLevel?: number; costPence?: number | null; retailPence?: number | null; supplierName?: string | null; material?: string | null; gauge?: string | null; length?: string | null };

export function ProductForm({ product }: { product?: P }) {
  const [state, action, pending] = useActionState(saveProductAction, undefined);
  const v = product ?? {};
  return (
    <form action={action} className="card p-5 space-y-3">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Saved.</Alert>}
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="field" htmlFor="sku">SKU</label><input id="sku" name="sku" className="input" defaultValue={v.sku ?? ""} required /></div>
        <div><label className="field" htmlFor="name">Name</label><input id="name" name="name" className="input" defaultValue={v.name ?? ""} required /></div>
        <div><label className="field" htmlFor="category">Category</label><select id="category" name="category" className="select" defaultValue={v.category ?? "ink"}>{CATS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}</select></div>
        <div><label className="field" htmlFor="brand">Brand</label><input id="brand" name="brand" className="input" defaultValue={v.brand ?? ""} /></div>
        <div><label className="field" htmlFor="colour">Colour / variant</label><input id="colour" name="colour" className="input" defaultValue={v.colour ?? ""} /></div>
        <div><label className="field" htmlFor="unit">Unit</label><input id="unit" name="unit" className="input" defaultValue={v.unit ?? "each"} /></div>
        <div><label className="field" htmlFor="reorderLevel">Reorder when at or below</label><input id="reorderLevel" name="reorderLevel" type="number" min={0} className="input" defaultValue={v.reorderLevel ?? 0} /></div>
        <div><label className="field" htmlFor="supplierName">Supplier</label><input id="supplierName" name="supplierName" className="input" defaultValue={v.supplierName ?? ""} /></div>
        <div><label className="field" htmlFor="costPounds">Cost to studio (£ per unit)</label><input id="costPounds" name="costPounds" type="number" step="0.01" min={0} className="input" defaultValue={v.costPence != null ? (v.costPence / 100).toFixed(2) : ""} /></div>
        <div><label className="field" htmlFor="artistPricePounds">Artist price (£ per unit, when sold)</label><input id="artistPricePounds" name="artistPricePounds" type="number" step="0.01" min={0} className="input" defaultValue={v.retailPence != null ? (v.retailPence / 100).toFixed(2) : ""} /></div>
        <div><label className="field" htmlFor="material">Jewellery material</label><input id="material" name="material" className="input" defaultValue={v.material ?? ""} placeholder="e.g. ASTM F-136 titanium" /></div>
        <div className="grid grid-cols-2 gap-2"><div><label className="field" htmlFor="gauge">Gauge</label><input id="gauge" name="gauge" className="input" defaultValue={v.gauge ?? ""} /></div><div><label className="field" htmlFor="length">Length</label><input id="length" name="length" className="input" defaultValue={v.length ?? ""} /></div></div>
      </div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : v.id ? "Save changes" : "Create product"}</button>
    </form>
  );
}

export function ReceiveForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(receiveStockAction, undefined);
  return (
    <form action={action} className="space-y-2">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Stock received.</Alert>}
      <input type="hidden" name="productId" value={productId} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="field" htmlFor="quantity">Quantity</label><input id="quantity" name="quantity" type="number" min={1} className="input" required /></div>
        <div><label className="field" htmlFor="lotNumber">Lot / batch</label><input id="lotNumber" name="lotNumber" className="input" /></div>
        <div><label className="field" htmlFor="expiresAt">Expiry</label><input id="expiresAt" name="expiresAt" type="date" className="input" /></div>
        <div><label className="field" htmlFor="reference">Delivery / PO ref</label><input id="reference" name="reference" className="input" /></div>
      </div>
      <button className="btn btn-primary" disabled={pending}>Receive</button>
    </form>
  );
}

export function AdjustForm({ productId, lots }: { productId: string; lots: { id: string; lotNumber: string | null; quantity: number }[] }) {
  const [state, action, pending] = useActionState(adjustStockAction, undefined);
  return (
    <form action={action} className="space-y-2">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Adjusted.</Alert>}
      <input type="hidden" name="productId" value={productId} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="field" htmlFor="lotId">Lot</label><select id="lotId" name="lotId" className="select">{lots.map((l) => <option key={l.id} value={l.id}>{l.lotNumber ?? l.id.slice(0, 6)} · {l.quantity} left</option>)}</select></div>
        <div><label className="field" htmlFor="delta">Change (+/−)</label><input id="delta" name="delta" type="number" className="input" required /></div>
        <div><label className="field" htmlFor="reason">Reason</label><select id="reason" name="reason" className="select"><option value="used_in_session">Used in session</option><option value="count">Stock count correction</option><option value="shrinkage">Damaged / lost</option><option value="adjustment">Other adjustment</option></select></div>
        <div><label className="field" htmlFor="note">Note (logged)</label><input id="note" name="note" className="input" required minLength={3} /></div>
      </div>
      <button className="btn btn-secondary" disabled={pending}>Adjust</button>
    </form>
  );
}

export function IssueForm({ productId, artists, defaultPricePence }: { productId: string; artists: { id: string; displayName: string; suppliesIncluded: boolean }[]; defaultPricePence: number | null }) {
  const [state, action, pending] = useActionState(issueStockAction, undefined);
  return (
    <form action={action} className="space-y-2">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Stock moved to the artist and recorded.</Alert>}
      <input type="hidden" name="productId" value={productId} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="field" htmlFor="artistId">Artist</label><select id="artistId" name="artistId" className="select">{artists.map((a) => <option key={a.id} value={a.id}>{a.displayName}{a.suppliesIncluded ? " (supplies included)" : " (buys stock)"}</option>)}</select></div>
        <div><label className="field" htmlFor="iquantity">Quantity</label><input id="iquantity" name="quantity" type="number" min={1} className="input" required /></div>
        <div><label className="field" htmlFor="mode">How</label><select id="mode" name="mode" className="select"><option value="sold">Sell to artist</option><option value="issued">Issue under arrangement (no charge)</option></select></div>
        <div><label className="field" htmlFor="unitPricePounds">Unit price if sold (£)</label><input id="unitPricePounds" name="unitPricePounds" type="number" step="0.01" min={0} className="input" defaultValue={defaultPricePence != null ? (defaultPricePence / 100).toFixed(2) : ""} /></div>
      </div>
      <div><label className="field" htmlFor="inote">Note</label><input id="inote" name="note" className="input" /></div>
      <button className="btn btn-primary" disabled={pending}>Record</button>
      <p className="hint">Issuing free of charge is only allowed when the artist&apos;s arrangement includes supplies, unless the owner overrides.</p>
    </form>
  );
}

export function ArtistPaymentForm({ artistId }: { artistId: string }) {
  const [state, action, pending] = useActionState(artistStockPaymentAction, undefined);
  return (
    <form action={action} className="space-y-2">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Payment recorded.</Alert>}
      <input type="hidden" name="artistId" value={artistId} />
      <div className="grid grid-cols-3 gap-2">
        <div><label className="field" htmlFor="amountPounds">Amount (£)</label><input id="amountPounds" name="amountPounds" type="number" step="0.01" min={0.01} className="input" required /></div>
        <div><label className="field" htmlFor="pmethod">Method</label><select id="pmethod" name="method" className="select"><option value="BANK">Bank transfer</option><option value="CASH">Cash</option></select></div>
        <div><label className="field" htmlFor="pnote">Note</label><input id="pnote" name="note" className="input" required /></div>
      </div>
      <button className="btn btn-secondary" disabled={pending}>Record payment received</button>
    </form>
  );
}
