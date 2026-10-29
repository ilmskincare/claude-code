import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { createDesign, updateDesign, retireDesign, bulkAdjustPrices, catalogue, designById, bookDesign, priceFor, flashSettings, releaseLapsedDesignHolds, holdDesignForRequest } from "@/lib/flash";
import { availableSlots, createHold, createPendingAppointmentFromHold, confirmAppointmentWithDeposit, expireLapsedHolds } from "@/lib/booking";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email: `${userId}@t`, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let owner: Principal, artistA: Principal, artistB: Principal, client1: Principal, client2: Principal;
const png = (name = "d.png") => new File([Buffer.from("89504e470d0a1a0a", "hex")], name, { type: "image/png" });
const base = { title: "Moth", theme: "animals", colourMode: "BLACK" as const, collection: "CATALOGUE" as const, apprenticeAvailable: false, repeatable: true, artistId: "" };

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  owner = principal(s.owner.id, ["OWNER"]);
  artistA = principal(s.artistUser.id, ["RESIDENT_ARTIST"], s.artist.id);
  artistB = principal(s.artistBUser.id, ["RESIDENT_ARTIST"], s.artistB.id);
  client1 = principal(s.c1.id, ["CLIENT"]); client2 = principal(s.c2.id, ["CLIENT"]);
  await testDb.clientProfile.createMany({ data: [{ userId: s.c1.id }, { userId: s.c2.id }] });
  await testDb.studioSetting.create({ data: { studioId: s.studio.id, key: "flash.palmEnabled", value: true } });
});
afterAll(async () => { await testDb.$disconnect(); });

describe("flash catalogue pricing", () => {
  it("designs follow the studio defaults until overridden; changing the default updates every tile; bulk adjust only moves overrides", async () => {
    const d1 = await createDesign(artistA, { ...base, artistId: s.artist.id }, png());
    const d2 = await createDesign(artistA, { ...base, title: "Dagger", priceSmall: 7500, artistId: s.artist.id }, png());
    await expect(createDesign(artistA, { ...base, title: "Hijack", artistId: s.artistB.id }, png())).rejects.toThrow(/permission/i);
    const first = await catalogue(); let items = first.items; const settings = first.settings;
    expect(items.find((i) => i.id === d1.id)!.prices).toMatchObject({ small: 6000, palm: 11000, apprenticeSmall: null });
    expect(items.find((i) => i.id === d2.id)!.prices.small).toBe(7500);
    expect(priceFor(d1, "small", "artist", settings)).toMatchObject({ totalPence: 6000, depositPence: 2000, estimatedMinutes: 60, maxCm: 8 });
    expect(priceFor(d1, "small", "apprentice", settings)).toBeNull();
    expect(priceFor(d1, "palm", "artist", { ...settings, palmEnabled: false })).toBeNull();   // second size hidden unless switched on
    await testDb.studioSetting.create({ data: { studioId: s.studio.id, key: "flash.smallPence", value: 6500 } });
    ({ items } = await catalogue());
    expect(items.find((i) => i.id === d1.id)!.prices.small).toBe(6500);     // default moved
    expect(items.find((i) => i.id === d2.id)!.prices.small).toBe(7500);     // override untouched
    expect(await bulkAdjustPrices(owner, "small", 1000)).toBe(1);
    ({ items } = await catalogue());
    expect(items.find((i) => i.id === d2.id)!.prices.small).toBe(8500);
    expect(items.find((i) => i.id === d1.id)!.prices.small).toBe(6500);
    await expect(bulkAdjustPrices(artistA, "small", 100)).rejects.toThrow(/permission/i);
    await updateDesign(artistA, d1.id, { ...base, apprenticeAvailable: true, apprenticeSmall: 4200 });
    const found = await designById(d1.id);
    expect(found!.prices.apprenticeSmall).toBe(4200); expect(found!.prices.apprenticePalm).toBe(7000);
    await retireDesign(artistA, d2.id);
    expect((await catalogue()).items.some((i) => i.id === d2.id)).toBe(false);
    expect(await designById(d2.id)).toBeNull();
  });
});

