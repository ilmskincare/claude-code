import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { upsertClientAtDesk, clientList } from "@/lib/clients";
import { marketingAudience } from "@/lib/marketing";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"]): Principal => ({ userId, email: `${userId}@t`, name: "Dee", roles, capabilities: capabilitiesFor(roles), artistProfileId: null, membershipId: null, isSuspended: false });
let desk: Principal, artist: Principal;

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  const d = await testDb.user.create({ data: { email: "desk@test.local", name: "Dee", memberships: { create: { studioId: s.studio.id, roles: ["RECEPTION"] } } } });
  desk = principal(d.id, ["RECEPTION"]); artist = principal(s.artistUser.id, ["RESIDENT_ARTIST"]);
});
afterAll(async () => { await testDb.$disconnect(); });

describe("desk client capture and marketing consent", () => {
  it("records the client, versions the marketing answer with the staff member, and feeds the audience; artists cannot do it", async () => {
    await expect(upsertClientAtDesk(artist, { name: "Walk In", email: "w@test.local", marketing: "yes" })).rejects.toThrow(/permission/i);
    const u = await upsertClientAtDesk(desk, { name: "Walk In", email: "W@Test.local", phone: "07000 000000", dateOfBirth: "1990-01-01", howFound: "Walk-in", marketing: "yes", consentNote: "asked at the desk" });
    expect(u.email).toBe("w@test.local");
    const profile = await testDb.clientProfile.findUniqueOrThrow({ where: { userId: u.id } });
    expect(profile.howFound).toBe("Walk-in"); expect(profile.dateOfBirth?.toISOString().slice(0, 10)).toBe("1990-01-01");
    const pref = await testDb.privacyPreference.findFirstOrThrow({ where: { userId: u.id, purpose: "MARKETING_EMAIL" } });
    expect(pref.granted).toBe(true); expect(pref.source).toBe(`desk:${desk.userId}`); expect(pref.version).toBe(1);
    expect((await marketingAudience()).map((a) => a.email)).toContain("w@test.local");
    // Asked again later and says no: new version, out of the audience, old record kept.
    await upsertClientAtDesk(desk, { name: "Walk In", email: "w@test.local", marketing: "no" });
    const prefs = await testDb.privacyPreference.findMany({ where: { userId: u.id, purpose: "MARKETING_EMAIL" }, orderBy: { version: "asc" } });
    expect(prefs.map((x) => [x.version, x.granted])).toEqual([[1, true], [2, false]]);
    expect((await marketingAudience()).map((a) => a.email)).not.toContain("w@test.local");
    // "Not asked" never writes a preference
    await upsertClientAtDesk(desk, { name: "Quiet One", email: "q@test.local", marketing: "not_asked" });
    expect(await testDb.privacyPreference.count({ where: { user: { email: "q@test.local" } } })).toBe(0);
    const list = await clientList(desk, "test.local");
    expect(list.find((r) => r.email === "w@test.local")).toMatchObject({ marketing: "no", enquiries: 0 });
    expect(list.find((r) => r.email === "q@test.local")).toMatchObject({ marketing: "not asked" });
    expect(list.some((r) => r.email === "desk@test.local")).toBe(false);     // staff are not clients
    const audit = await testDb.auditLog.findMany({ where: { entityType: "PrivacyPreference", actorId: desk.userId } });
    expect(audit.map((a) => a.action).sort()).toEqual(["privacy.marketing_opt_in", "privacy.marketing_opt_out"]);
  });
});
