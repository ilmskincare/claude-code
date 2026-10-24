import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { hashPassword, verifyPassword, passwordProblem, generateTempPassword } from "@/lib/passwords";
import { checkStaffCredentials, issueCredentials, changeRole, setStaffStatus, setOwnPassword, setJobTitle, teamList, suggestUsername, isPlaceholderEmail } from "@/lib/staff-auth";
import { addTeamMember } from "@/lib/team";
import { copyRecipients } from "@/lib/oversight";
import { sendEmail } from "@/lib/email";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, email: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let owner: Principal, artistA: Principal;

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  owner = principal(s.owner.id, "owner@test.local", ["OWNER"]);
  artistA = principal(s.artistUser.id, "a@test.local", ["RESIDENT_ARTIST"], s.artist.id);
});
afterAll(async () => { await testDb.$disconnect(); });

describe("passwords", () => {
  it("hashes with a fresh salt, verifies, and rejects weak choices", async () => {
    const h1 = await hashPassword("needle-crown-rose-42"), h2 = await hashPassword("needle-crown-rose-42");
    expect(h1).not.toBe(h2); expect(h1.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("needle-crown-rose-42", h1)).toBe(true);
    expect(await verifyPassword("needle-crown-rose-43", h1)).toBe(false);
    expect(await verifyPassword("anything", null)).toBe(false);
    expect(passwordProblem("short")).toMatch(/10 characters/); expect(passwordProblem("aaaaaaaaaaaa")).toMatch(/obvious/); expect(passwordProblem("sean-is-great-1", "sean")).toMatch(/username/); expect(passwordProblem("correct horse battery")).toBeNull();
    expect(generateTempPassword()).toMatch(/^[a-z]+-[a-z]+-[a-z]+-\d\d$/);
    expect(suggestUsername("Seán O'Brien")).toBe("sea.n.o.brien");
  });
});

