import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { updateRateCard, addPriceItem, deskReference } from "@/lib/profiles";
import { upsertProduct, receiveStock } from "@/lib/inventory";
import { recordRetailSale } from "@/lib/retail";
import { ensureAccount, attachReferral, completeAppointment, redeemCredit, rewardsFor } from "@/lib/loyalty";
import { createEnquiry } from "@/lib/enquiries";
import { marketingAudience, setMarketingPreference, unsubscribeToken, verifyUnsubscribeToken, saveCampaign, sendCampaign } from "@/lib/marketing";
import { savePost, publishPost, postableAssets } from "@/lib/social";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email: `${userId}@t`, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let owner: Principal, artistA: Principal, artistB: Principal, desk: Principal;
let newClientId = "";

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  owner = principal(s.owner.id, ["OWNER"]);
  artistA = principal(s.artistUser.id, ["RESIDENT_ARTIST"], s.artist.id);
  artistB = principal(s.artistBUser.id, ["RESIDENT_ARTIST"], s.artistB.id);
  const deskUser = await testDb.user.create({ data: { email: "desk@test.local", name: "Desk" } });
  desk = principal(deskUser.id, ["RECEPTION"]);
});
afterAll(async () => { await testDb.$disconnect(); });

const card = { displayName: "Artist A", bio: "", instagramHandle: "", styles: ["blackwork"], stylesNotOffered: ["colour"], hourlyRateMin: 10000, hourlyRateMax: 12000, dayRate: 65000, minimumCharge: 8000, wontDo: "No faces.", placementsDeclined: ["face"], piercingsOffered: [], piercingsNotOffered: [], receptionNotes: "Day rate for sleeves.", acceptsEnquiries: true };

describe("rate cards (desk can answer the phone)", () => {
  it("an artist edits their own card, cannot edit another's, and the desk reference shows it", async () => {
    const updated = await updateRateCard(artistA, s.artist.id, card);
    expect(updated.hourlyRateMinPence).toBe(10000); expect(updated.dayRatePence).toBe(65000); expect(updated.placementsDeclined).toEqual(["face"]);
    await expect(updateRateCard(artistA, s.artistB.id, { ...card, displayName: "Hijack" })).rejects.toThrow(/forbid|permission|allowed/i);
    await expect(updateRateCard(artistA, s.artist.id, { ...card, hourlyRateMin: 12000, hourlyRateMax: 10000 })).rejects.toThrow(/maximum/);
    await updateRateCard(owner, s.artistB.id, { ...card, displayName: "Artist B", styles: ["piercing"], piercingsOffered: ["lobe", "helix"], piercingsNotOffered: ["tongue"], hourlyRateMin: null, hourlyRateMax: null, dayRate: null, minimumCharge: 2500 });
    await addPriceItem(owner, s.artistB.id, { name: "Lobe", category: "piercing", pricePounds: 25, includesJewellery: true });
    const ref = await deskReference();
    const a = ref.find((r) => r.id === s.artist.id)!, b = ref.find((r) => r.id === s.artistB.id)!;
    expect(a.receptionNotes).toBe("Day rate for sleeves."); expect(b.piercingsOffered).toContain("helix"); expect(b.priceList[0]).toMatchObject({ name: "Lobe", pricePence: 2500, includesJewellery: true });
    const audit = await testDb.auditLog.findFirst({ where: { action: "profile.rate_card_updated", entityId: s.artist.id } });
    expect(audit).not.toBeNull();
  });
});

describe("retail sales (jewellery leaves stock once and lands in the ledger)", () => {
  it("deducts FEFO, posts Dr CASH / Cr STOCK_SALES, refuses over-sale and other practitioners' books", async () => {
    const product = await upsertProduct(owner, { sku: "JEW-1", name: "Titanium labret", category: "jewellery", unit: "each", reorderLevel: 1, costPounds: 3.5, artistPricePounds: 6, brand: "", colour: "", supplierName: "", material: "titanium", gauge: "16g", length: "8 mm" });
    await receiveStock(owner, { productId: product.id, quantity: 3, lotNumber: "J1", expiresAt: "", reference: "" });
    const sale = await recordRetailSale(artistB, s.artistB.id, { productId: product.id, quantity: 2, unitPricePounds: 12, method: "CASH", clientName: "Walk-in", clientEmail: "", appointmentReference: "", note: "" });
    expect(sale.totalPence).toBe(2400);
    const lot = await testDb.inventoryLot.findFirstOrThrow({ where: { productId: product.id } });
    expect(lot.quantity).toBe(1);
    const lines = await testDb.financialLedgerEntry.findMany({ where: { entryGroupId: sale.ledgerGroupId! } });
    expect(lines.map((l) => [l.account, l.debitPence, l.creditPence]).sort()).toEqual([["CASH", 2400, 0], ["STOCK_SALES", 0, 2400]].sort());
    const movement = await testDb.stockMovement.findFirstOrThrow({ where: { lotId: lot.id, reason: "sold_to_client" } });
    expect(movement.delta).toBe(-2); expect(movement.artistId).toBe(s.artistB.id);
    await expect(recordRetailSale(artistB, s.artistB.id, { productId: product.id, quantity: 2, unitPricePounds: 12, method: "CASH", clientName: "", clientEmail: "", appointmentReference: "", note: "" })).rejects.toThrow(/Only 1/);
    await expect(recordRetailSale(artistA, s.artistB.id, { productId: product.id, quantity: 1, unitPricePounds: 12, method: "CASH", clientName: "", clientEmail: "", appointmentReference: "", note: "" })).rejects.toThrow(/forbid|permission|allowed/i);
    // The desk (stock.manage) may record on a practitioner's behalf.
    const bySm = await recordRetailSale(owner, s.artistB.id, { productId: product.id, quantity: 1, unitPricePounds: 12, method: "CARD_STRIPE", clientName: "", clientEmail: "", appointmentReference: "", note: "" });
    expect(bySm.practitionerId).toBe(s.artistB.id);
  });
});

