import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { assertAllowedUpload, newStorageKey, putObject } from "./storage";
import { SKILL_AREAS } from "@/content/skills";

export const DEFAULT_MINIMUM_HOURS = 500;

export const logSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.coerce.number().min(0.25).max(14),
  activity: z.string().trim().min(3).max(120),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  supervisorId: z.string().optional().or(z.literal("")),
});

export const evidenceSchema = z.object({
  caption: z.string().trim().max(200).optional().or(z.literal("")),
  stage: z.enum(["practice_skin", "supervised_client", "design", "other"]).default("practice_skin"),
  skillId: z.string().optional().or(z.literal("")),
});

export const signoffSchema = z.object({
  statement: z.string().trim().min(20).max(2000),
  conditions: z.string().trim().max(1000).optional().or(z.literal("")),
  confirm: z.literal("SIGN OFF"),
});

/** Mentors: anyone with academy.signoff, or the apprentice's named supervising practitioner. */
export async function canMentor(p: Principal, apprenticeUserId: string) {
  if (can(p, "academy.signoff")) return true;
  if (!p.artistProfileId) return false;
  const profile = await db.artistProfile.findUnique({ where: { userId: apprenticeUserId }, select: { supervisorId: true } });
  return profile?.supervisorId === p.artistProfileId;
}

export async function isApprentice(p: Principal) {
  return p.roles.includes("APPRENTICE") || can(p, "academy.learn");
}

async function minimumMinutes() {
  const s = await db.studioSetting.findFirst({ where: { key: "academy.minimumHours" } });
  const hours = typeof s?.value === "number" ? s.value : DEFAULT_MINIMUM_HOURS;
  return Math.round(hours * 60);
}

export async function apprenticeDashboard(apprenticeUserId: string) {
  const [user, skills, progress, logs, evidence, signoff, minMinutes] = await Promise.all([
    db.user.findUnique({ where: { id: apprenticeUserId }, include: { artistProfile: { include: { supervisor: true } } } }),
    db.skill.findMany({ orderBy: [{ area: "asc" }, { sortOrder: "asc" }] }),
    db.skillProgress.findMany({ where: { apprenticeId: apprenticeUserId }, include: { signedOffBy: { select: { name: true } } } }),
    db.practiceLog.findMany({ where: { apprenticeId: apprenticeUserId }, include: { supervisor: true }, orderBy: { date: "desc" }, take: 100 }),
    db.apprenticeEvidence.findMany({ where: { apprenticeId: apprenticeUserId }, include: { asset: true, skill: true }, orderBy: { createdAt: "desc" }, take: 60 }),
    db.juniorArtistSignoff.findUnique({ where: { apprenticeId: apprenticeUserId } }),
    minimumMinutes(),
  ]);
  if (!user) throw new NotFoundError("Apprentice not found");
  const byId = new Map(progress.map((x) => [x.skillId, x]));
  const areas = Object.entries(SKILL_AREAS).map(([key, label]) => ({ key, label, skills: skills.filter((s) => s.area === key).map((s) => ({ ...s, progress: byId.get(s.id) ?? null })) })).filter((a) => a.skills.length);
  const verifiedMinutes = logs.filter((l) => l.verifiedAt).reduce((s, l) => s + l.minutes, 0);
  const pendingMinutes = logs.filter((l) => !l.verifiedAt && !l.rejectedNote).reduce((s, l) => s + l.minutes, 0);
  const core = skills.filter((s) => s.isCore);
  const coreCompetent = core.filter((s) => byId.get(s.id)?.status === "COMPETENT").length;
  const competent = skills.filter((s) => byId.get(s.id)?.status === "COMPETENT").length;
  return {
    user, areas, logs, evidence, signoff,
    verifiedMinutes, pendingMinutes, minMinutes,
    coreTotal: core.length, coreCompetent, total: skills.length, competent,
    readyForJunior: !signoff && verifiedMinutes >= minMinutes && coreCompetent === core.length,
  };
}

