import { requirePrincipal } from "@/lib/session";
import { stockOverview } from "@/lib/inventory";
import { retailSales } from "@/lib/retail";
import { PageHeader, Stat, Empty } from "@/components/ui";
import { RetailSaleForm } from "@/components/retail-sale-form";
import { formatPence } from "@/lib/money";
import { formatStudio } from "@/lib/time";

export default async function SalesPage() {
  const p = await requirePrincipal("/studio/sales");
  if (!p.artistProfileId) return <Empty>No practitioner profile on this account.</Empty>;
  const [stock, sales] = await Promise.all([stockOverview(), retailSales(p.artistProfileId)]);
  const sellable = stock.filter((s) => s.category === "jewellery" || s.category === "aftercare_retail");
  const total = sales.reduce((s, x) => s + x.totalPence, 0);
  return (<>
    <PageHeader title="Jewellery and retail sales" intro="Log every piece of jewellery or aftercare product you sell. Stock comes down automatically and the sale goes to the studio ledger." />
    <div className="grid sm:grid-cols-2 gap-4 mb-6"><Stat label="Sales logged" value={sales.length} /><Stat label="Total value" value={formatPence(total)} hint="Gross retail, before any split" /></div>
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="card p-5"><h2 className="text-xl font-bold mb-2">Record a sale</h2>{sellable.length === 0 ? <p className="opacity-60">No jewellery or retail products in stock. Ask the owner to add some under Stock.</p> : <RetailSaleForm practitionerId={p.artistProfileId} products={sellable.map((s) => ({ id: s.id, name: s.name, onHand: s.onHand, retailPence: s.retailPence }))} />}</section>
      <section className="card p-5"><h2 className="text-xl font-bold mb-2">Recent sales</h2><table className="data"><thead><tr><th>When</th><th>Item</th><th>Qty</th><th>Total</th><th>Paid</th></tr></thead><tbody>{sales.map((s) => <tr key={s.id}><td>{formatStudio(s.createdAt, "dd/MM HH:mm")}</td><td>{s.product.name}{s.clientName ? <span className="hint block">{s.clientName}</span> : null}</td><td>{s.quantity}</td><td>{formatPence(s.totalPence)}</td><td>{s.method.replace("_", " ").toLowerCase()}</td></tr>)}{sales.length === 0 && <tr><td colSpan={5} className="opacity-60">Nothing yet.</td></tr>}</tbody></table></section>
    </div>
  </>);
}
