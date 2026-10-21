/* eslint-disable @next/next/no-img-element -- signed, short-lived URL */
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { PageHeader, BackLink, Stat } from "@/components/ui";
import { ProductForm, ReceiveForm, AdjustForm, IssueForm } from "@/components/stock-forms";
import { formatPence } from "@/lib/money";
import { formatStudio } from "@/lib/time";
import { can } from "@/lib/rbac";
import { signedUrl } from "@/lib/storage";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await requireCapability("stock.view");
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, include: { supplier: true, lots: { orderBy: [{ expiresAt: "asc" }, { receivedAt: "asc" }], include: { movements: { orderBy: { createdAt: "desc" }, take: 50, include: { artist: true } } } } } });
  if (!product) notFound();
  const artists = await db.artistProfile.findMany({ include: { user: { include: { memberships: { include: { compensationModels: { where: { effectiveFrom: { lte: new Date() }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }] }, take: 1 } } } } } }, orderBy: { displayName: "asc" } });
  const onHand = product.lots.reduce((s, l) => s + l.quantity, 0);
  const movements = product.lots.flatMap((l) => l.movements.map((m) => ({ ...m, lotNumber: l.lotNumber }))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 60);
  const manage = can(p, "stock.manage");
  return (<>
    <BackLink href="/owner/stock">Stock</BackLink>
    <PageHeader title={product.name} intro={`${product.sku}${product.brand ? ` · ${product.brand}` : ""}${product.supplier ? ` · ${product.supplier.name}` : ""}`} />
    {product.imageKey && <img src={signedUrl(product.imageKey, 3600)} alt={product.name} className="w-40 h-40 rounded-xl object-cover border border-graphite mb-6" />}
    <div className="grid grid-cols-3 gap-4 mb-6"><Stat label="On hand" value={`${onHand} ${product.unit}`} hint={onHand <= product.reorderLevel ? "At or below reorder level" : undefined} /><Stat label="Cost" value={product.costPence != null ? formatPence(product.costPence) : "—"} /><Stat label="Artist price" value={product.retailPence != null ? formatPence(product.retailPence) : "—"} /></div>
    <div className="grid lg:grid-cols-2 gap-6">
      {manage && <section className="card p-5"><h2 className="text-xl font-bold mb-2">Receive stock</h2><ReceiveForm productId={product.id} /></section>}
      {manage && <section className="card p-5"><h2 className="text-xl font-bold mb-2">Issue or sell to an artist</h2><IssueForm productId={product.id} defaultPricePence={product.retailPence ?? product.costPence} artists={artists.map((a) => ({ id: a.id, displayName: a.displayName, suppliesIncluded: a.user.memberships[0]?.compensationModels[0]?.suppliesIncluded ?? false }))} /></section>}
      {manage && product.lots.some((l) => l.quantity > 0) && <section className="card p-5"><h2 className="text-xl font-bold mb-2">Adjust a lot</h2><AdjustForm productId={product.id} lots={product.lots.filter((l) => l.quantity > 0)} /></section>}
      <section className="card p-5"><h2 className="text-xl font-bold mb-2">Lots</h2><table className="data"><thead><tr><th>Lot</th><th>Expiry</th><th>Qty</th><th>Received</th></tr></thead><tbody>{product.lots.map((l) => <tr key={l.id}><td>{l.lotNumber ?? "—"}</td><td>{l.expiresAt ? l.expiresAt.toLocaleDateString("en-GB") : "—"}</td><td>{l.quantity}</td><td>{formatStudio(l.receivedAt, "dd/MM/yy")}</td></tr>)}</tbody></table></section>
      <section className="card p-5 lg:col-span-2"><h2 className="text-xl font-bold mb-2">Movements</h2><table className="data"><thead><tr><th>When</th><th>Lot</th><th>Change</th><th>Reason</th><th>Artist</th><th>Price</th><th>Note</th></tr></thead><tbody>{movements.map((m) => <tr key={m.id}><td>{formatStudio(m.createdAt, "dd/MM HH:mm")}</td><td>{m.lotNumber ?? "—"}</td><td className={m.delta < 0 ? "text-danger" : "text-acid-bright"}>{m.delta > 0 ? "+" : ""}{m.delta}</td><td>{m.reason.replace(/_/g, " ")}</td><td>{m.artist?.displayName ?? ""}</td><td>{m.unitPricePence != null ? formatPence(m.unitPricePence) : ""}</td><td className="text-xs">{m.note ?? m.reference ?? ""}</td></tr>)}</tbody></table></section>
      {manage && <section className="card p-5 lg:col-span-2"><h2 className="text-xl font-bold mb-2">Edit product</h2><ProductForm product={{ ...product, supplierName: product.supplier?.name ?? "", imageUrl: product.imageKey ? signedUrl(product.imageKey, 3600) : null }} /></section>}
    </div>
  </>);
}
