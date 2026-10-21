import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { Calculator } from "./calculator";

export default async function Artists() {
  const [artists, overhead] = await Promise.all([
    db.artistProfile.findMany({ include: { user: { include: { memberships: { include: { compensationModels: { orderBy: { effectiveFrom: "desc" } } } } } }, licences: true, insurance: true }, orderBy: { displayName: "asc" } }),
    db.studioSetting.findFirst({ where: { key: "finance.monthlyOverheadsPence" } }),
  ]);
  return (<>
    <PageHeader title="Artists & arrangements" intro="Chair rent, commission and hybrid models are effective-dated: changing a rate never rewrites a past period." />
    <table className="data mb-10"><thead><tr><th>Artist</th><th>Kind</th><th>Current arrangement</th><th>History</th><th>Compliance</th></tr></thead><tbody>{artists.map((a) => { const models = a.user.memberships[0]?.compensationModels ?? []; const cur = models.find((m) => m.effectiveFrom <= new Date() && (!m.effectiveTo || m.effectiveTo >= new Date())); return <tr key={a.id}><td><strong>{a.displayName}</strong><br /><span className="text-xs opacity-60">{a.user.email}</span></td><td>{a.kind.replace("_", " ").toLowerCase()}</td><td>{cur ? (cur.type === "CHAIR_RENT_WEEKLY" ? `Chair rent ${formatPence(cur.weeklyRentPence ?? 0)}/week${cur.vatOnRent ? " + VAT" : ""}` : cur.type === "COMMISSION_SPLIT" || cur.type === "CUSTOM_PERCENTAGE" ? `${cur.artistPercent}% artist / ${cur.studioPercent}% studio` : cur.type.replace(/_/g, " ").toLowerCase()) : <span className="badge badge-warn">none</span>}<br /><span className="text-xs opacity-60">{cur ? `from ${cur.effectiveFrom.toLocaleDateString("en-GB")}` : ""}</span></td><td className="text-xs">{models.length} version{models.length === 1 ? "" : "s"}<br /><Link href={`/owner/artists/${a.id}/hours`} className="underline">Edit hours</Link></td><td className="text-xs">{a.licences.length ? `Licence ${a.licences[0].verifiedAt ? "verified" : "unverified"}` : "No licence on file"}<br />{a.insurance.length ? `Insurance to ${a.insurance[0].expiresAt.toLocaleDateString("en-GB")}` : "No insurance on file"}</td></tr>; })}</tbody></table>
    <Calculator defaultOverheadPence={typeof overhead?.value === "number" ? overhead.value : 200000} />
  </>);
}
