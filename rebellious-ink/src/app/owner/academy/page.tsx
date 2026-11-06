import Link from "next/link";
import { requirePrincipal } from "@/lib/session";
import { listApprentices } from "@/lib/academy";
import { PageHeader, Empty } from "@/components/ui";
import { can } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function AcademyList() {
  const p = await requirePrincipal("/owner/academy");
  if (!can(p, "academy.signoff") && !can(p, "studio.manage")) redirect("/forbidden");
  const rows = await listApprentices();
  return (<>
    <PageHeader title="Apprentices" intro="Verify hours, sign off skills, review progression photos, and make the final junior-artist decision." />
    {rows.length === 0 ? <Empty>No active apprentices.</Empty> : <table className="data"><thead><tr><th>Apprentice</th><th>Supervisor</th><th>Verified hours</th><th>Core skills</th><th>Waiting on you</th><th>Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.user.id}><td><Link href={`/owner/academy/${r.user.id}`} className="underline font-semibold">{r.user.name}</Link></td><td>{r.user.artistProfile?.supervisor?.displayName ?? "—"}</td><td>{(r.verifiedMinutes / 60).toFixed(0)} / {r.minMinutes / 60}</td><td>{r.coreCompetent} / {r.coreTotal}</td><td>{r.pendingLogs > 0 && <span className="badge badge-warn mr-1">{r.pendingLogs} hours entries</span>}{r.readyForReview > 0 && <span className="badge badge-warn">{r.readyForReview} skills</span>}</td><td>{r.user.juniorSignoff ? <span className="badge badge-acid">Junior artist</span> : r.verifiedMinutes >= r.minMinutes && r.coreCompetent === r.coreTotal ? <span className="badge badge-acid">Ready for sign-off</span> : <span className="badge badge-muted">In training</span>}</td></tr>)}</tbody></table>}
  </>);
}
