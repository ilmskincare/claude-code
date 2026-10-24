import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { upsertProduct, receiveStock, issueToArtist, artistStockStatement, adjustStock, recordArtistStockPayment } from "@/lib/inventory";
import { logHours, verifyHours, updateSkill, apprenticeDashboard, signOffAsJuniorArtist, addEvidence } from "@/lib/academy";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email: `${userId}@t`, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let owner: Principal, apprentice: Principal, mentor: Principal, apprenticeUserId: string;

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  owner = principal(s.owner.id, ["OWNER"]);
  mentor = principal(s.artistUser.id, ["RESIDENT_ARTIST"], s.artist.id);
  const au = await testDb.user.create({ data: { email: "app@test.local", name: "Apprentice", memberships: { create: { studioId: s.studio.id, roles: ["APPRENTICE"] } }, artistProfile: { create: { slug: "app", displayName: "Apprentice", kind: "APPRENTICE", supervisorId: s.artist.id } } } });
  apprenticeUserId = au.id; apprentice = principal(au.id, ["APPRENTICE"], (await testDb.artistProfile.findUnique({ where: { userId: au.id } }))!.id);
  await testDb.skill.createMany({ data: [{ key: "core-1", area: "hygiene", title: "Core one", isCore: true }, { key: "core-2", area: "hygiene", title: "Core two", isCore: true }, { key: "opt-1", area: "colour", title: "Optional", isCore: false }] });
  await testDb.studioSetting.create({ data: { studioId: s.studio.id, key: "academy.minimumHours", value: 2 } });
  // Artist A: commission, supplies included. Artist B: chair rent, buys supplies.
  const mA = await testDb.membership.findFirstOrThrow({ where: { userId: s.artistUser.id } });
  const mB = await testDb.membership.findFirstOrThrow({ where: { userId: s.artistBUser.id } });
  await testDb.compensationModel.create({ data: { membershipId: mA.id, type: "COMMISSION_SPLIT", artistPercent: 60, studioPercent: 40, effectiveFrom: new Date("2026-01-01"), suppliesIncluded: true } });
  await testDb.compensationModel.create({ data: { membershipId: mB.id, type: "CHAIR_RENT_WEEKLY", weeklyRentPence: 20000, effectiveFrom: new Date("2026-01-01"), suppliesIncluded: false } });
});
afterAll(async () => { await testDb.$disconnect(); });

describe("inventory (acceptance test 13: stock leaves exactly once)", () => {
  it("receives into lots, issues free under an arrangement, sells with a ledger receivable, and refuses over-issue", async () => {
    const product = await upsertProduct(owner, { sku: "INK-1", name: "Black ink", category: "ink", unit: "bottle", reorderLevel: 1, costPounds: 10, artistPricePounds: 15, brand: "", colour: "", supplierName: "Supplier X", material: "", gauge: "", length: "" });
    await receiveStock(owner, { productId: product.id, quantity: 3, lotNumber: "L1", expiresAt: "2027-01-01", reference: "" });
    await receiveStock(owner, { productId: product.id, quantity: 4, lotNumber: "L2", expiresAt: "2026-12-01", reference: "" });
    // Artist A's arrangement includes supplies: free issue allowed
    const issued = await issueToArtist(owner, { productId: product.id, artistId: s.artist.id, quantity: 5, mode: "issued", note: "" });
    expect(issued.ledgerGroupId).toBeNull();
    // FEFO: lot L2 (earlier expiry) drained first (4), then 1 from L1
    const lots = await testDb.inventoryLot.findMany({ where: { productId: product.id }, orderBy: { lotNumber: "asc" } });
    expect(lots.map((l) => [l.lotNumber, l.quantity])).toEqual([["L1", 2], ["L2", 0]]);
    // Artist B buys: a reception user without owner override cannot issue free, but can sell
    const recUser = await testDb.user.create({ data: { email: "rec@test.local", name: "Reception" } });
    const reception = principal(recUser.id, ["STUDIO_MANAGER"]);
    await expect(issueToArtist(reception, { productId: product.id, artistId: s.artistB.id, quantity: 1, mode: "issued", note: "" })).rejects.toThrow(/does not include supplies/);
    const sale = await issueToArtist(reception, { productId: product.id, artistId: s.artistB.id, quantity: 2, mode: "sold", note: "" });
    expect(sale.unitPricePence).toBe(1500);
    expect(sale.ledgerGroupId).not.toBeNull();
    const st = await artistStockStatement(s.artistB.id);
    expect(st.owedPence).toBe(3000);
    // Nothing left: over-issue refused, stock total consistent
    await expect(issueToArtist(owner, { productId: product.id, artistId: s.artistB.id, quantity: 1, mode: "sold", note: "" })).rejects.toThrow(/Only 0/);
    const movements = await testDb.stockMovement.findMany({ where: { lot: { productId: product.id } } });
    expect(movements.reduce((t, m) => t + m.delta, 0)).toBe(0);
    // Payment reduces what is owed; adjusting below zero is refused
    await recordArtistStockPayment(owner, s.artistB.id, 3000, "CASH", "Paid at desk");
    expect((await artistStockStatement(s.artistB.id)).owedPence).toBe(0);
    await expect(adjustStock(owner, { lotId: lots[0].id, delta: -5, reason: "shrinkage", note: "dropped" })).rejects.toThrow(/Only 0 left/);
  });
  it("artists cannot manage stock", async () => {
    await expect(upsertProduct(mentor, { sku: "X", name: "Nope", category: "other", unit: "each", reorderLevel: 0, brand: "", colour: "", supplierName: "", material: "", gauge: "", length: "" })).rejects.toThrow(/permission/);
  });
});