describe("booking a design (fixed price, straight to the slot picker)", () => {
  it("creates an accepted-quote enquiry, refuses quoted placements, and holds then books a one-off exactly once", async () => {
    const one = await createDesign(artistA, { ...base, title: "Crown", repeatable: false, artistId: s.artist.id }, png());
    await expect(bookDesign(client1, { designId: one.id, size: "small", tier: "artist", placement: "hands", declaredOver18: true })).rejects.toThrow(/custom price/);
    await expect(bookDesign(client1, { designId: one.id, size: "small", tier: "artist", placement: "calf", sizeCm: 12, declaredOver18: true })).rejects.toThrow(/bigger piece/);
    await expect(bookDesign(client1, { designId: one.id, size: "small", tier: "artist", placement: "forearm", declaredOver18: false })).rejects.toThrow(/18 or over/);
    const r1 = await bookDesign(client1, { designId: one.id, size: "palm", tier: "artist", placement: "forearm (outer)", sizeCm: 7, declaredOver18: true });
    expect(r1.status).toBe("AWAITING_DEPOSIT"); expect(r1.category).toBe("FLASH"); expect(r1.reference).toMatch(/^ENQ-/);
    const quote = await testDb.quote.findFirstOrThrow({ where: { requestId: r1.id } });
    expect(quote).toMatchObject({ status: "ACCEPTED", amountPence: 11000, depositPence: 3000, estimatedMinutes: 120, priceBasis: "fixed" });
    expect(r1.sizeCm).toBe(7);
    expect((await testDb.design.findUniqueOrThrow({ where: { id: one.id } })).status).toBe("HELD");
    // Second client cannot take the held one-off
    await expect(bookDesign(client2, { designId: one.id, size: "small", tier: "artist", placement: "forearm (outer)", declaredOver18: true })).rejects.toThrow(/booking this one-off design right now/);
    // Client 1 picks a slot and pays: design is BOOKED and the catalogue shows it as gone
    const slots = await availableSlots(s.artist.id, new Date(), new Date(Date.now() + 14 * 86400000), 150);
    const { hold } = await createHold({ requestId: r1.id, clientId: s.c1.id, startsAt: slots[0].startsAt });
    const appt = await createPendingAppointmentFromHold(hold.id, { userId: s.c1.id, label: "Client" });
    await testDb.$transaction((tx) => confirmAppointmentWithDeposit(tx, { appointmentId: appt.id, amountPence: 3000, method: "BANK_TRANSFER", actorLabel: "Desk", verifiedById: s.owner.id }));
    const booked = await testDb.design.findUniqueOrThrow({ where: { id: one.id } });
    expect(booked.status).toBe("BOOKED"); expect(booked.bookedRequestId).toBe(r1.id);
    expect((await catalogue()).items.find((i) => i.id === one.id)!.isBooked).toBe(true);
    await expect(bookDesign(client2, { designId: one.id, size: "small", tier: "artist", placement: "forearm (outer)", declaredOver18: true })).rejects.toThrow(/just been booked/);
    // A repeatable design can be booked by two people
    const rep = await createDesign(artistA, { ...base, title: "Fern", artistId: s.artist.id }, png());
    await bookDesign(client1, { designId: rep.id, size: "small", tier: "artist", placement: "calf", declaredOver18: true });
    await bookDesign(client2, { designId: rep.id, size: "small", tier: "artist", placement: "calf", declaredOver18: true });
    expect((await testDb.design.findUniqueOrThrow({ where: { id: rep.id } })).status).toBe("AVAILABLE");
  });

  it("an abandoned one-off hold returns to the pool; 50 simultaneous claims produce exactly one hold", async () => {
    const one = await createDesign(artistA, { ...base, title: "Lantern", repeatable: false, artistId: s.artist.id }, png());
    const r = await bookDesign(client1, { designId: one.id, size: "small", tier: "artist", placement: "forearm (outer)", declaredOver18: true });
    await testDb.design.update({ where: { id: one.id }, data: { heldUntil: new Date(Date.now() - 1000) } });
    expect(await releaseLapsedDesignHolds()).toBe(1);
    expect((await testDb.design.findUniqueOrThrow({ where: { id: one.id } })).status).toBe("AVAILABLE");
    void r;
    // Race: many requests claim the same one-off at once; row locking lets exactly one through.
    const results = await Promise.allSettled(Array.from({ length: 50 }, (_, i) => testDb.$transaction((tx) => holdDesignForRequest(tx, one.id, `req-${i}`, 15))));
    const ok = results.filter((x) => x.status === "fulfilled").length;
    expect(ok).toBe(1);
    expect(results.filter((x) => x.status === "rejected").every((x) => /booking this one-off design right now/.test(String((x as PromiseRejectedResult).reason)))).toBe(true);
    // The hold expiry job also releases designs
    await testDb.design.update({ where: { id: one.id }, data: { heldUntil: new Date(Date.now() - 1000) } });
    await expireLapsedHolds();
    expect((await testDb.design.findUniqueOrThrow({ where: { id: one.id } })).status).toBe("AVAILABLE");
  });
});

