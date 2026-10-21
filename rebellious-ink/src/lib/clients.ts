import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { can, type Principal, ForbiddenError, ValidationError } from "./rbac";

/**
 * Front-of-house client capture. The desk records a client's details and, where the client
 * agrees, their marketing permission, with who took it, when and how. UK GDPR and PECR:
 * consent is specific, recorded and withdrawable; nothing is shared with third parties.
 */
export const CONSENT_SCRIPT = "We would like to email you about Rebellious Ink news and offers. We never share or sell your details with anyone else, you can stop the emails at any time with one click, and saying no makes no difference to your booking. Are you happy for us to email you?";

export const deskClientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  howFound: z.string().trim().max(120).optional().or(z.literal("")),
  accessNeeds: z.string().trim().max(1000).optional().or(z.literal("")),
  marketing: z.enum(["yes", "no", "not_asked"]).default("not_asked"),
  consentNote: z.string().trim().max(200).optional().or(z.literal("")),
});
export type DeskClientInput = z.infer<typeof deskClientSchema>;

/** Creates or updates the client and records the marketing answer as a new versioned preference. */
export async function upsertClientAtDesk(p: Principal, input: DeskClientInput) {
  if (!can(p, "enquiries.create_desk")) throw new ForbiddenError();
  const email = input.email.toLowerCase();
  const dob = input.dateOfBirth ? new Date(input.dateOfBirth + "T00:00:00Z") : null;
  if (dob && Number.isNaN(dob.getTime())) throw new ValidationError("Check the date of birth.");
  return db.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    const user = existing ? await tx.user.update({ where: { id: existing.id }, data: { name: input.name, phone: input.phone || existing.phone } }) : await tx.user.create({ data: { email, name: input.name, phone: input.phone || null } });
    await tx.clientProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, phone: input.phone || null, dateOfBirth: dob, howFound: input.howFound || null, accessNeeds: input.accessNeeds || null }, update: { ...(input.phone ? { phone: input.phone } : {}), ...(dob ? { dateOfBirth: dob } : {}), ...(input.howFound ? { howFound: input.howFound } : {}), ...(input.accessNeeds ? { accessNeeds: input.accessNeeds } : {}) } });
    if (input.marketing !== "not_asked") {
      const granted = input.marketing === "yes";
      const last = await tx.privacyPreference.findFirst({ where: { userId: user.id, purpose: "MARKETING_EMAIL" }, orderBy: { version: "desc" } });
      const row = await tx.privacyPreference.create({ data: { userId: user.id, purpose: "MARKETING_EMAIL", granted, grantedAt: granted ? new Date() : null, withdrawnAt: granted ? null : new Date(), source: `desk:${p.userId}`, version: (last?.version ?? 0) + 1 } });
      await audit({ actorId: p.userId, actorLabel: `Desk: ${p.name ?? p.email}`, action: granted ? "privacy.marketing_opt_in" : "privacy.marketing_opt_out", entityType: "PrivacyPreference", entityId: row.id, after: { userId: user.id, granted, source: "desk", script: "v1", note: input.consentNote || null } }, tx);
    }
    await audit({ actorId: p.userId, actorLabel: `Desk: ${p.name ?? p.email}`, action: existing ? "client.updated_at_desk" : "client.created_at_desk", entityType: "User", entityId: user.id, after: { email, marketing: input.marketing } }, tx);
    return user;
  });
}

/** Client list for the desk: latest marketing answer and activity, never health data. */
export async function clientList(p: Principal, q?: string) {
  if (!can(p, "clients.view_all")) throw new ForbiddenError();
  const users = await db.user.findMany({
    where: { memberships: { none: {} }, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}) },
    include: { clientProfile: true, privacyPrefs: { where: { purpose: "MARKETING_EMAIL" }, orderBy: { version: "desc" }, take: 1 }, _count: { select: { bookingRequests: true, appointments: true } } },
    orderBy: { createdAt: "desc" }, take: 200,
  });
  return users.map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone ?? u.clientProfile?.phone ?? null, createdAt: u.createdAt, enquiries: u._count.bookingRequests, appointments: u._count.appointments, marketing: u.privacyPrefs[0] ? (u.privacyPrefs[0].granted && !u.privacyPrefs[0].withdrawnAt ? "yes" : "no") : "not asked", marketingSource: u.privacyPrefs[0]?.source ?? null }));
}