describe("staff sign-in and user management", () => {
  it("owner adds a desk member with a username and no email; they sign in, must change the one-time password, then sign in with their own", async () => {
    const r = await addTeamMember(owner, { email: "", username: "sean", signIn: "password", name: "Sean", displayName: "Desk", kind: "RECEPTION", arrangement: "RESIDENT_ARTIST", isPublished: false });
    expect(r.username).toBe("sean"); expect(r.tempPassword).toMatch(/-\d\d$/); expect(isPlaceholderEmail(r.user.email)).toBe(true);
    await expect(checkStaffCredentials("sean", "wrong-wrong-1")).rejects.toThrow(/Wrong username or password/);
    const u = await checkStaffCredentials("sean", r.tempPassword!);
    expect(u.mustChangePassword).toBe(true);
    const sean = principal(u.id, u.email, ["RECEPTION"]);
    await expect(setOwnPassword(sean, null, "short")).rejects.toThrow(/10 characters/);
    await setOwnPassword(sean, null, "my own long password 9");
    expect((await checkStaffCredentials("sean", "my own long password 9")).mustChangePassword).toBe(false);
    await expect(checkStaffCredentials("sean", r.tempPassword!)).rejects.toThrow(/Wrong/);            // the one-time password is dead
    await expect(setOwnPassword(sean, "not my current", "another long password 1")).rejects.toThrow(/current password/);
    expect(await copyRecipients()).not.toContain(u.email);                                                 // placeholder addresses never get mail
    const sent = await sendEmail({ to: u.email, templateKey: "enquiry.new_message", subject: "x", text: "x", html: "x" });
    expect(sent.provider).toBe("none");
    expect((await testDb.notification.findUniqueOrThrow({ where: { id: sent.id } })).status).toBe("FAILED");
  });

  it("five wrong passwords lock the account for fifteen minutes; a reset by the owner unlocks it with a new one-time password and signs them out everywhere", async () => {
    const r = await addTeamMember(owner, { email: "", username: "locky", signIn: "password", name: "Locky", displayName: "Locky", kind: "PIERCER", arrangement: "RESIDENT_ARTIST", isPublished: false });
    for (let i = 0; i < 4; i++) await expect(checkStaffCredentials("locky", "nope-nope-nope")).rejects.toThrow(/Wrong/);
    await expect(checkStaffCredentials("locky", "nope-nope-nope")).rejects.toThrow(/locked for 15 minutes/);
    await expect(checkStaffCredentials("locky", r.tempPassword!)).rejects.toThrow(/Try again in/);     // even the right password waits
    await testDb.session.create({ data: { sessionToken: "tok-locky", userId: r.user.id, expires: new Date(Date.now() + 86400000) } });
    const reset = await issueCredentials(owner, r.user.id);
    expect(reset.username).toBe("locky"); expect(reset.tempPassword).not.toBe(r.tempPassword);
    expect(await testDb.session.count({ where: { userId: r.user.id } })).toBe(0);
    expect((await checkStaffCredentials("locky", reset.tempPassword!)).mustChangePassword).toBe(true);
    await expect(issueCredentials(artistA, r.user.id)).rejects.toThrow();                                 // artists cannot reset anyone
    await expect(issueCredentials(owner, s.c1.id)).rejects.toThrow(/not found/);                          // clients are not staff
  });

  it("existing email-link staff can be given a username too; usernames are unique", async () => {
    const r = await issueCredentials(owner, s.artistBUser.id, "artist.b");
    expect(r.username).toBe("artist.b");
    expect((await checkStaffCredentials("artist.b", r.tempPassword)).id).toBe(s.artistBUser.id);
    await expect(issueCredentials(owner, s.artistUser.id, "artist.b")).rejects.toThrow(/taken/);
    await expect(addTeamMember(owner, { email: "", username: "artist.b", signIn: "password", name: "Dup", displayName: "Dup", kind: "PIERCER", arrangement: "RESIDENT_ARTIST", isPublished: false })).rejects.toThrow(/taken/);
  });

  it("owner changes access from the dropdown, cannot demote the last owner or themselves, and suspension signs out, unpublishes and blocks sign-in", async () => {
    await changeRole(owner, s.artistUser.id, "STUDIO_MANAGER");
    expect((await testDb.membership.findFirstOrThrow({ where: { userId: s.artistUser.id } })).roles).toEqual(["STUDIO_MANAGER"]);
    await expect(changeRole(owner, s.owner.id, "RECEPTION")).rejects.toThrow(/own owner access/);
    await expect(setStaffStatus(owner, s.owner.id, "SUSPENDED")).rejects.toThrow(/suspend yourself/);
    await expect(changeRole(artistA, s.artistBUser.id, "OWNER")).rejects.toThrow();
    const r = await issueCredentials(owner, s.artistUser.id, "artist.a");
    await checkStaffCredentials("artist.a", r.tempPassword);
    await setStaffStatus(owner, s.artistUser.id, "SUSPENDED");
    expect((await testDb.artistProfile.findUniqueOrThrow({ where: { id: s.artist.id } })).isPublished).toBe(false);
    await expect(checkStaffCredentials("artist.a", r.tempPassword)).rejects.toThrow(/suspended/);
    const row = (await teamList()).find((t) => t.userId === s.artistUser.id)!;
    expect(row).toMatchObject({ username: "artist.a", status: "SUSPENDED", role: "STUDIO_MANAGER", hasPassword: true });
    await setStaffStatus(owner, s.artistUser.id, "ACTIVE");
    expect((await checkStaffCredentials("artist.a", r.tempPassword)).id).toBe(s.artistUser.id);
    expect((await teamList()).some((t) => t.userId === s.c1.id)).toBe(false);                             // clients are not on the team table
  });

  it("a job title is a label in brackets on the team page and never changes access", async () => {
    expect(await setJobTitle(owner, s.owner.id, "  Studio   manager ")).toBe("Studio manager");
    const row = (await teamList()).find((t) => t.userId === s.owner.id)!;
    expect(row.jobTitle).toBe("Studio manager"); expect(row.role).toBe("OWNER");
    await expect(setJobTitle(owner, s.owner.id, "x".repeat(41))).rejects.toThrow(/40 characters/);
    await expect(setJobTitle(artistA, s.owner.id, "Boss")).rejects.toThrow();
    expect(await setJobTitle(owner, s.owner.id, "")).toBeNull();
    expect(await testDb.auditLog.count({ where: { action: "team.job_title_changed" } })).toBe(2);
  });
});
