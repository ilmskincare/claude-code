import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { savePromotion, endPromotion, livePromotions, allPromotions } from "@/lib/promotions";
import { upsertProduct } from "@/lib/inventory";
import { getObject } from "@/lib/storage";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email: `${userId}@t`, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let owner: Principal, artistA: Principal, artistB: Principal;
const day = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  owner = principal(s.owner.id, ["OWNER"]);
  artistA = principal(s.artistUser.id, ["RESIDENT_ARTIST"], s.artist.id);
  artistB = principal(s.artistBUser.id, ["RESIDENT_ARTIST"], s.artistB.id);
});
afterAll(async () => { await testDb.$disconnect(); });

describe("promotions", () => {
  it("an artist runs their own promotion but not another's; the owner runs studio-wide ones; only live ones show publicly", async () => {
    const now = new Date();
    const mine = await savePromotion(artistA, { scope: "ARTIST", artistId: "", title: "20% off flash", details: "Weekdays only", code: "flash20", startsAt: iso(new Date(now.getTime() - day)), endsAt: iso(new Date(now.getTime() + 7 * day)) });
    expect(mine.artistId).toBe(s.artist.id); expect(mine.code).toBe("FLASH20");
    await expect(savePromotion(artistA, { scope: "ARTIST", artistId: s.artistB.id, title: "Hijack B", startsAt: iso(now) })).rejects.toThrow(/permission/i);
    await expect(savePromotion(artistA, { scope: "STUDIO", title: "Studio wide by artist", startsAt: iso(now) })).rejects.toThrow(/permission/i);
    await expect(savePromotion(owner, { scope: "ARTIST", artistId: s.artistB.id, title: "Bad dates", startsAt: iso(new Date(now.getTime() + 5 * day)), endsAt: iso(now) })).rejects.toThrow(/end must be after/);
    const studio = await savePromotion(owner, { scope: "STUDIO", title: "Free balm", details: "One per tattoo", startsAt: iso(new Date(now.getTime() - day)), endsAt: "" });
    const scheduled = await savePromotion(owner, { scope: "ARTIST", artistId: s.artistB.id, title: "Next month", startsAt: iso(new Date(now.getTime() + 10 * day)) });
    const deskOnly = await savePromotion(owner, { scope: "STUDIO", title: "Staff discount", startsAt: iso(new Date(now.getTime() - day)), showOnPublic: false });
    const live = await livePromotions();
    expect(live.studio.map((p) => p.id)).toEqual([studio.id]);                 // desk-only is excluded from the public site
    expect(live.byArtist.get(s.artist.id)?.id).toBe(mine.id);
    expect(live.byArtist.has(s.artistB.id)).toBe(false);                       // scheduled, not yet live
    const states = Object.fromEntries((await allPromotions()).map((p) => [p.id, p.state]));
    expect(states).toMatchObject({ [mine.id]: "live", [studio.id]: "live", [scheduled.id]: "scheduled", [deskOnly.id]: "live" });
    // Artist B cannot end A's promotion; A can, and it stops showing
    await expect(endPromotion(artistB, mine.id)).rejects.toThrow(/permission/i);
    await endPromotion(artistA, mine.id);
    expect((await livePromotions()).byArtist.has(s.artist.id)).toBe(false);
    expect((await allPromotions(s.artist.id))[0].state).toBe("ended");
    const audit = await testDb.auditLog.findMany({ where: { entityType: "Promotion", entityId: mine.id }, orderBy: { createdAt: "asc" } });
    expect(audit.map((a) => a.action)).toEqual(["promotion.created", "promotion.ended"]);
  });
});

describe("product photos", () => {
  it("stores an uploaded image against the product, refuses a PDF, and can remove it again", async () => {
    const base = { sku: "JEW-PIC", name: "Titanium ring", category: "jewellery" as const, unit: "each", reorderLevel: 1, costPounds: 3, artistPricePounds: 8, brand: "", colour: "", supplierName: "", material: "", gauge: "", length: "" };
    const png = new File([Buffer.from("89504e470d0a1a0a", "hex")], "ring.png", { type: "image/png" });
    const created = await upsertProduct(owner, base, undefined, png);
    expect(created.imageKey).toMatch(/^products\/.+\.png$/);
    expect((await getObject(created.imageKey!)).length).toBe(8);
    await expect(upsertProduct(owner, base, created.id, new File([Buffer.from("x")], "doc.pdf", { type: "application/pdf" }))).rejects.toThrow(/must be an image/);
    const kept = await upsertProduct(owner, { ...base, name: "Titanium ring 10 mm" }, created.id);
    expect(kept.imageKey).toBe(created.imageKey);                               // editing without a file keeps the photo
    const removed = await upsertProduct(owner, base, created.id, null, true);
    expect(removed.imageKey).toBeNull();
    await expect(upsertProduct(artistA, base, created.id, png)).rejects.toThrow(/permission/i);
  });
});