describe("referral and loyalty (acceptance: rewards only on a completed first appointment)", () => {
  let referrerCode: string, apptId: string;
  it("attaches a referral from an enquiry code, ignores self-referral, and rewards both sides on completion", async () => {
    const referrer = await ensureAccount(s.c1.id);
    referrerCode = referrer.referralCode;
    expect(referrerCode).toMatch(/^[A-Z]{1,4}-[0-9A-F]{4}$/);
    const r = await createEnquiry({ name: "Newbie Friend", email: "newbie@test.local", category: "TATTOO", description: "A small fine line piece on the forearm please.", declaredOver18: true, privacyAccepted: true, referralCode: referrerCode.toLowerCase(), marketingOptIn: true, artistSlug: "a" }, []);
    newClientId = r.clientId;
    const referral = await testDb.referral.findFirstOrThrow({ where: { referrerId: referrer.id } });
    expect(referral.status).toBe("PENDING");
    // Self-referral is ignored, not rewarded
    await testDb.$transaction(async (tx) => { expect(await attachReferral(tx, s.c1.id, referrerCode)).toBeNull(); });
    // Nothing is paid until a completed appointment
    expect((await rewardsFor(s.c1.id)).account.balancePence).toBe(0);
    const startsAt = new Date(Date.now() + 7 * 86400000); startsAt.setUTCHours(10, 0, 0, 0);
    const appt = await testDb.appointment.create({ data: { reference: "RI-2026-000777", studioId: s.studio.id, clientId: newClientId, artistId: s.artist.id, category: "TATTOO", status: "CONFIRMED", startsAt, endsAt: new Date(startsAt.getTime() + 3600000), quotedPence: 15000, depositPence: 5000, requestId: r.id } });
    apptId = appt.id;
    // The other artist cannot complete it; the booked artist can.
    await expect(completeAppointment(artistB, appt.id, 15000)).rejects.toThrow(/forbid|permission|allowed/i);
    const done = await completeAppointment(artistA, appt.id, 15000);
    expect(done.rewards.join(" ")).toMatch(/earned £7.50/);
    expect(done.rewards.join(" ")).toMatch(/referral rewarded/);
    const referrerAfter = await rewardsFor(s.c1.id), newAfter = await rewardsFor(newClientId);
    expect(referrerAfter.account.balancePence).toBe(1000);          // referral bonus
    expect(newAfter.account.balancePence).toBe(1000 + 750);          // welcome credit + 5% of £150
    expect((await testDb.referral.findUniqueOrThrow({ where: { id: referral.id } })).status).toBe("REWARDED");
    expect((await testDb.appointment.findUniqueOrThrow({ where: { id: appt.id } })).status).toBe("COMPLETED");
    expect((await testDb.bookingRequest.findUniqueOrThrow({ where: { id: r.id } })).status).toBe("COMPLETED");
    await expect(completeAppointment(owner, appt.id, 15000)).rejects.toThrow(/Already completed/);
    const mail = await testDb.notification.findFirst({ where: { userId: s.c1.id, templateKey: "loyalty.referral_rewarded" } });
    expect(mail).not.toBeNull();
  });
  it("redeems credit within limits and only by the desk", async () => {
    const startsAt = new Date(Date.now() + 14 * 86400000); startsAt.setUTCHours(10, 0, 0, 0);
    const next = await testDb.appointment.create({ data: { reference: "RI-2026-000778", studioId: s.studio.id, clientId: newClientId, artistId: s.artist.id, category: "TATTOO", status: "CONFIRMED", startsAt, endsAt: new Date(startsAt.getTime() + 3600000), quotedPence: 10000, depositPence: 2000 } });
    await expect(redeemCredit(artistA, next.id, 500)).rejects.toThrow(/forbid|permission|allowed/i);
    await expect(redeemCredit(desk, next.id, 100)).rejects.toThrow(/Minimum/);
    await expect(redeemCredit(desk, next.id, 5000)).rejects.toThrow(/Only £17.50/);
    await redeemCredit(desk, next.id, 1000);
    expect((await testDb.appointment.findUniqueOrThrow({ where: { id: next.id } })).creditAppliedPence).toBe(1000);
    expect((await rewardsFor(newClientId)).account.balancePence).toBe(750);
    void apptId;
  });
});

