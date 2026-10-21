import Link from "next/link";
import { requireCapability } from "@/lib/session";
import { stockOverview } from "@/lib/inventory";
import { PageHeader, Stat } from "@/components/ui";
import { formatPence } from "@/lib/money";

export default async function StockPage() {
  await requireCapability("stock.view");
  const items = await stockOverview();
  const low = items.filter((i) => i.isLow).length, expiring = items.reduce((s, i) => s + i.expiringLots, 0), expired = items.reduce((s, i) => s + i.expiredLots, 0);
  return (<>
    <PageHeader title="Stock" intro="Everything the studio holds: inks, needles, barriers, dressings, jewellery and retail. Issue to artists under their arrangement, or sell to them and the ledger tracks what they owe." actions={<Link href="/owner/stock/new" className="btn btn-primary">Add product</Link>} />
    <div className="grid grid-cols-3 gap-4 mb-6"><Stat label="Products" value={items.length} /><Stat label="At or below reorder level" value={low} /><Stat label="Lots expiring in 60 days" value={expiring} hint={expired ? `${expired} already expired` : undefined} /></div>
    <table className="data"><thead><tr><th>Product</th><th>Category</th><th>On hand</th><th>Reorder at</th><th>Cost</th><th>Artist price</th><th>Flags</th></tr></thead><tbody>
      {items.map((i) => <tr key={i.id}><td><Link href={`/owner/stock/${i.id}`} className="underline">{i.name}</Link><br /><span className="text-xs opacity-60">{i.sku}{i.brand ? ` · ${i.brand}` : ""}{i.supplier ? ` · ${i.supplier.name}` : ""}</span></td><td>{i.category.replace("_", " ")}</td><td><strong>{i.onHand}</strong> {i.unit}</td><td>{i.reorderLevel}</td><td>{i.costPence != null ? formatPence(i.costPence) : "—"}</td><td>{i.retailPence != null ? formatPence(i.retailPence) : "—"}</td><td className="space-x-1">{i.isLow && <span className="badge badge-warn">Low</span>}{i.expiredLots > 0 && <span className="badge badge-danger">Expired lot</span>}{!i.expiredLots && i.expiringLots > 0 && <span className="badge badge-warn">Expiring</span>}</td></tr>)}
      {items.length === 0 && <tr><td colSpan={7} className="opacity-60">No products yet.</td></tr>}
    </tbody></table>
  </>);
}