describe("apprentice tier (supervised)", () => {
  it("offers apprentice prices only where enabled, and only slots when the supervisor is in the studio", async () => {
    const au = await testDb.user.create({ data: { email: "apprentice@test.local", name: "Apprentice", memberships: { create: { studioId: s.studio.id, roles: ["APPRENTICE"] } } } });
    // Apprentice works every day 09:00-18:00; supervisor (artist A) works Mon-Sun 09:00-18:00 in seedMinimal, but is on leave next Monday.
    const apprentice = await testDb.artistProfile.create({ data: { userId: au.id, slug: "app", displayName: "Ash", kind: "APPRENTICE", isPublished: true, acceptsEnquiries: true, supervisorId: s.artist.id, availabilityRules: { createMany: { data: [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, startMinute: 540, endMinute: 1080 })) } } } });
    const d = await createDesign(artistA, { ...base, title: "Swallow", apprenticeAvailable: true, artistId: s.artist.id }, png());
    const settings = await flashSettings();
    expect(priceFor(d, "small", "apprentice", settings)).toMatchObject({ totalPence: 4000, depositPence: 1500 });
    const r = await bookDesign(client1, { designId: d.id, size: "small", tier: "apprentice", placement: "thigh (outer)", declaredOver18: true });
    expect(r.artistId).toBe(apprentice.id); expect(r.designTier).toBe("apprentice");
    expect((await testDb.quote.findFirstOrThrow({ where: { requestId: r.id } })).amountPence).toBe(4000);
    // Supervisor leave next Monday 09:00-18:00 removes the apprentice's Monday slots
    const nextMonday = new Date(); nextMonday.setUTCDate(nextMonday.getUTCDate() + ((8 - nextMonday.getUTCDay()) % 7 || 7)); nextMonday.setUTCHours(0, 0, 0, 0);
    await testDb.leave.create({ data: { artistId: s.artist.id, startsAt: nextMonday, endsAt: new Date(nextMonday.getTime() + 86400000), reason: "Supervisor away" } });
    const slots = await availableSlots(apprentice.id, new Date(), new Date(Date.now() + 14 * 86400000), 90);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.some((x) => x.startsAt >= nextMonday && x.startsAt < new Date(nextMonday.getTime() + 86400000))).toBe(false);
    // Supervisor's windows also cap the apprentice: shrink the supervisor to afternoons only and no morning slots remain.
    await testDb.availabilityRule.updateMany({ where: { artistId: s.artist.id }, data: { startMinute: 780 } });
    const afternoons = await availableSlots(apprentice.id, new Date(), new Date(Date.now() + 14 * 86400000), 90);
    expect(afternoons.every((x) => new Date(x.startsAt).getUTCHours() >= 12)).toBe(true);
    await expect(createHold({ requestId: r.id, clientId: s.c1.id, startsAt: slots.find((x) => new Date(x.startsAt).getUTCHours() < 11)!.startsAt })).rejects.toThrow(/no longer available/);
    // Tier not offered on another design
    const plain = await createDesign(artistB, { ...base, title: "Plain", artistId: s.artistB.id }, png());
    await expect(bookDesign(client1, { designId: plain.id, size: "small", tier: "apprentice", placement: "thigh (outer)", declaredOver18: true })).rejects.toThrow(/not offered/);
  });

  it("a house design whose owner supervises nobody offers every published apprentice, even with books closed to enquiries", async () => {
    const hu = await testDb.user.create({ data: { email: "house@test.local", name: "House", memberships: { create: { studioId: s.studio.id, roles: ["RESIDENT_ARTIST"] } } } });
    const house = await testDb.artistProfile.create({ data: { userId: hu.id, slug: "house", displayName: "House flash", kind: "TATTOO_ARTIST", isPublished: true, acceptsEnquiries: true } });
    await testDb.artistProfile.update({ where: { slug: "app" }, data: { acceptsEnquiries: false } });                      // apprentices do not take enquiries
    const d = await createDesign(owner, { ...base, title: "House moth", apprenticeAvailable: true, artistId: house.id }, png());
    const page = await designById(d.id);
    expect(page!.design.artist.supervisees.map((a) => a.slug)).toEqual(["app"]);
    const r = await bookDesign(client1, { designId: d.id, size: "small", tier: "apprentice", placement: "thigh (outer)", declaredOver18: true });
    expect(r.artistId).toBe((await testDb.artistProfile.findUniqueOrThrow({ where: { slug: "app" } })).id);
    const off = await createDesign(owner, { ...base, title: "House plain", apprenticeAvailable: false, artistId: house.id }, png());
    expect((await designById(off.id))!.design.artist.supervisees).toEqual([]);
  });
});