export async function logHours(p: Principal, apprenticeUserId: string, input: z.infer<typeof logSchema>) {
  if (p.userId !== apprenticeUserId && !(await canMentor(p, apprenticeUserId))) throw new ForbiddenError();
  const log = await db.practiceLog.create({ data: { apprenticeId: apprenticeUserId, date: new Date(input.date + "T00:00:00Z"), minutes: Math.round(input.hours * 60), activity: input.activity, notes: input.notes || null, supervisorId: input.supervisorId || null } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "academy.hours_logged", entityType: "PracticeLog", entityId: log.id, after: { minutes: log.minutes, activity: log.activity } });
  return log;
}

export async function verifyHours(p: Principal, logId: string, decision: "verify" | "reject", note?: string) {
  const log = await db.practiceLog.findUnique({ where: { id: logId } });
  if (!log) throw new NotFoundError();
  if (!(await canMentor(p, log.apprenticeId))) throw new ForbiddenError();
  if (p.userId === log.apprenticeId) throw new ForbiddenError("You cannot verify your own hours.");
  const updated = await db.practiceLog.update({ where: { id: logId }, data: decision === "verify" ? { verifiedById: p.userId, verifiedAt: new Date(), rejectedNote: null } : { verifiedById: null, verifiedAt: null, rejectedNote: note || "Not verified" } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: `academy.hours_${decision}`, entityType: "PracticeLog", entityId: logId, reason: note });
  return updated;
}

/** Apprentices may move a skill to IN_PROGRESS or READY_FOR_REVIEW only. COMPETENT requires a mentor. */
export async function updateSkill(p: Principal, apprenticeUserId: string, skillId: string, status: "IN_PROGRESS" | "READY_FOR_REVIEW" | "COMPETENT" | "RENEWAL_DUE", note?: string) {
  const isSelf = p.userId === apprenticeUserId;
  const mentor = await canMentor(p, apprenticeUserId);
  if (!isSelf && !mentor) throw new ForbiddenError();
  if ((status === "COMPETENT" || status === "RENEWAL_DUE") && (!mentor || isSelf)) throw new ForbiddenError("Only a mentor or the owner can sign off a skill.");
  const data = status === "COMPETENT"
    ? { status, mentorNote: note || null, signedOffById: p.userId, signedOffAt: new Date() }
    : status === "RENEWAL_DUE" ? { status, mentorNote: note || null }
    : isSelf ? { status, apprenticeNote: note || null } : { status, mentorNote: note || null };
  const row = await db.skillProgress.upsert({ where: { apprenticeId_skillId: { apprenticeId: apprenticeUserId, skillId } }, create: { apprenticeId: apprenticeUserId, skillId, ...data }, update: data });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: `academy.skill_${status.toLowerCase()}`, entityType: "SkillProgress", entityId: row.id, after: { skillId, status }, reason: note });
  return row;
}

export async function addEvidence(p: Principal, apprenticeUserId: string, input: z.infer<typeof evidenceSchema>, files: File[]) {
  if (p.userId !== apprenticeUserId && !(await canMentor(p, apprenticeUserId))) throw new ForbiddenError();
  if (!files.length) throw new ValidationError("Choose at least one photo.");
  if (files.length > 10) throw new ValidationError("Up to ten photos at a time.");
  for (const f of files) assertAllowedUpload(f.type, f.size);
  const created = [];
  for (const f of files) {
    const key = newStorageKey(`academy/${apprenticeUserId}`, f.name);
    await putObject(key, new Uint8Array(await f.arrayBuffer()), f.type);
    const asset = await db.imageAsset.create({ data: { uploadedById: p.userId, storageKey: key, originalName: f.name.slice(0, 200), mimeType: f.type, sizeBytes: f.size, visibility: "PRIVATE_REFERENCE", scanStatus: "PENDING" } });
    created.push(await db.apprenticeEvidence.create({ data: { apprenticeId: apprenticeUserId, assetId: asset.id, skillId: input.skillId || null, caption: input.caption || null, stage: input.stage } }));
  }
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "academy.evidence_added", entityType: "ApprenticeEvidence", entityId: created[0].id, after: { count: created.length, skillId: input.skillId || null } });
  return created;
}

