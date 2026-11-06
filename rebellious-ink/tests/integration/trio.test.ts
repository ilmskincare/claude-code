import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { pull, trioState, trioPlayFor, bookFromTrio, trioSettings, TRIO_DEFAULTS, briefOf } from "@/lib/trio";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email: `${userId}@t`, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let client1: Principal;

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  client1 = principal(s.c1.id, ["CLIENT"]);
  await testDb.clientProfile.create({ data: { userId: s.c1.id } });
  await testDb.studioSetting.create({ data: { studioId: s.studio.id, key: "trio.spinsPerDay", value: 1000 } });
});
afterAll(async () => { await testDb.$disconnect(); });

describe("three machines", () => {
  it("every pull picks one option from each list, covers every option over 600 pulls, and stores the price shown", async () => {
    const st = await trioSettings();
    expect(st.inks).toEqual(TRIO_DEFAULTS.inks); expect(st.styles).toEqual(TRIO_DEFAULTS.styles); expect(st.subjects).toEqual(TRIO_DEFAULTS.subjects);
    const seen = { ink: new Set<string>(), style: new Set<string>(), subject: new Set<string>() };
    for (let i = 0; i < 600; i++) {
      const p = await pull("v1", null);
      expect(st.inks).toContain(p.result.ink); expect(st.styles).toContain(p.result.style); expect(st.subjects).toContain(p.result.subject);
      expect(p.result.pricePence).toBe(4000); expect(p.result.depositPence).toBe(1000);
      seen.ink.add(p.result.ink); seen.style.add(p.result.style); seen.subject.add(p.result.subject);
    }
    expect(seen.ink.size).toBe(st.inks.length); expect(seen.style.size).toBe(st.styles.length); expect(seen.subject.size).toBe(st.subjects.length);
  });

  it("honours the owner's lists, the daily limit per visitor and per account, and the switch", async () => {
    await testDb.studioSetting.create({ data: { studioId: s.studio.id, key: "trio.subjects", value: ["Only this"] } });
    expect((await pull("v2", null)).result.subject).toBe("Only this");
    await testDb.studioSetting.deleteMany({ where: { key: "trio.subjects" } });
    await testDb.studioSetting.updateMany({ where: { key: "trio.spinsPerDay" }, data: { value: 1 } });
    await pull("v3", null);
    await expect(pull("v3", null)).rejects.toThrow(/your go for today/);
    expect((await trioState("v3", null)).pullsLeft).toBe(0);
    await pull("v4", s.c1.id);
    await expect(pull("v5", s.c1.id)).rejects.toThrow(/your go for today/);      // same account, new browser
    await testDb.studioSetting.updateMany({ where: { key: "trio.spinsPerDay" }, data: { value: 1000 } });
    await testDb.studioSetting.create({ data: { studioId: s.studio.id, key: "trio.enabled", value: false } });
    await expect(pull("v6", null)).rejects.toThrow(/switched off/);
    await testDb.studioSetting.deleteMany({ where: { key: "trio.enabled" } });
  });

  it("a play is private to its browser or account, and booking it creates one fixed-price request with the chosen artist", async () => {
    const p = await pull("v7", null);
    expect(await trioPlayFor(p.id, "someone-else", null)).toBeNull();
    const mine = await trioPlayFor(p.id, "v7", null);
    expect(mine?.result).toEqual(p.result);
    expect(mine?.artists.map((a) => a.id)).toContain(s.artist.id);
    await expect(bookFromTrio(client1, "v7", { playId: p.id, artistId: s.artist.id, placement: "hands", declaredOver18: true })).rejects.toThrow(/custom price/);
    await expect(bookFromTrio(client1, "v7", { playId: p.id, artistId: "nope", placement: "calf", declaredOver18: true })).rejects.toThrow(/Choose an artist/);
    await expect(bookFromTrio(client1, "other-browser", { playId: p.id, artistId: s.artist.id, placement: "calf", declaredOver18: true })).rejects.toThrow();
    const r = await bookFromTrio(client1, "v7", { playId: p.id, artistId: s.artist.id, placement: "calf", declaredOver18: true });
    const req = await testDb.bookingRequest.findUniqueOrThrow({ where: { id: r.id }, include: { quotes: true } });
    expect(req.status).toBe("AWAITING_DEPOSIT"); expect(req.artistId).toBe(s.artist.id); expect(req.category).toBe("FLASH"); expect(req.designId).toBeNull();
    expect(req.description).toContain(briefOf(p.result)); expect(req.style).toBe(p.result.style);
    expect(req.quotes[0]).toMatchObject({ status: "ACCEPTED", amountPence: 4000, depositPence: 1000, priceBasis: "fixed" });
    const play = await testDb.play.findUniqueOrThrow({ where: { id: p.id } });
    expect(play.status).toBe("BOOKED"); expect(play.requestId).toBe(r.id); expect(play.userId).toBe(s.c1.id);
    await expect(bookFromTrio(client1, "v7", { playId: p.id, artistId: s.artist.id, placement: "calf", declaredOver18: true })).rejects.toThrow(/already booked/);
  });
});
