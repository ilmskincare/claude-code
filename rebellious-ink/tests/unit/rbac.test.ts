import { describe, expect, it } from "vitest";
import { capabilitiesFor, can, type Principal } from "@/lib/rbac";
import { canAccessRequest, ageOn } from "@/lib/enquiries";

function principal(roles: Principal["roles"], artistProfileId: string | null = null, overrides = {}): Principal {
  return { userId: "u", email: "u@test", name: null, roles, capabilities: capabilitiesFor(roles, overrides), artistProfileId, membershipId: "m", isSuspended: false };
}

describe("roles and record scoping (acceptance test 2)", () => {
  it("artist A cannot see artist B's enquiry", () => {
    const a = principal(["CHAIR_RENT_ARTIST"], "artist-a");
    expect(canAccessRequest(a, { clientId: "c1", artistId: "artist-a" })).toBe(true);
    expect(canAccessRequest(a, { clientId: "c1", artistId: "artist-b" })).toBe(false);
    expect(canAccessRequest(a, { clientId: "c1", artistId: null })).toBe(false);
  });
  it("clients only see their own", () => {
    const c = principal(["CLIENT"]);
    expect(canAccessRequest(c, { clientId: "u", artistId: "artist-a" })).toBe(true);
    expect(canAccessRequest(c, { clientId: "other", artistId: "artist-a" })).toBe(false);
  });
  it("owner sees everything; apprentices cannot quote or sign off", () => {
    expect(canAccessRequest(principal(["OWNER"]), { clientId: "x", artistId: "y" })).toBe(true);
    const ap = principal(["APPRENTICE"], "ap");
    expect(can(ap, "quotes.issue")).toBe(false);
    expect(can(ap, "academy.signoff")).toBe(false);
    expect(can(principal(["MENTOR"]), "academy.signoff")).toBe(true);
  });
  it("granular overrides add and remove capabilities, suspension removes all", () => {
    const r = principal(["RECEPTION"], null, { "finance.verify_manual_payment": true, "clients.view_all": false });
    expect(can(r, "finance.verify_manual_payment")).toBe(true);
    expect(can(r, "clients.view_all")).toBe(false);
    expect(can({ ...r, isSuspended: true }, "enquiries.view_all")).toBe(false);
  });
  it("calculates age correctly around birthdays", () => {
    expect(ageOn(new Date("2008-10-22T00:00:00Z"), new Date("2026-10-21T00:00:00Z"))).toBe(17);
    expect(ageOn(new Date("2008-10-21T00:00:00Z"), new Date("2026-10-21T00:00:00Z"))).toBe(18);
  });
});
