import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { addTeamMember, supervisorOptions, slugify } from "@/lib/team";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email: `${userId}@t`, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let owner: Principal, artistA: Principal;

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  owner = principal(s.owner.id, ["OWNER"]);
  artistA = principal(s.artistUser.id, ["RESIDENT_ARTIST"], s.artist.id);
});
afterAll(async () => { await testDb.$disconnect(); });

describe("adding team members", () => {
  it("owner adds a chair-rent tattoo artist: user, membership, client profile and a unique public slug", async () => {
    const r = await addTeamMember(owner, { signIn: "email", email: "New.Artist@Example.com", name: "New Artist", displayName: "Artist A", kind: "TATTOO_ARTIST", arrangement: "CHAIR_RENT_ARTIST", stationId: s.station.id, styles: "fine line, blackwork", isPublished: true });
    expect(r.user.email).toBe("new.artist@example.com");
    expect(r.profile?.slug).toBe("artist-a");
    const dup = await addTeamMember(owner, { signIn: "email", email: "second@example.com", name: "Second", displayName: "Artist A", kind: "TATTOO_ARTIST", arrangement: "RESIDENT_ARTIST", isPublished: false });
    expect(dup.profile?.slug).toBe("artist-a-2");                                    // same public name, unique address
    const prof = await testDb.artistProfile.findUniqueOrThrow({ where: { id: r.profile!.id } });
    expect(prof).toMatchObject({ kind: "TATTOO_ARTIST", isPublished: true, acceptsEnquiries: true, defaultStationId: s.station.id, styles: ["fine line", "blackwork"] });
    const m = await testDb.membership.findFirstOrThrow({ where: { userId: r.user.id } });
    expect(m.roles).toEqual(["CHAIR_RENT_ARTIST"]); expect(m.status).toBe("ACTIVE");
    expect(await testDb.clientProfile.findUnique({ where: { userId: r.user.id } })).not.toBeNull();
    expect(await testDb.auditLog.count({ where: { action: "team.member_added", entityId: r.profile!.id } })).toBe(1);
  });

  it("an apprentice needs a supervisor who is not an apprentice; they get the APPRENTICE role and do not take enquiries", async () => {
    await expect(addTeamMember(owner, { signIn: "email", email: "app@example.com", name: "Ash", displayName: "Ash", kind: "APPRENTICE", arrangement: "RESIDENT_ARTIST", isPublished: false })).rejects.toThrow(/supervising artist/);
    const sups = await supervisorOptions();
    expect(sups.map((x) => x.id)).toContain(s.artist.id);
    const r = await addTeamMember(owner, { signIn: "email", email: "app@example.com", name: "Ash", displayName: "Ash", kind: "APPRENTICE", arrangement: "RESIDENT_ARTIST", supervisorId: s.artist.id, isPublished: false });
    const prof = await testDb.artistProfile.findUniqueOrThrow({ where: { id: r.profile!.id } });
    expect(prof).toMatchObject({ kind: "APPRENTICE", supervisorId: s.artist.id, acceptsEnquiries: false, isPublished: false });
    expect((await testDb.membership.findFirstOrThrow({ where: { userId: r.user.id } })).roles).toEqual(["APPRENTICE"]);
    await expect(addTeamMember(owner, { signIn: "email", email: "app2@example.com", name: "A2", displayName: "A2", kind: "APPRENTICE", arrangement: "RESIDENT_ARTIST", supervisorId: r.profile!.id, isPublished: false })).rejects.toThrow(/supervising artist/);   // apprentice cannot supervise
    expect((await supervisorOptions()).map((x) => x.id)).not.toContain(r.profile!.id);
  });

  it("desk members get a membership only; an email that already has a profile is refused; artists are refused", async () => {
    const r = await addTeamMember(owner, { signIn: "email", email: "desk@example.com", name: "Dee", displayName: "Desk", kind: "RECEPTION", arrangement: "RESIDENT_ARTIST", isPublished: false });
    expect(r.profile).toBeNull();
    expect((await testDb.membership.findFirstOrThrow({ where: { userId: r.user.id } })).roles).toEqual(["RECEPTION"]);
    await expect(addTeamMember(owner, { signIn: "email", email: "a@test.local", name: "Dup", displayName: "Dup", kind: "TATTOO_ARTIST", arrangement: "RESIDENT_ARTIST", isPublished: false })).rejects.toThrow(/already has a profile/);
    await expect(addTeamMember(artistA, { signIn: "email", email: "x@example.com", name: "X", displayName: "X", kind: "TATTOO_ARTIST", arrangement: "RESIDENT_ARTIST", isPublished: false })).rejects.toThrow();
    expect(slugify("Elle Evaa!")).toBe("elle-evaa");
  });
});
