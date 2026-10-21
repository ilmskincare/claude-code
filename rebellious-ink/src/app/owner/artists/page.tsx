import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { Calculator } from "./calculator";
import { AddTeamMemberForm } from "@/components/team-form";
import { supervisorOptions } from "@/lib/team";

export default async function Artists() {
  const [artists, overhead, stations, supervisors] = await Promise.all([
    db.artistProfile.findMany({ include: { user: { include: { memberships: { include: { compensationModels: { orderBy: { effectiveFrom: "desc" } } } } } }, licences: true, insurance: true }, orderBy: { displayName: "asc" } }),
    db.studioSetting.findFirst({ where: { key: "finance.monthlyOverheadsPence" } }),
    db.station.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    supervisorOptions(),
  ]);
  return (<>
    <PageHeader title="Artists & arrangements" intro="Add artists, piercers, apprentices and desk staff here. Chair rent, commission and hybrid models are effective-dated: changing a rate never rewrites a past period." />
    <div className="mb-8"><AddTeamMemberForm stations={stations} supervisors={supervisors} /></div>
    <table className="data mb-10"><thead><tr><th>Artist</th><th>Kind</th><th>Current arrangement</th><th>History</th><th>Compliance</th></tr></thead><tbody>{artists.map((a) => { const models = a.user.memberships[0]?.compensationModels ?? []; const cur = models.find((m) => m.effectiveFrom <= new Date() && (!m.effectiveTo || m.effectiveTo >= new Date())); return <tr key={a.id}><td><strong>{a.displayName}</strong><br /><span className="text-xs opacity-60">{a.user.email}</span></td><td>{a.kind.replace("_", " ").toLowerCase()}</td><td>{cur ? (cur.type === "CHAIR_RENT_WEEKLY" ? `Chair rent ${formatPence(cur.weeklyRentPence ?? 0)}/week${cur.vatOnRent ? " + VAT" : ""}` : cur.type === "COMMISSION_SPLIT" || cur.type === "CUSTOM_PERCENTAGE" ? `${cur.artistPercent}% artist / ${cur.studioPercent}% studio` : cur.type.replace(/_/g, " ").toLowerCase()) : <span className="badge badge-warn">none</span>}<br /><span className="text-xs opacity-60">{cur ? `from ${cur.effectiveFrom.toLocaleDateString("en-GB")} · ${cur.suppliesIncluded ? "supplies included" : "buys supplies"}` : ""}</span></td><td className="text-xs">{models.length} version{models.length === 1 ? "" : "s"}<br /><Link href={`/owner/artists/${a.id}/profile`} className="underline">Profile & rates</Link> · <Link href={`/owner/artists/${a.id}/hours`} className="underline">Hours</Link> · <Link href={`/owner/artists/${a.id}/stock`} className="underline">Stock account</Link></td><td className="text-xs">{a.licences.length ? `Licence ${a.licences[0].verifiedAt ? "verified" : "unverified"}` : "No licence on file"}<br />{a.insurance.length ? `Insurance to ${a.insurance[0].expiresAt.toLocaleDateString("en-GB")}` : "No insurance on file"}</td></tr>; })}</tbody></table>
    <Calculator defaultOverheadPence={typeof overhead?.value === "number" ? overhead.value : 200000} />
  </>);
}