describe("email marketing (opt-in only, unsubscribe is signed)", () => {
  it("builds the audience from the latest preference, sends once per recipient, and honours the unsubscribe token", async () => {
    // newbie opted in at enquiry; c1 has no preference; c2 opts in then out.
    await setMarketingPreference(s.c2.id, true, "portal");
    let audience = await marketingAudience();
    expect(audience.map((u) => u.email).sort()).toEqual(["c2@test.local", "newbie@test.local"]);
    await setMarketingPreference(s.c2.id, false, "portal");
    audience = await marketingAudience();
    expect(audience.map((u) => u.email)).toEqual(["newbie@test.local"]);
    // Artist filter: newbie enquired with artist A, so filtering by B yields nobody.
    expect(await marketingAudience({ artistId: s.artistB.id })).toEqual([]);
    const token = unsubscribeToken(newClientId);
    expect(verifyUnsubscribeToken(token)).toBe(newClientId);
    expect(verifyUnsubscribeToken(token.slice(0, -1) + "0")).toBeNull();
    const c = await saveCampaign(owner, { name: "Autumn flash", subject: "Flash day Saturday", body: "Hi {{name}},\n\nFlash day this Saturday.", artistId: "" });
    await expect(sendCampaign(artistA, c.id)).rejects.toThrow(/owner/i);
    const sent = await sendCampaign(owner, c.id);
    expect(sent.status).toBe("sent"); expect(sent.recipientCount).toBe(1); expect(sent.sentCount).toBe(1);
    await testDb.notification.findFirstOrThrow({ where: { userId: newClientId, templateKey: `campaign:${c.id}` } });
    const mail = await testDb.devMailbox.findFirstOrThrow({ where: { to: "newbie@test.local", subject: "Flash day Saturday" } });
    expect(mail.text).toContain("Hi Newbie Friend"); expect(mail.text).toContain("/unsubscribe/");
    await expect(sendCampaign(owner, c.id)).rejects.toThrow(/already been sent/);
    // Unsubscribing via the token removes them from the next audience
    await setMarketingPreference(verifyUnsubscribeToken(token)!, false, "unsubscribe_link");
    expect(await marketingAudience()).toEqual([]);
  });
});

describe("social posting (only images with permission on record)", () => {
  it("refuses assets without SOCIAL_MEDIA permission, drafts with one, and reports Buffer as not connected", async () => {
    const noPerm = await testDb.imageAsset.create({ data: { storageKey: "portfolio/a/no-perm.jpg", originalName: "x.jpg", mimeType: "image/jpeg", sizeBytes: 10, visibility: "PORTFOLIO_PUBLIC" } });
    const withPerm = await testDb.imageAsset.create({ data: { storageKey: "portfolio/a/ok.jpg", originalName: "y.jpg", mimeType: "image/jpeg", sizeBytes: 10, visibility: "PORTFOLIO_PUBLIC", permissions: { create: { purpose: "SOCIAL_MEDIA", granted: true } } } });
    await testDb.portfolioItem.createMany({ data: [{ artistId: s.artist.id, assetId: noPerm.id, publishedAt: new Date() }, { artistId: s.artist.id, assetId: withPerm.id, publishedAt: new Date() }] });
    expect((await postableAssets()).map((i) => i.assetId)).toEqual([withPerm.id]);
    await expect(savePost(owner, { caption: "Fresh blackwork", assetId: noPerm.id, scheduledFor: "", channels: [] })).rejects.toThrow(/permission on record/);
    await expect(savePost(artistA, { caption: "x", assetId: withPerm.id, scheduledFor: "", channels: [] })).rejects.toThrow(/forbid|permission|allowed/i);
    const post = await savePost(owner, { caption: "Fresh blackwork by Artist A", assetId: withPerm.id, scheduledFor: "", channels: ["chan-1"] });
    expect(post.status).toBe("DRAFT");
    delete process.env.BUFFER_ACCESS_TOKEN; delete process.env.BUFFER_ORGANIZATION_ID;
    await expect(publishPost(owner, post.id)).rejects.toThrow(/Buffer is not connected/);
  });
});
