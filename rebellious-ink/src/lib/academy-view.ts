import type { apprenticeDashboard } from "./academy";
import { signedUrl } from "./storage";
import type { AreaRow, LogRow, EvidenceRow } from "@/components/academy";

type D = Awaited<ReturnType<typeof apprenticeDashboard>>;
export function viewModel(d: D) {
  const areas: AreaRow[] = d.areas.map((a) => ({ key: a.key, label: a.label, skills: a.skills.map((s) => ({ id: s.id, key: s.key, title: s.title, description: s.description, isCore: s.isCore, progress: s.progress ? { status: s.progress.status, apprenticeNote: s.progress.apprenticeNote, mentorNote: s.progress.mentorNote, signedOffAt: s.progress.signedOffAt?.toISOString() ?? null, signedOffByName: s.progress.signedOffBy?.name ?? null } : null })) }));
  const logs: LogRow[] = d.logs.map((l) => ({ id: l.id, date: l.date.toISOString(), minutes: l.minutes, activity: l.activity, notes: l.notes, supervisorName: l.supervisor?.displayName ?? null, verifiedAt: l.verifiedAt?.toISOString() ?? null, rejectedNote: l.rejectedNote }));
  const evidence: EvidenceRow[] = d.evidence.filter((e) => e.asset.scanStatus !== "FLAGGED").map((e) => ({ id: e.id, url: signedUrl(e.asset.storageKey, 900), caption: e.caption, stage: e.stage, skillTitle: e.skill?.title ?? null, mentorComment: e.mentorComment, createdAt: e.createdAt.toISOString() }));
  const blockers: string[] = [];
  if (d.verifiedMinutes < d.minMinutes) blockers.push(`${Math.ceil((d.minMinutes - d.verifiedMinutes) / 60)} more verified hours needed (${(d.verifiedMinutes / 60).toFixed(0)} of ${d.minMinutes / 60})`);
  if (d.coreCompetent < d.coreTotal) blockers.push(`${d.coreTotal - d.coreCompetent} core skills not yet signed off`);
  return { areas, logs, evidence, blockers, allSkills: d.areas.flatMap((a) => a.skills.map((s) => ({ id: s.id, title: s.title }))) };
}
