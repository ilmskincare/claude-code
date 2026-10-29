import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePrincipal } from "@/lib/session";
import { listApprentices, mentorScope } from "@/lib/academy";
import { PageHeader, Empty } from "@/components/ui";

/** Mentors and supervising artists reach the apprentices they can sign off from the artist workspace. */
export default async function StudioApprentices() {
  const p = await requirePrincipal("/studio/apprentices");
  const scope = await mentorScope(p);
  if (!scope.any) redirect("/forbidden");
  const rows = (await listApprentices()).filter((r) => scope.all || scope.supervisedUserIds.includes(r.user.id));
  return (<>
    <PageHeader title="Apprentices" intro="Verify hours, sign off skills and review progression photos for the apprentices you mentor." />
    {rows.length === 0 ? <Empty>No apprentices assigned to you yet.</Empty> : <table className="data"><thead><tr><th>Apprentice</th><th>Supervisor</th><th>Verified hours</th><th>Core skills</th><th>Waiting on you</th><th>Status</th><th></th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.user.id}><td><strong>{r.user.name ?? r.user.email}</strong></td><td>{r.user.artistProfile?.supervisor?.displayName ?? "none set"}</td><td>{(r.verifiedMinutes / 60).toFixed(1)} / {r.minMinutes / 60}</td><td>{r.coreCompetent} / {r.coreTotal}</td><td>{r.pendingLogs + r.readyForReview > 0 ? <span className="badge badge-warn">{r.pendingLogs} hours, {r.readyForReview} skills</span> : <span className="opacity-60">nothing</span>}</td><td>{r.user.juniorSignoff ? <span className="badge badge-acid">Junior artist</span> : r.verifiedMinutes >= r.minMinutes && r.coreCompetent === r.coreTotal ? <span className="badge badge-acid">Ready for sign-off</span> : <span className="badge badge-muted">In training</span>}</td><td><Link href={`/studio/apprentices/${r.user.id}`} className="underline">Open</Link></td></tr>)}
    </tbody></table>}
  </>);
}
