import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { can, type Principal, ForbiddenError, ValidationError } from "./rbac";

/**
 * Adding people to the team. The owner (or anyone with roster.manage) enters an email and
 * what the person does; the record is created straight away and the person signs in with a
 * magic link to that email. Apprentices must have a supervisor so their slots can be checked
 * against the supervisor's day. Nothing here grants more than the role's default capabilities.
 */
export const TEAM_KINDS = {
  TATTOO_ARTIST: "Tattoo artist",
  JUNIOR_ARTIST: "Junior artist",
  PIERCER: "Piercer",
  APPRENTICE: "Apprentice",
  RECEPTION: "Desk (reception)",
} as const;
export const ARRANGEMENTS = { RESIDENT_ARTIST: "Resident (commission)", CHAIR_RENT_ARTIST: "Chair rent", GUEST_ARTIST: "Guest spot" } as const;

export const addTeamMemberSchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().min(2).max(120),
  displayName: z.string().trim().min(2).max(80),
  kind: z.enum(["TATTOO_ARTIST", "JUNIOR_ARTIST", "PIERCER", "APPRENTICE", "RECEPTION"]),
  arrangement: z.enum(["RESIDENT_ARTIST", "CHAIR_RENT_ARTIST", "GUEST_ARTIST"]).default("RESIDENT_ARTIST"),
  supervisorId: z.string().optional().or(z.literal("")),
  stationId: z.string().optional().or(z.literal("")),
  styles: z.string().max(300).optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
});
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "artist";

async function uniqueSlug(base: string) {
  let slug = base, n = 2;
  while (await db.artistProfile.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${n++}`;
  return slug;
}

/** Practitioners who may supervise an apprentice: published, not apprentices themselves. */
export async function supervisorOptions() {
  return db.artistProfile.findMany({ where: { kind: { not: "APPRENTICE" }, user: { memberships: { some: { status: "ACTIVE" } } } }, select: { id: true, displayName: true, kind: true }, orderBy: { displayName: "asc" } });
}

export async function addTeamMember(p: Principal, input: AddTeamMemberInput) {
  if (!can(p, "roster.manage")) throw new ForbiddenError();
  const email = input.email.toLowerCase();
  const studio = await db.studio.findFirstOrThrow();
  const role = input.kind === "APPRENTICE" ? "APPRENTICE" : input.kind === "PIERCER" ? "PIERCER" : input.kind === "RECEPTION" ? "RECEPTION" : input.arrangement;
  let supervisorId: string | null = null;
  if (input.kind === "APPRENTICE") {
    const sup = input.supervisorId ? await db.artistProfile.findUnique({ where: { id: input.supervisorId }, select: { id: true, kind: true } }) : null;
    if (!sup || sup.kind === "APPRENTICE") throw new ValidationError("An apprentice needs a supervising artist or piercer. Choose one from the list.");
    supervisorId = sup.id;
  }
  const stationId = input.stationId ? (await db.station.findFirst({ where: { id: input.stationId, studioId: studio.id }, select: { id: true } }))?.id ?? null : null;
  const existingProfile = await db.user.findUnique({ where: { email }, include: { artistProfile: { select: { id: true, displayName: true } } } });
  if (existingProfile?.artistProfile) throw new ValidationError(`${email} already has a profile (${existingProfile.artistProfile.displayName}). Edit it from the list instead.`);
  const styles = (input.styles ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const slug = await uniqueSlug(slugify(input.displayName));
  return db.$transaction(async (tx) => {
    const user = existingProfile ? await tx.user.update({ where: { id: existingProfile.id }, data: { name: input.name } }) : await tx.user.create({ data: { email, name: input.name } });
    await tx.membership.upsert({ where: { userId_studioId: { userId: user.id, studioId: studio.id } }, create: { userId: user.id, studioId: studio.id, roles: [role], status: "ACTIVE" }, update: { roles: [role], status: "ACTIVE" } });
    await tx.clientProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
    const profile = input.kind === "RECEPTION" ? null : await tx.artistProfile.create({ data: { userId: user.id, slug, displayName: input.displayName, kind: input.kind, styles, supervisorId, defaultStationId: stationId, isPublished: input.isPublished, acceptsEnquiries: input.kind !== "APPRENTICE" } });
    await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: "team.member_added", entityType: profile ? "ArtistProfile" : "Membership", entityId: profile?.id ?? user.id, after: { email, role, kind: input.kind, supervisorId, isPublished: input.isPublished } }, tx);
    return { user, profile, role };
  });
}
