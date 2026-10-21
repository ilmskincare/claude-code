/* eslint-disable @next/next/no-img-element -- signed, short-lived URL */
"use client";
import { useActionState, useState } from "react";
import { recordRetailSaleAction } from "@/app/actions/retail";
import { Alert } from "./ui";

export function RetailSaleForm({ practitionerId, products }: { practitionerId: string; products: { id: string; name: string; onHand: number; retailPence: number | null; imageUrl?: string | null }[] }) {
  const [state, action, pending] = useActionState(recordRetailSaleAction, undefined);
  const [selected, setSelected] = useState(products.find((x) => x.onHand > 0)?.id ?? products[0]?.id);
  const current = products.find((x) => x.id === selected);
  return (
    <form action={action} className="space-y-2">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Sale recorded and stock updated.</Alert>}
      <input type="hidden" name="practitionerId" value={practitionerId} />
      <div className="flex gap-2 overflow-x-auto pb-1">{products.filter((x) => x.imageUrl).map((x) => <button type="button" key={x.id} onClick={() => setSelected(x.id)} className={`shrink-0 rounded-lg border-2 ${selected === x.id ? "border-acid" : "border-transparent"}`} title={x.name} aria-label={`Choose ${x.name}`}><img src={x.imageUrl!} alt="" className="w-16 h-16 rounded-md object-cover" /></button>)}</div>
      {current?.imageUrl && <img src={current.imageUrl} alt={current.name} className="w-28 h-28 rounded-lg object-cover border border-graphite" />}
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2"><label className="field" htmlFor="productId">Item</label><select id="productId" name="productId" className="select" value={selected} onChange={(e) => setSelected(e.target.value)}>{products.map((pr) => <option key={pr.id} value={pr.id} disabled={pr.onHand === 0}>{pr.name} · {pr.onHand} in stock{pr.retailPence != null ? ` · £${(pr.retailPence / 100).toFixed(2)}` : ""}</option>)}</select></div>
        <div><label className="field" htmlFor="quantity">Quantity</label><input id="quantity" name="quantity" type="number" min={1} className="input" defaultValue={1} required /></div>
        <div><label className="field" htmlFor="unitPricePounds">Price each (£)</label><input id="unitPricePounds" name="unitPricePounds" type="number" step="0.01" min={0} className="input" required /></div>
        <div><label className="field" htmlFor="method">Paid by</label><select id="method" name="method" className="select"><option value="CARD_STRIPE">Card</option><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank transfer</option></select></div>
        <div><label className="field" htmlFor="appointmentReference">Booking ref (optional)</label><input id="appointmentReference" name="appointmentReference" className="input" placeholder="RI-2026-000123" /></div>
        <div><label className="field" htmlFor="clientName">Client name (optional)</label><input id="clientName" name="clientName" className="input" /></div>
        <div><label className="field" htmlFor="clientEmail">Client email (optional)</label><input id="clientEmail" name="clientEmail" type="email" className="input" /></div>
        <div className="col-span-2"><label className="field" htmlFor="note">Note</label><input id="note" name="note" className="input" placeholder="e.g. 16g titanium labret upgrade" /></div>
      </div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Record sale"}</button>
    </form>
  );
}
