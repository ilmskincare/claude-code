import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { env } from "./env";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { generateTempPassword, hashPassword, passwordProblem, verifyPassword } from "./passwords";

/**
 * Staff accounts without email. The owner gives a person a username and a one-time password; the
 * person signs in with it, must set their own password straight away, and from then on uses that.
 * Five wrong passwords lock the account for fifteen minutes. The owner can reset a password,
 * change a person's role (what they can see and do) and suspend or reactivate them at any time.
 * A session created here is the same database session the email sign-in uses, so everything else
 * in the app treats both kinds of sign-in identically.
 */
export const STAFF_EMAIL_DOMAIN = "staff.invalid";
export const isPlaceholderEmail = (email: string | null | undefined) => Boolean(email && email.toLowerCase().endsWith(`@${STAFF_EMAIL_DOMAIN}`));
export const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{2,29}$/, "Usernames are 3 to 30 characters: letters, numbers, dots, dashes or underscores.");
export const suggestUsername = (name: string) => name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 30) || "staff";
const LOCK_AFTER = 5, LOCK_MINUTES = 15;
const SESSION_DAYS = 14;

export const ASSIGNABLE_ROLES = ["OWNER", "STUDIO_MANAGER", "RECEPTION", "RESIDENT_ARTIST", "CHAIR_RENT_ARTIST", "GUEST_ARTIST", "PIERCER", "APPRENTICE", "MENTOR", "FINANCE_ADVISER"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];
export const ROLE_LABEL: Record<AssignableRole, string> = { OWNER: "Owner (everything)", STUDIO_MANAGER: "Studio manager (everything except money settings)", RECEPTION: "Desk (enquiries, clients, bookings, stock view)", RESIDENT_ARTIST: "Resident artist", CHAIR_RENT_ARTIST: "Chair-rent artist", GUEST_ARTIST: "Guest artist", PIERCER: "Piercer", APPRENTICE: "Apprentice", MENTOR: "Mentor (signs off apprentices)", FINANCE_ADVISER: "Finance adviser (reports and ledger, read only)" };

/** Checks a username and password. Returns the user on success; never says which half was wrong. */
export async function checkStaffCredentials(username: string, password: string, now = new Date()) {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) throw new ValidationError("Wrong username or password.");
  const user = await db.user.findUnique({ where: { username: parsed.data }, include: { memberships: true } });
  if (!user || !user.passwordHash) throw new ValidationError("Wrong username or password.");
  if (user.lockedUntil && user.lockedUntil > now) throw new ValidationError(`Too many wrong passwords. Try again in ${Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000)} minutes, or ask the owner to reset it.`);
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const failed = user.failedLogins + 1;
    const lock = failed >= LOCK_AFTER;
    await db.user.update({ where: { id: user.id }, data: { failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(now.getTime() + LOCK_MINUTES * 60000) : null } });
    await audit({ actorId: user.id, actorLabel: `Staff: ${user.username}`, action: lock ? "auth.locked" : "auth.password_failed", entityType: "User", entityId: user.id, after: { failed } });
    throw new ValidationError(lock ? `Too many wrong passwords. The account is locked for ${LOCK_MINUTES} minutes.` : "Wrong username or password.");
  }
  const membership = user.memberships.find((m) => m.status === "ACTIVE");
  if (user.isSuspended || !membership) throw new ValidationError("This account is suspended. Contact the owner.");
  if (user.failedLogins || user.lockedUntil) await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  return user;
}

/** Creates the same kind of database session the email link creates, and sets the Auth.js cookie. */
export async function startSession(userId: string, now = new Date()) {
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(now.getTime() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { sessionToken, userId, expires } });
  const secure = env().APP_BASE_URL.startsWith("https://");
  (await cookies()).set(`${secure ? "__Secure-" : ""}authjs.session-token`, sessionToken, { httpOnly: true, sameSite: "lax", secure, path: "/", expires });
  await db.deviceLog.create({ data: { userId, event: "signed_in_password" } }).catch(() => undefined);
  return { sessionToken, expires };
}

/** The signed-in person sets their own password (the first time, or whenever they like). */
export async function setOwnPassword(p: Principal, current: string | null, next: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: p.userId } });
  if (!user.username) throw new ValidationError("Your account signs in by email link; there is no password to set.");
  if (!user.mustChangePassword) { if (!current || !(await verifyPassword(current, user.passwordHash))) throw new ValidationError("Your current password is wrong."); }
  const problem = passwordProblem(next, user.username);
  if (problem) throw new ValidationError(problem);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next), mustChangePassword: false, failedLogins: 0, lockedUntil: null } });
  await audit({ actorId: p.userId, actorLabel: `Staff: ${user.username}`, action: "auth.password_changed", entityType: "User", entityId: user.id });
}

/** Owner gives (or resets) a username and one-time password. Returns the password once; it is never stored in clear. */
export async function issueCredentials(p: Principal, userId: string, username?: string) {
  if (!can(p, "roster.manage")) throw new ForbiddenError();
  const user = await db.user.findUnique({ where: { id: userId }, include: { memberships: true } });
  if (!user || !user.memberships.some((m) => m.roles.some((r) => r !== "CLIENT"))) throw new NotFoundError("Staff member not found");
  const wanted = username ? usernameSchema.parse(username) : user.username ?? suggestUsername(user.name ?? "staff");
  const clash = await db.user.findUnique({ where: { username: wanted }, select: { id: true } });
  if (clash && clash.id !== user.id) throw new ValidationError(`The username ${wanted} is taken.`);
  const temp = generateTempPassword();
  await db.user.update({ where: { id: user.id }, data: { username: wanted, passwordHash: await hashPassword(temp), mustChangePassword: true, failedLogins: 0, lockedUntil: null } });
  await db.session.deleteMany({ where: { userId: user.id } });                       // a reset signs them out everywhere
  await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: user.passwordHash ? "auth.password_reset_by_owner" : "auth.credentials_issued", entityType: "User", entityId: user.id, after: { username: wanted } });
  return { username: wanted, tempPassword: temp };
}

