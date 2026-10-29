import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { allPromotions } from "@/lib/promotions";
import { PageHeader } from "@/components/ui";
import { PromotionForm, EndPromotionButton } from "@/components/promotion-forms";
import { formatStudio } from "@/lib/time";

export default async function OwnerPromotions() {
  await requireCapability("roster.manage");
  const [artists, promos] = await Promise.all([db.artistProfile.findMany({ where: { isPublished: true }, orderBy: { displayName: "asc" }, select: { id: true, displayName: true } }), allPromotions()]);
  return (<>
    <PageHeader title="Promotions" intro="Studio-wide offers show as a banner on every public page. Artist offers put a ribbon on that artist's card and page. Every offer is dated, and the desk can see all of them under Ask the desk." />
    <div className="grid lg:grid-cols-2 gap-6">
      <section><h2 className="text-xl font-bold mb-2">New promotion</h2><PromotionForm artists={artists} /></section>
      <section className="card p-5">
        <h2 className="text-xl font-bold mb-2">All promotions</h2>
        <table className="data"><thead><tr><th>Offer</th><th>For</th><th>When</th><th>Status</th><th></th></tr></thead><tbody>
          {promos.map((p) => <tr key={p.id}><td><strong>{p.title}</strong>{p.code ? <span className="block text-xs">code {p.code}</span> : null}{p.details ? <span className="block text-xs opacity-70">{p.details}</span> : null}{!p.showOnPublic && <span className="badge badge-muted mt-1">desk only</span>}</td><td>{p.scope === "STUDIO" ? "Whole studio" : p.artist?.displayName}</td><td className="text-xs">{formatStudio(p.startsAt, "dd/MM/yy")} → {p.endsAt ? formatStudio(p.endsAt, "dd/MM/yy") : "open"}</td><td><span className={`badge ${p.state === "live" ? "badge-acid" : p.state === "scheduled" ? "badge-warn" : "badge-muted"}`}>{p.state}</span></td><td>{p.state !== "ended" && <EndPromotionButton id={p.id} />}</td></tr>)}
          {promos.length === 0 && <tr><td colSpan={5} className="opacity-60">No promotions yet.</td></tr>}
        </tbody></table>
      </section>
    </div>
  </>);
}
