import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { apprenticeDashboard, isApprentice } from "@/lib/academy";
import { viewModel } from "@/lib/academy-view";
import { PageHeader, Stat, Alert, Empty } from "@/components/ui";
import { HoursForm, EvidenceForm, SkillsBoard, HoursTable, EvidenceGrid } from "@/components/academy";

export default async function AcademyPage() {
  const p = await requirePrincipal("/studio/academy");
  if (!(await isApprentice(p)) && !p.roles.includes("RESIDENT_ARTIST")) return <Empty>Training records are only shown to apprentices.</Empty>;
  const d = await apprenticeDashboard(p.userId);
  const v = viewModel(d);
  const supervisors = await db.artistProfile.findMany({ where: { kind: { in: ["TATTOO_ARTIST", "PIERCER"] } }, select: { id: true, displayName: true }, orderBy: { displayName: "asc" } });
  return (<>
    <PageHeader title="My training" intro={`Supervised by ${d.user.artistProfile?.supervisor?.displayName ?? "the studio"}. Log your hours, tick skills as ready for review, and build your progression record. Only a mentor can sign a skill off.`} />
    {d.signoff && <div className="mb-6"><Alert tone="success">Signed off as a junior artist on {d.signoff.createdAt.toLocaleDateString("en-GB")}{d.signoff.conditions ? ` · Conditions: ${d.signoff.conditions}` : ""}.</Alert></div>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"><Stat label="Verified hours" value={(d.verifiedMinutes / 60).toFixed(1)} hint={`Target ${d.minMinutes / 60}`} /><Stat label="Pending verification" value={(d.pendingMinutes / 60).toFixed(1)} /><Stat label="Core skills signed off" value={`${d.coreCompetent} / ${d.coreTotal}`} /><Stat label="All skills" value={`${d.competent} / ${d.total}`} /></div>
    <div className="grid lg:grid-cols-2 gap-6 mb-8">
      <section className="card p-5"><h2 className="text-xl font-bold mb-2">Log hours</h2><HoursForm apprenticeId={p.userId} supervisors={supervisors} /></section>
      <section className="card p-5"><h2 className="text-xl font-bold mb-2">Add progress photos</h2><EvidenceForm apprenticeId={p.userId} skills={v.allSkills} /></section>
    </div>
    <h2 className="text-2xl font-bold mb-3">Skills</h2>
    <SkillsBoard apprenticeId={p.userId} stages={v.stages} mentorMode={false} />
    <h2 className="text-2xl font-bold mt-10 mb-3">Hours log</h2>
    <HoursTable apprenticeId={p.userId} logs={v.logs} mentorMode={false} />
    <h2 className="text-2xl font-bold mt-10 mb-3">Progression photos</h2>
    <EvidenceGrid apprenticeId={p.userId} items={v.evidence} mentorMode={false} />
  </>);
}