export async function commentEvidence(p: Principal, evidenceId: string, comment: string) {
  const ev = await db.apprenticeEvidence.findUnique({ where: { id: evidenceId } });
  if (!ev) throw new NotFoundError();
  if (!(await canMentor(p, ev.apprenticeId))) throw new ForbiddenError();
  return db.apprenticeEvidence.update({ where: { id: evidenceId }, data: { mentorComment: comment.trim().slice(0, 1000) } });
}

/** Owner-only, irreversible: promotes the apprentice to junior artist once hours and core skills are met. */
export async function signOffAsJuniorArtist(p: Principal, apprenticeUserId: string, input: z.infer<typeof signoffSchema>) {
  if (!can(p, "studio.manage")) throw new ForbiddenError("Only the studio owner can sign off a junior artist.");
  const d = await apprenticeDashboard(apprenticeUserId);
  if (d.signoff) throw new ValidationError("Already signed off.");
  if (d.verifiedMinutes < d.minMinutes) throw new ValidationError(`Needs ${Math.ceil((d.minMinutes - d.verifiedMinutes) / 60)} more verified hours.`);
  if (d.coreCompetent < d.coreTotal) throw new ValidationError(`${d.coreTotal - d.coreCompetent} core skill(s) are not yet signed off.`);
  return db.$transaction(async (tx) => {
    const snapshot = d.areas.flatMap((a) => a.skills.map((s) => ({ key: s.key, title: s.title, status: s.progress?.status ?? "NOT_STARTED", signedOffAt: s.progress?.signedOffAt ?? null })));
    const row = await tx.juniorArtistSignoff.create({ data: { apprenticeId: apprenticeUserId, signedOffById: p.userId, verifiedMinutes: d.verifiedMinutes, skillsSnapshot: snapshot, conditions: input.conditions || null, statement: input.statement } });
    await tx.artistProfile.updateMany({ where: { userId: apprenticeUserId }, data: { kind: "JUNIOR_ARTIST" } });
    await tx.membership.updateMany({ where: { userId: apprenticeUserId, roles: { has: "APPRENTICE" } }, data: { roles: ["RESIDENT_ARTIST"] } });
    await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: "academy.junior_artist_signed_off", entityType: "User", entityId: apprenticeUserId, after: { verifiedMinutes: d.verifiedMinutes, coreCompetent: d.coreCompetent, conditions: input.conditions || null } }, tx);
    return row;
  });
}

export async function listApprentices() {
  const members = await db.membership.findMany({ where: { roles: { has: "APPRENTICE" }, status: "ACTIVE" }, include: { user: { include: { artistProfile: { include: { supervisor: true } }, juniorSignoff: true } } } });
  const minMinutes = await minimumMinutes();
  const coreTotal = await db.skill.count({ where: { isCore: true } });
  return Promise.all(members.map(async (m) => {
    const [verified, pendingLogs, competent] = await Promise.all([
      db.practiceLog.aggregate({ _sum: { minutes: true }, where: { apprenticeId: m.userId, verifiedAt: { not: null } } }),
      db.practiceLog.count({ where: { apprenticeId: m.userId, verifiedAt: null, rejectedNote: null } }),
      db.skillProgress.count({ where: { apprenticeId: m.userId, status: "COMPETENT", skill: { isCore: true } } }),
    ]);
    const review = await db.skillProgress.count({ where: { apprenticeId: m.userId, status: "READY_FOR_REVIEW" } });
    return { user: m.user, verifiedMinutes: verified._sum.minutes ?? 0, minMinutes, pendingLogs, coreCompetent: competent, coreTotal, readyForReview: review };
  }));
}
