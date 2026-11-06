import { requireCapability } from "@/lib/session";
import { clientList, CONSENT_SCRIPT } from "@/lib/clients";
import { PageHeader, Stat } from "@/components/ui";
import { DeskClientForm } from "./client-form";
import { formatStudio } from "@/lib/time";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const p = await requireCapability("clients.view_all");
  const { q } = await searchParams;
  const rows = await clientList(p, q);
  const optedIn = rows.filter((r) => r.marketing === "yes").length;
  return (<>
    <PageHeader title="Clients" intro="Everyone who has enquired, booked or been added at the desk. Health answers are never shown here. Marketing is only ever sent to people who said yes, and the answer is recorded with who took it." />
    <div className="grid sm:grid-cols-3 gap-4 mb-6"><Stat label="Clients" value={rows.length} /><Stat label="Opted in to email" value={optedIn} /><Stat label="Not yet asked" value={rows.filter((r) => r.marketing === "not asked").length} hint="Ask at the desk or let the portal ask" /></div>
    <div className="grid lg:grid-cols-[420px_1fr] gap-6 items-start">
      <DeskClientForm consentScript={CONSENT_SCRIPT} />
      <section className="card p-4">
        <form method="get" className="flex gap-2 mb-3"><label className="sr-only" htmlFor="q">Search</label><input id="q" name="q" className="input" placeholder="Search name, email or phone" defaultValue={q ?? ""} /><button className="btn btn-secondary">Search</button></form>
        <table className="data"><thead><tr><th>Client</th><th>Contact</th><th>Since</th><th>Enquiries / bookings</th><th>Email marketing</th></tr></thead><tbody>
          {rows.map((r) => <tr key={r.id}><td><strong>{r.name ?? "—"}</strong></td><td className="text-xs">{r.email}{r.phone ? <><br />{r.phone}</> : null}</td><td className="text-xs">{formatStudio(r.createdAt, "dd/MM/yy")}</td><td>{r.enquiries} / {r.appointments}</td><td><span className={`badge ${r.marketing === "yes" ? "badge-acid" : r.marketing === "no" ? "badge-muted" : "badge-warn"}`}>{r.marketing}</span>{r.marketingSource ? <span className="block text-xs opacity-60">{r.marketingSource.startsWith("desk") ? "at the desk" : r.marketingSource.replace("_", " ")}</span> : null}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={5} className="opacity-60">No clients match.</td></tr>}
        </tbody></table>
      </section>
    </div>
  </>);
}