/** Owner changes what a person can see and do. One role per person keeps the matrix readable. */
export async function changeRole(p: Principal, userId: string, role: AssignableRole) {
  if (!can(p, "roster.manage")) throw new ForbiddenError();
  if (!ASSIGNABLE_ROLES.includes(role)) throw new ValidationError("Unknown role.");
  if (userId === p.userId && role !== "OWNER") throw new ValidationError("You cannot remove your own owner access. Ask another owner to do it.");
  const studio = await db.studio.findFirstOrThrow();
  const m = await db.membership.findUnique({ where: { userId_studioId: { userId, studioId: studio.id } } });
  if (!m) throw new NotFoundError("Staff member not found");
  if (m.roles.includes("OWNER") && role !== "OWNER" && (await db.membership.count({ where: { studioId: studio.id, status: "ACTIVE", roles: { has: "OWNER" } } })) <= 1) throw new ValidationError("The studio needs at least one owner.");
  await db.membership.update({ where: { id: m.id }, data: { roles: [role] } });
  await db.session.deleteMany({ where: { userId } });                                  // new access applies at next sign-in
  await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: "team.role_changed", entityType: "Membership", entityId: m.id, before: { roles: m.roles }, after: { roles: [role] } });
}

/** A job title shown in brackets after the name on the team page (e.g. "Studio manager"). It is a label only and never changes access. */
export async function setJobTitle(p: Principal, userId: string, title: string) {
  if (!can(p, "roster.manage")) throw new ForbiddenError();
  const clean = title.trim().replace(/\s+/g, " ");
  if (clean.length > 40) throw new ValidationError("Keep the job title to 40 characters.");
  const studio = await db.studio.findFirstOrThrow();
  const m = await db.membership.findUnique({ where: { userId_studioId: { userId, studioId: studio.id } } });
  if (!m) throw new NotFoundError("Staff member not found");
  await db.membership.update({ where: { id: m.id }, data: { jobTitle: clean || null } });
  await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: "team.job_title_changed", entityType: "Membership", entityId: m.id, before: { jobTitle: m.jobTitle }, after: { jobTitle: clean || null } });
  return clean || null;
}

/** Suspend (sign them out everywhere and refuse new sign-ins) or reactivate. */
export async function setStaffStatus(p: Principal, userId: string, status: "ACTIVE" | "SUSPENDED") {
  if (!can(p, "roster.manage")) throw new ForbiddenError();
  if (userId === p.userId) throw new ValidationError("You cannot suspend yourself.");
  const studio = await db.studio.findFirstOrThrow();
  const m = await db.membership.findUnique({ where: { userId_studioId: { userId, studioId: studio.id } } });
  if (!m) throw new NotFoundError("Staff member not found");
  if (m.roles.includes("OWNER") && status === "SUSPENDED" && (await db.membership.count({ where: { studioId: studio.id, status: "ACTIVE", roles: { has: "OWNER" } } })) <= 1) throw new ValidationError("The studio needs at least one active owner.");
  await db.$transaction([
    db.membership.update({ where: { id: m.id }, data: { status } }),
    db.user.update({ where: { id: userId }, data: { isSuspended: status === "SUSPENDED" } }),
    db.artistProfile.updateMany({ where: { userId }, data: status === "SUSPENDED" ? { isPublished: false, acceptsEnquiries: false } : {} }),
    ...(status === "SUSPENDED" ? [db.session.deleteMany({ where: { userId } })] : []),
  ]);
  await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: status === "SUSPENDED" ? "team.suspended" : "team.reactivated", entityType: "Membership", entityId: m.id });
}

/** Everyone on the team for the owner's table. */
export async function teamList() {
  const studio = await db.studio.findFirstOrThrow();
  const rows = await db.membership.findMany({ where: { studioId: studio.id }, include: { user: { select: { id: true, name: true, email: true, username: true, passwordHash: true, mustChangePassword: true, lockedUntil: true, artistProfile: { select: { id: true, displayName: true, kind: true, isPublished: true } } } } }, orderBy: { createdAt: "asc" } });
  return rows.filter((m) => m.roles.some((r) => r !== "CLIENT")).map((m) => ({ membershipId: m.id, userId: m.user.id, name: m.user.artistProfile?.displayName ?? m.user.name ?? m.user.email, fullName: m.user.name, jobTitle: m.jobTitle, email: isPlaceholderEmail(m.user.email) ? null : m.user.email, username: m.user.username, hasPassword: Boolean(m.user.passwordHash), mustChangePassword: m.user.mustChangePassword, locked: Boolean(m.user.lockedUntil && m.user.lockedUntil > new Date()), role: (m.roles[0] ?? "RECEPTION") as AssignableRole, status: m.status, profileId: m.user.artistProfile?.id ?? null, kind: m.user.artistProfile?.kind ?? null, isPublished: m.user.artistProfile?.isPublished ?? false }));
}
