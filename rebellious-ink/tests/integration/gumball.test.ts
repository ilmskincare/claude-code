import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { createDesign } from "@/lib/flash";
import { spin, stock, machineState, bookFromPlay, playFor, addRestockAlert, gumballSettings } from "@/lib/gumball";
import { isEighteen } from "@/lib/visitor";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email: `${userId}@t`, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let artistA: Principal, client1: Principal;
const png = (n: string) => new File([Buffer.from("89504e470d0a1a0a", "hex")], `${n}.png`, { type: "image/png" });
const base = { theme: "", colourMode: "BLACK" as const, collection: "GUMBALL" as const, apprenticeAvailable: false, repeatable: true, artistId: "" };

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  artistA = principal(s.artistUser.id, ["RESIDENT_ARTIST"], s.artist.id);
  client1 = principal(s.c1.id, ["CLIENT"]);
  await testDb.clientProfile.create({ data: { userId: s.c1.id } });
  await testDb.studioSetting.create({ data: { studioId: s.studio.id, key: "gumball.spinsPerDay", value: 2000 } });
});
afterAll(async () => { await testDb.$disconnect(); });

describe("gumball machine", () => {
  it("hides itself below the minimum stock and never hands out a held, booked or retired design in 1,000 spins", async () => {
    for (let i = 0; i < 4; i++) await createDesign(artistA, { ...base, title: `Capsule ${i}`, artistId: s.artist.id }, png(`c${i}`));
    expect((await machineState("v1", null)).restocking).toBe(true);
    await expect(spin("v1", null)).rejects.toThrow(/restocked/);
    const booked = await createDesign(artistA, { ...base, title: "Booked capsule", artistId: s.artist.id }, png("b"));
    const held = await createDesign(artistA, { ...base, title: "Held capsule", repeatable: false, artistId: s.artist.id }, png("h"));
    const retired = await createDesign(artistA, { ...base, title: "Retired capsule", artistId: s.artist.id }, png("r"));
    await createDesign(artistA, { ...base, title: "Capsule 5", artistId: s.artist.id }, png("c5"));
    await testDb.design.update({ where: { id: booked.id }, data: { status: "BOOKED" } });
    await testDb.design.update({ where: { id: held.id }, data: { status: "HELD", heldUntil: new Date(Date.now() + 600000), heldRequestId: "someone-else" } });
    await testDb.design.update({ where: { id: retired.id }, data: { status: "RETIRED" } });
    expect(await stock()).toBe(5);
    const seen = new Map<string, number>();
    for (let i = 0; i < 1000; i++) { const p = await spin("v1", null); seen.set(p.designId!, (seen.get(p.designId!) ?? 0) + 1); }
    expect(seen.has(booked.id)).toBe(false); expect(seen.has(held.id)).toBe(false); expect(seen.has(retired.id)).toBe(false);
    expect(seen.size).toBe(5);                                                   // every available capsule came out
    for (const n of seen.values()) expect(n).toBeGreaterThan(120);              // roughly uniform (expected 200 each)
  });

  it("limits spins per day per visitor and account", async () => {
    await testDb.studioSetting.update({ where: { studioId_key: { studioId: s.studio.id, key: "gumball.spinsPerDay" } }, data: { value: 1 } });
    const first = await spin("v2", null);
    expect(first.status).toBe("RESULT_SHOWN");
    await expect(spin("v2", null)).rejects.toThrow(/spin for today/);
    expect((await machineState("v2", null)).spinsLeft).toBe(0);
    await expect(spin("v3", s.c1.id)).resolves.toBeTruthy();
    await expect(spin("v4", s.c1.id)).rejects.toThrow(/spin for today/);    // same account, different browser
    await testDb.studioSetting.update({ where: { studioId_key: { studioId: s.studio.id, key: "gumball.spinsPerDay" } }, data: { value: 2000 } });
  });

  it("a play is private to its browser or account, and booking it uses the gumball price with the normal deposit flow", async () => {
    const play = await spin("v5", null);
    expect(await playFor(play.id, "v5", null)).not.toBeNull();
    expect(await playFor(play.id, "someone-else", null)).toBeNull();
    expect(await playFor(play.id, null, s.c2.id)).toBeNull();
    await expect(bookFromPlay(client1, "someone-else", { playId: play.id, placement: "forearm", declaredOver18: true })).rejects.toThrow(/permission/i);
    await expect(bookFromPlay(client1, "v5", { playId: play.id, placement: "hands", declaredOver18: true })).rejects.toThrow(/quoted individually/);
    const r = await bookFromPlay(client1, "v5", { playId: play.id, placement: "forearm", declaredOver18: true });
    const settings = await gumballSettings();
    const quote = await testDb.quote.findFirstOrThrow({ where: { requestId: r.id } });
    expect(quote).toMatchObject({ amountPence: settings.pricePence, depositPence: settings.depositPence, status: "ACCEPTED" });
    expect(r.description).toContain("Gumball machine");
    expect((await testDb.play.findUniqueOrThrow({ where: { id: play.id } })).status).toBe("BOOKED");
    await expect(bookFromPlay(client1, "v5", { playId: play.id, placement: "forearm", declaredOver18: true })).rejects.toThrow(/already booked/);
    // Gumball designs cannot be booked through the catalogue route
    const { designById } = await import("@/lib/flash");
    expect(await designById(play.designId!)).toBeNull();
    const events = await testDb.analyticsEvent.findMany({ where: { playId: play.id } });
    expect(events.map((e) => e.name).sort()).toEqual(["play_started", "result_shown"]);
  });

  it("a one-off capsule is held for the player and released if they walk away", async () => {
    const oneOff = await createDesign(artistA, { ...base, title: "Rare capsule", repeatable: false, artistId: s.artist.id }, png("rare"));
    let play; for (let i = 0; i < 400; i++) { play = await spin("v6", null); if (play.designId === oneOff.id) break; }
    expect(play!.designId).toBe(oneOff.id);
    const d = await testDb.design.findUniqueOrThrow({ where: { id: oneOff.id } });
    expect(d.status).toBe("HELD"); expect(d.heldRequestId).toBe(play!.id);
    await testDb.design.update({ where: { id: oneOff.id }, data: { heldUntil: new Date(Date.now() - 1000) } });
    expect(await stock()).toBeGreaterThan(0);
    expect((await testDb.design.findUniqueOrThrow({ where: { id: oneOff.id } })).status).toBe("AVAILABLE");
  });

  it("restock alerts are stored once per email, and the age check is exact", async () => {
    await addRestockAlert("Fan@Example.com", "v7"); await addRestockAlert("fan@example.com", "v7");
    expect(await testDb.playAlert.count({ where: { game: "gumball" } })).toBe(1);
    await expect(addRestockAlert("not-an-email", "v7")).rejects.toThrow(/valid email/);
    const now = new Date("2026-10-21T12:00:00Z");
    expect(isEighteen(new Date("2008-10-21"), now)).toBe(true);
    expect(isEighteen(new Date("2008-10-22"), now)).toBe(false);
  });
});
