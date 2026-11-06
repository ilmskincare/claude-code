import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/session";
import { artistStockStatement, artistSupplyTerms } from "@/lib/inventory";
import { PageHeader, BackLink, Stat, Alert } from "@/components/ui";
import { ArtistPaymentForm } from "@/components/stock-forms";
import { formatPence } from "@/lib/money";
import { formatStudio } from "@/lib/time";
import { can } from "@/lib/rbac";

export default async function ArtistStock({ params }: { params: Promise<{ id: string }> }) {
  const p = await requireCapability("stock.view");
  const { id } = await params;
  const terms = await artistSupplyTerms(id).catch(() => null);
  if (!terms) notFound();
  const st = await artistStockStatement(id);
  return (<>
    <BackLink href="/owner/artists">Artists</BackLink>
    <PageHeader title={`${terms.artist.displayName}: stock account`} />
    <div className="grid sm:grid-cols-2 gap-4 mb-6"><Stat label="Arrangement" value={terms.suppliesIncluded ? "Supplies included" : "Buys from studio"} hint={terms.note ?? undefined} /><Stat label="Owed to studio for stock" value={formatPence(st.owedPence)} /></div>
    {!terms.model && <Alert tone="warn">No current arrangement on file, so supplies default to &ldquo;buys from studio&rdquo;.</Alert>}
    {can(p, "finance.verify_manual_payment") && st.owedPence > 0 && <section className="card p-5 mb-6"><h2 className="text-xl font-bold mb-2">Record a payment from the artist</h2><ArtistPaymentForm artistId={id} /></section>}
    <table className="data"><thead><tr><th>When</th><th>Item</th><th>Qty</th><th>How</th><th>Unit price</th><th>Note</th></tr></thead><tbody>{st.movements.map((m) => <tr key={m.id}><td>{formatStudio(m.createdAt, "dd/MM/yy HH:mm")}</td><td>{m.lot.product.name}</td><td>{-m.delta}</td><td>{m.reason === "sold_to_artist" ? <span className="badge badge-warn">Sold</span> : <span className="badge badge-acid">Issued</span>}</td><td>{m.unitPricePence != null ? formatPence(m.unitPricePence) : "—"}</td><td className="text-xs">{m.note}</td></tr>)}{st.movements.length === 0 && <tr><td colSpan={6} className="opacity-60">Nothing issued or sold yet.</td></tr>}</tbody></table>
  </>);
}
