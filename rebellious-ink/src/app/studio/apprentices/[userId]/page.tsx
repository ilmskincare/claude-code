import { notFound, redirect } from "next/navigation";
import { requirePrincipal } from "@/lib/session";
import { apprenticeDashboard, canMentor } from "@/lib/academy";
import { viewModel } from "@/lib/academy-view";
import { PageHeader, BackLink, Stat, Alert } from "@/components/ui";
import { SkillsBoard, HoursTable, EvidenceGrid, JuniorSignoffForm } from "@/components/academy";
import { can } from "@/lib/rbac";

/** The same review screen the owner has, reachable from the artist workspace for mentors and supervisors. */
export default async function StudioApprenticeReview({ params }: { params: Promise<{ userId: string }> }) {
  const p = await requirePrincipal();
  const { userId } = await params;
  if (!(await canMentor(p, userId))) redirect("/forbidden");
  const d = await apprenticeDashboard(userId).catch(() => null);
  if (!d) notFound();
  const v = viewModel(d);
  return (<>
    <BackLink href="/studio/apprentices">Apprentices</BackLink>
    <PageHeader title={d.user.name ?? "Apprentice"} intro={`Supervisor: ${d.user.artistProfile?.supervisor?.displayName ?? "none set"}`} />
    {d.signoff && <div className="mb-6"><Alert tone="success">Signed off as junior artist on {d.signoff.createdAt.toLocaleDateString("en-GB")}.</Alert></div>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"><Stat label="Verified hours" value={(d.verifiedMinutes / 60).toFixed(1)} hint={`Target ${d.minMinutes / 60}`} /><Stat label="Pending verification" value={(d.pendingMinutes / 60).toFixed(1)} /><Stat label="Core skills signed off" value={`${d.coreCompetent} / ${d.coreTotal}`} /><Stat label="All skills" value={`${d.competent} / ${d.total}`} /></div>
    <h2 className="text-2xl font-bold mb-3">Hours to verify</h2>
    <HoursTable apprenticeId={userId} logs={v.logs} mentorMode />
    <h2 className="text-2xl font-bold mt-10 mb-3">Skills</h2>
    <SkillsBoard apprenticeId={userId} stages={v.stages} mentorMode />
    <h2 className="text-2xl font-bold mt-10 mb-3">Progression photos</h2>
    <EvidenceGrid apprenticeId={userId} items={v.evidence} mentorMode />
    {can(p, "studio.manage") && !d.signoff && <div className="mt-10"><JuniorSignoffForm apprenticeId={userId} ready={d.readyForJunior} blockers={v.blockers} /></div>}
  </>);
}
