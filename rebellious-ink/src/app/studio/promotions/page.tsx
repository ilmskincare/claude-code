import { requirePrincipal } from "@/lib/session";
import { allPromotions } from "@/lib/promotions";
import { PageHeader, Empty } from "@/components/ui";
import { PromotionForm, EndPromotionButton } from "@/components/promotion-forms";
import { formatStudio } from "@/lib/time";

export default async function MyPromotions() {
  const p = await requirePrincipal("/studio/promotions");
  if (!p.artistProfileId) return <Empty>No practitioner profile on this account.</Empty>;
  const promos = await allPromotions(p.artistProfileId);
  return (<>
    <PageHeader title="My promotions" intro="A live promotion puts a ribbon on your card and your public page, and the desk can see it when clients call. Keep the ribbon text short; put the terms in the details." />
    <div className="grid lg:grid-cols-2 gap-6">
      <section><h2 className="text-xl font-bold mb-2">New promotion</h2><PromotionForm artists={[]} fixedArtistId={p.artistProfileId} /></section>
      <section className="card p-5">
        <h2 className="text-xl font-bold mb-2">Your promotions</h2>
        <ul className="space-y-3">
          {promos.map((x) => <li key={x.id} className="flex items-start justify-between gap-3 border-b border-graphite pb-2"><div><strong>{x.title}</strong> <span className={`badge ml-2 ${x.state === "live" ? "badge-acid" : x.state === "scheduled" ? "badge-warn" : "badge-muted"}`}>{x.state}</span><p className="text-xs opacity-70">{formatStudio(x.startsAt, "dd/MM/yy")} → {x.endsAt ? formatStudio(x.endsAt, "dd/MM/yy") : "open"}{x.code ? ` · code ${x.code}` : ""}</p>{x.details && <p className="text-sm mt-1">{x.details}</p>}</div>{x.state !== "ended" && <EndPromotionButton id={x.id} />}</li>)}
          {promos.length === 0 && <li className="opacity-60">None yet.</li>}
        </ul>
      </section>
    </div>
  </>);
}
