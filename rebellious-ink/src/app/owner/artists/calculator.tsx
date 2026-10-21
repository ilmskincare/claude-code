"use client";
import { useState } from "react";
import { chairRentModel, commissionModel, breakEvenSalesPence, studioPosition, WEEKS_PER_MONTH } from "@/lib/finance/calculator";

const gbp = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(p / 100);

export function Calculator({ defaultOverheadPence }: { defaultOverheadPence: number }) {
  const [sales, setSales] = useState(500);
  const [rent, setRent] = useState(200);
  const [pct, setPct] = useState(40);
  const [stations, setStations] = useState(3);
  const [overhead, setOverhead] = useState(defaultOverheadPence / 100);
  const [fee, setFee] = useState(1.5);
  const input = { weeklyEligibleSalesPence: sales * 100, weeklyChairRentPence: rent * 100, studioPercent: pct, activeStations: stations, monthlyOverheadsPence: overhead * 100, cardFeePercent: fee };
  const a = chairRentModel(input), b = commissionModel(input);
  const pa = studioPosition(input, "rent"), pb = studioPosition(input, "commission");
  const be = breakEvenSalesPence(rent * 100, pct);
  return (
    <section className="card p-5">
      <h2 className="text-2xl font-bold">Side-by-side calculator</h2>
      <p className="hint">Illustrative only. Before costs, VAT and fees unless shown. Weekly to monthly uses 52 ÷ 12 = {WEEKS_PER_MONTH.toFixed(3)} weeks.</p>
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        {[["Eligible sales / artist / week (£)", sales, setSales], ["Chair rent / week (£)", rent, setRent], ["Studio share (%)", pct, setPct], ["Active stations", stations, setStations], ["Monthly overheads (£)", overhead, setOverhead], ["Card fee (%)", fee, setFee]].map(([l, v, s]) => <label key={l as string} className="text-sm"><span className="field">{l as string}</span><input type="number" className="input" value={v as number} onChange={(e) => (s as (n: number) => void)(Number(e.target.value))} /></label>)}
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {[["Model A · Fixed chair rent", a, pa, `Artist keeps 100% of sales and pays ${gbp(rent * 100)} rent.`], ["Model B · Commission split", b, pb, `Artist ${100 - pct}% / studio ${pct}% of the defined eligible base.`]].map(([title, m, pos, note]) => { const mm = m as typeof a; const pp = pos as typeof pa; return (
          <div key={title as string} className="card p-4 bg-steel">
            <h3 className="text-lg font-bold">{title as string}</h3><p className="hint">{note as string}</p>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Studio receipts per artist per week</dt><dd className="font-semibold">{gbp(mm.weeklyStudioReceiptsPence)}</dd></div>
              <div className="flex justify-between"><dt>Per artist per month</dt><dd>{gbp(mm.monthlyStudioReceiptsPence)}</dd></div>
              <div className="flex justify-between"><dt>Artist retains per week</dt><dd>{gbp(mm.weeklyArtistRetainedPence)}</dd></div>
              <div className="flex justify-between border-t border-graphite pt-1 mt-1"><dt>Studio gross, {stations} stations / week</dt><dd className="font-semibold">{gbp(pp.weeklyGrossPence)}</dd></div>
              <div className="flex justify-between"><dt>Overheads / week</dt><dd>−{gbp(pp.weeklyOverheadsPence)}</dd></div>
              <div className="flex justify-between"><dt>Card fees / week</dt><dd>−{gbp(pp.weeklyFeesPence)}</dd></div>
              <div className="flex justify-between font-bold"><dt>Net position / week</dt><dd className={pp.weeklyNetPence >= 0 ? "text-acid-bright" : "text-danger"}>{gbp(pp.weeklyNetPence)}</dd></div>
              <div className="flex justify-between"><dt>Net / month</dt><dd>{gbp(pp.monthlyNetPence)}</dd></div>
            </dl>
          </div>); })}
      </div>
      <p className="mt-4 text-sm">Both models give the studio the same gross at <strong>{gbp(be)}</strong> of eligible sales per artist per week. Above that, commission earns the studio more; below it, fixed rent does.</p>
    </section>
  );
}
