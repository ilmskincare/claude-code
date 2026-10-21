import { requireCapability } from "@/lib/session";
import { retailSales } from "@/lib/retail";
import { PageHeader, BackLink, Stat } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { formatStudio } from "@/lib/time";

export default async function RetailReport() {
  await requireCapability("finance.view_studio");
  const sales = await retailSales(undefined, 300);
  const total = sales.reduce((s, x) => s + x.totalPence, 0);
  const byPractitioner = Object.values(sales.reduce<Record<string, { name: string; count: number; totalPence: number }>>((acc, s) => { const k = s.practitionerId; acc[k] ??= { name: s.practitioner.displayName, count: 0, totalPence: 0 }; acc[k].count++; acc[k].totalPence += s.totalPence; return acc; }, {}));
  return (<>
    <BackLink href="/owner/stock">Stock</BackLink>
    <PageHeader title="Jewellery and retail sales" intro="Everything sold to clients from stock, by practitioner. Posted to the ledger as STOCK_SALES; the practitioner's share is settled under their arrangement." />
    <div className="grid sm:grid-cols-3 gap-4 mb-6"><Stat label="Sales" value={sales.length} /><Stat label="Gross value" value={formatPence(total)} />{byPractitioner.map((b) => <Stat key={b.name} label={b.name} value={formatPence(b.totalPence)} hint={`${b.count} sale${b.count === 1 ? "" : "s"}`} />)}</div>
    <table className="data"><thead><tr><th>When</th><th>Practitioner</th><th>Item</th><th>Qty</th><th>Total</th><th>Paid</th><th>Client</th></tr></thead><tbody>{sales.map((s) => <tr key={s.id}><td>{formatStudio(s.createdAt, "dd/MM/yy HH:mm")}</td><td>{s.practitioner.displayName}</td><td>{s.product.name}</td><td>{s.quantity}</td><td>{formatPence(s.totalPence)}</td><td>{s.method.replace("_", " ").toLowerCase()}</td><td className="text-xs">{s.clientName ?? ""}</td></tr>)}</tbody></table>
  </>);
}
