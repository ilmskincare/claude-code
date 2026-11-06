import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { isProduction } from "./env";
import { verifyPassword } from "./passwords";
import { decodeJson, encodeJson, sign, unsign } from "./signing";

export const ADMIN_COOKIE = "rh_admin";
const SESSION_HOURS = 12;
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

type SessionPayload = { uid: string; v: number; exp: number };

export type AdminPrincipal = { id: string; username: string; mustChangePassword: boolean };

export function cookieOptions(maxAgeSeconds: number) {
  return { httpOnly: true, sameSite: "lax" as const, secure: isProduction(), path: "/", maxAge: maxAgeSeconds };
}

/** Read and verify the admin session cookie. Returns null when absent, tampered, expired or superseded. */
export const getAdmin = cache(async (): Promise<AdminPrincipal | null> => {
  const store = await cookies();
  const raw = unsign(store.get(ADMIN_COOKIE)?.value);
  if (!raw) return null;
  const payload = decodeJson<SessionPayload>(raw);
  if (!payload || payload.exp < Date.now()) return null;
  const user = await db.adminUser.findUnique({ where: { id: payload.uid } });
  if (!user || user.sessionVersion !== payload.v) return null;
  return { id: user.id, username: user.username, mustChangePassword: user.mustChangePassword };
});

/** Redirects to the login page when nobody is signed in, and to the password page when a change is due. */
export async function requireAdmin(opts: { allowPasswordChangeDue?: boolean } = {}): Promise<AdminPrincipal> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword && !opts.allowPasswordChangeDue) redirect("/admin/password");
  return admin;
}

export async function setAdminSession(user: { id: string; sessionVersion: number }) {
  const payload: SessionPayload = { uid: user.id, v: user.sessionVersion, exp: Date.now() + SESSION_HOURS * 3600 * 1000 };
  const store = await cookies();
  store.set(ADMIN_COOKIE, sign(encodeJson(payload)), cookieOptions(SESSION_HOURS * 3600));
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
}

export type LoginResult =
  | { ok: true; user: { id: string; sessionVersion: number; mustChangePassword: boolean } }
  | { ok: false; reason: "invalid" | "locked"; unlockAt?: Date };

/**
 * Check a username and password with lockout: 5 wrong tries lock the account for 15 minutes.
 * Pure database logic so it can be tested without a request.
 */
export async function attemptLogin(username: string, password: string, now = new Date()): Promise<LoginResult> {
  const user = await db.adminUser.findUnique({ where: { username: username.trim().toLowerCase() } });
  if (!user) {
    // Burn roughly the same time as a real check so usernames cannot be probed by timing.
    await verifyPassword(password, "scrypt$16384$8$1$00$00");
    return { ok: false, reason: "invalid" };
  }
  if (user.lockedUntil && user.lockedUntil > now) return { ok: false, reason: "locked", unlockAt: user.lockedUntil };

  const good = await verifyPassword(password, user.passwordHash);
  if (!good) {
    const failed = (user.lockedUntil && user.lockedUntil <= now ? 0 : user.failedLogins) + 1;
    const lock = failed >= MAX_FAILED_LOGINS;
    const lockedUntil = lock ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000) : null;
    await db.adminUser.update({ where: { id: user.id }, data: { failedLogins: lock ? 0 : failed, lockedUntil } });
    return lock ? { ok: false, reason: "locked", unlockAt: lockedUntil! } : { ok: false, reason: "invalid" };
  }
  await db.adminUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: now } });
  return { ok: true, user: { id: user.id, sessionVersion: user.sessionVersion, mustChangePassword: user.mustChangePassword } };
}
