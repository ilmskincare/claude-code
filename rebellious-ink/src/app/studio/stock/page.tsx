import { requirePrincipal } from "@/lib/session";
import { stockOverview, artistStockStatement, artistSupplyTerms } from "@/lib/inventory";
import { PageHeader, Stat, Empty } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { formatStudio } from "@/lib/time";

export default async function StudioStock() {
  const p = await requirePrincipal("/studio/stock");
  if (!p.artistProfileId) return <Empty>No artist profile on this account.</Empty>;
  const [items, st, terms] = await Promise.all([stockOverview(), artistStockStatement(p.artistProfileId), artistSupplyTerms(p.artistProfileId)]);
  return (<>
    <PageHeader title="Studio stock" intro={terms.suppliesIncluded ? "Your arrangement includes studio consumables. Ask the desk to issue what you need; it is recorded against your name." : "Your arrangement does not include consumables. You can buy from studio stock at the artist price; what you owe is shown here."} />
    <div className="grid sm:grid-cols-2 gap-4 mb-6"><Stat label="Your arrangement" value={terms.suppliesIncluded ? "Supplies included" : "Buy from studio"} hint={terms.note ?? undefined} /><Stat label="You owe for stock" value={formatPence(st.owedPence)} /></div>
    <h2 className="text-xl font-bold mb-2">What is in stock</h2>
    <table className="data mb-8"><thead><tr><th>Item</th><th>On hand</th><th>Artist price</th></tr></thead><tbody>{items.map((i) => <tr key={i.id}><td>{i.name}<br /><span className="text-xs opacity-60">{i.category.replace("_", " ")}{i.brand ? ` · ${i.brand}` : ""}</span></td><td>{i.onHand === 0 ? <span className="badge badge-danger">Out</span> : i.isLow ? <span className="badge badge-warn">{i.onHand} left</span> : i.onHand} {i.onHand > 0 ? i.unit : ""}</td><td>{terms.suppliesIncluded ? "included" : i.retailPence != null ? formatPence(i.retailPence) : "ask"}</td></tr>)}</tbody></table>
    <h2 className="text-xl font-bold mb-2">Issued or sold to you</h2>
    <table className="data"><thead><tr><th>When</th><th>Item</th><th>Qty</th><th>How</th><th>Unit price</th></tr></thead><tbody>{st.movements.map((m) => <tr key={m.id}><td>{formatStudio(m.createdAt, "dd/MM/yy")}</td><td>{m.lot.product.name}</td><td>{-m.delta}</td><td>{m.reason === "sold_to_artist" ? "Sold" : "Issued"}</td><td>{m.unitPricePence != null ? formatPence(m.unitPricePence) : "—"}</td></tr>)}{st.movements.length === 0 && <tr><td colSpan={5} className="opacity-60">Nothing yet.</td></tr>}</tbody></table>
  </>);
}
