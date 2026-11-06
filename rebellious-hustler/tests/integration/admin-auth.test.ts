import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { attemptLogin, LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/passwords";
import { cleanupTestData } from "./helpers";

describe("admin login and lockout (database)", () => {
  const username = `test-admin-${randomUUID().slice(0, 6)}`;
  const password = "grit-and-loyalty-2026";

  beforeAll(async () => {
    await db.adminUser.create({ data: { username, passwordHash: await hashPassword(password), mustChangePassword: true } });
  });

  afterAll(async () => {
    await cleanupTestData();
    await db.$disconnect();
  });

  it("signs in with the right password and reports the forced password change", async () => {
    const result = await attemptLogin(username, password);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.mustChangePassword).toBe(true);
  });

  it("rejects an unknown user and a wrong password without saying which", async () => {
    expect(await attemptLogin("nobody-here", password)).toEqual({ ok: false, reason: "invalid" });
    expect(await attemptLogin(username, "wrong")).toEqual({ ok: false, reason: "invalid" });
  });

  it(`locks the account after ${MAX_FAILED_LOGINS} wrong tries for ${LOCKOUT_MINUTES} minutes, then lets a correct password in`, async () => {
    await db.adminUser.update({ where: { username }, data: { failedLogins: 0, lockedUntil: null } });
    const now = new Date();
    let last: Awaited<ReturnType<typeof attemptLogin>> | null = null;
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) last = await attemptLogin(username, "wrong", now);
    expect(last && !last.ok && last.reason).toBe("locked");

    const whileLocked = await attemptLogin(username, password, new Date(now.getTime() + 60_000));
    expect(!whileLocked.ok && whileLocked.reason).toBe("locked");
    if (!whileLocked.ok) expect(whileLocked.unlockAt?.getTime()).toBe(now.getTime() + LOCKOUT_MINUTES * 60_000);

    const afterLock = await attemptLogin(username, password, new Date(now.getTime() + (LOCKOUT_MINUTES + 1) * 60_000));
    expect(afterLock.ok).toBe(true);
    const row = await db.adminUser.findUniqueOrThrow({ where: { username } });
    expect(row.failedLogins).toBe(0);
    expect(row.lockedUntil).toBeNull();
  });
});