describe("apprentice portal (acceptance test 14: no self-certification)", () => {
  it("apprentice logs hours and marks skills ready, but cannot verify hours or sign off skills", async () => {
    const log = await logHours(apprentice, apprenticeUserId, { date: "2026-10-20", hours: 1.5, activity: "Practice skin", notes: "", supervisorId: s.artist.id });
    await expect(verifyHours(apprentice, log.id, "verify")).rejects.toThrow(/permission|own hours/);
    const skills = await testDb.skill.findMany();
    const core1 = skills.find((x) => x.key === "core-1")!;
    await updateSkill(apprentice, apprenticeUserId, core1.id, "READY_FOR_REVIEW", "done it");
    await expect(updateSkill(apprentice, apprenticeUserId, core1.id, "COMPETENT")).rejects.toThrow(/mentor or the owner/);
    const d = await apprenticeDashboard(apprenticeUserId);
    expect(d.verifiedMinutes).toBe(0); expect(d.pendingMinutes).toBe(90); expect(d.coreCompetent).toBe(0);
  });
  it("artist B (not the supervisor) cannot touch the record; the supervisor can verify and sign off", async () => {
    const other = principal(s.artistBUser.id, ["RESIDENT_ARTIST"], s.artistB.id);
    const log = (await testDb.practiceLog.findFirst({ where: { apprenticeId: apprenticeUserId } }))!;
    await expect(verifyHours(other, log.id, "verify")).rejects.toThrow(/permission/);
    await verifyHours(mentor, log.id, "verify");
    const skills = await testDb.skill.findMany();
    for (const k of ["core-1"]) await updateSkill(mentor, apprenticeUserId, skills.find((x) => x.key === k)!.id, "COMPETENT", "Observed");
    const d = await apprenticeDashboard(apprenticeUserId);
    expect(d.verifiedMinutes).toBe(90); expect(d.coreCompetent).toBe(1);
  });
  it("junior sign-off is owner-only and blocked until hours and all core skills are met; then it promotes the profile", async () => {
    await expect(signOffAsJuniorArtist(mentor, apprenticeUserId, { statement: "Ready in my view, twenty chars.", conditions: "", confirm: "SIGN OFF" })).rejects.toThrow(/owner/);
    await expect(signOffAsJuniorArtist(owner, apprenticeUserId, { statement: "Ready in my view, twenty chars.", conditions: "", confirm: "SIGN OFF" })).rejects.toThrow(/more verified hours/);
    const log2 = await logHours(apprentice, apprenticeUserId, { date: "2026-10-21", hours: 1, activity: "More practice", notes: "", supervisorId: "" });
    await verifyHours(mentor, log2.id, "verify");
    await expect(signOffAsJuniorArtist(owner, apprenticeUserId, { statement: "Ready in my view, twenty chars.", conditions: "", confirm: "SIGN OFF" })).rejects.toThrow(/core skill/);
    const skills = await testDb.skill.findMany();
    await updateSkill(mentor, apprenticeUserId, skills.find((x) => x.key === "core-2")!.id, "COMPETENT", "Observed twice");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
    const ev = await addEvidence(apprentice, apprenticeUserId, { caption: "Lines", stage: "practice_skin", skillId: "" }, [new File([png], "lines.png", { type: "image/png" })]);
    expect(ev).toHaveLength(1);
    const row = await signOffAsJuniorArtist(owner, apprenticeUserId, { statement: "Consistently clean work under supervision.", conditions: "Supervised colour until March", confirm: "SIGN OFF" });
    expect(row.verifiedMinutes).toBe(150);
    expect((await testDb.artistProfile.findUnique({ where: { userId: apprenticeUserId } }))!.kind).toBe("JUNIOR_ARTIST");
    expect((await testDb.membership.findFirst({ where: { userId: apprenticeUserId } }))!.roles).toEqual(["RESIDENT_ARTIST"]);
    await expect(signOffAsJuniorArtist(owner, apprenticeUserId, { statement: "Again please twenty characters.", conditions: "", confirm: "SIGN OFF" })).rejects.toThrow(/Already/);
  });
});
