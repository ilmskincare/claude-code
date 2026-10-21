/**
 * NON-PRODUCTION seed. Every person, email and image here is fictional and
 * labelled "(TEST)". The seed refuses to run when NODE_ENV=production.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SEED_DOCUMENTS } from "../src/content/documents";
import { SEED_SKILLS } from "../src/content/skills";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DateTime } from "luxon";
import { deflateSync } from "node:zlib";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed a production database.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// 1×1 PNG placeholders so galleries render without shipping real client photos.
function png(r: number, g: number, b: number) {
  const crc = (buf: Buffer) => { let c = ~0; for (const x of buf) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return (~c) >>> 0; };
  const chunk = (t: string, d: Buffer) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cc]); };
  const W = 64, H = 64; const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; for (let x = 0; x < W; x++) { const o = y * (W * 3 + 1) + 1 + x * 3; const f = ((x ^ y) & 8) ? 0.85 : 1; raw[o] = r * f; raw[o + 1] = g * f; raw[o + 2] = b * f; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

async function main() {
  const storageDir = path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || "./storage");
  const studio = await db.studio.upsert({ where: { slug: "rebellious-ink" }, create: { name: "Rebellious Ink (TEST STUDIO)", tradingName: "Rebellious Ink", slug: "rebellious-ink" }, update: {} });
  await db.legalEntity.upsert({ where: { id: "le-studio-test" }, create: { id: "le-studio-test", studioId: studio.id, name: "Rebellious Ink Ltd (TEST — legal entity unconfirmed)", isStudioEntity: true, country: "GB" }, update: {} });

  const stations = await Promise.all(["Station 1", "Station 2", "Piercing room"].map((name, i) => db.station.upsert({ where: { studioId_name: { studioId: studio.id, name } }, create: { studioId: studio.id, name, kind: i === 2 ? "PIERCING" : "TATTOO" }, update: {} })));

  const settings: [string, unknown][] = [["finance.monthlyOverheadsPence", 200000], ["finance.defaultWeeklyChairRentPence", 20000], ["finance.defaultStudioPercent", 40], ["pricing.tattooHourlyMinPence", 6000], ["pricing.tattooHourlyMaxPence", 8000], ["booking.holdMinutes", 20], ["booking.minNoticeHours", 24], ["booking.cancellationNoticeHours", 48], ["quote.requiresOwnerApproval", false], ["piercing.minimumAge", 18], ["studio.vatRegistered", false]];
  for (const [key, value] of settings) await db.studioSetting.upsert({ where: { studioId_key: { studioId: studio.id, key } }, create: { studioId: studio.id, key, value: value as object }, update: {} });

  async function person(email: string, name: string, roles: ("OWNER" | "RESIDENT_ARTIST" | "CHAIR_RENT_ARTIST" | "PIERCER" | "APPRENTICE" | "RECEPTION" | "CLIENT")[]) {
    const user = await db.user.upsert({ where: { email }, create: { email, name, emailVerified: new Date() }, update: { name } });
    if (roles.length && !roles.every((r) => r === "CLIENT")) await db.membership.upsert({ where: { userId_studioId: { userId: user.id, studioId: studio.id } }, create: { userId: user.id, studioId: studio.id, roles }, update: { roles } });
    await db.clientProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
    return user;
  }

  const owner = await person("owner@test.rebelliousink.local", "Nikki Owner (TEST)", ["OWNER"]);
  await person("desk@test.rebelliousink.local", "Dee Desk (TEST)", ["RECEPTION"]);
  const artistA = await person("artist-a@test.rebelliousink.local", "Artist A: Mo Blackwork (TEST)", ["CHAIR_RENT_ARTIST"]);
  const artistB = await person("artist-b@test.rebelliousink.local", "Artist B: Jay Colour (TEST)", ["RESIDENT_ARTIST"]);
  const piercer = await person("piercer@test.rebelliousink.local", "Sam Piercer (TEST)", ["PIERCER"]);
  const apprentice = await person("apprentice@test.rebelliousink.local", "Ash Apprentice (TEST)", ["APPRENTICE"]);
  const client1 = await person("client-one@test.rebelliousink.local", "Casey Client (TEST)", ["CLIENT"]);
  const client2 = await person("client-two@test.rebelliousink.local", "Riley Client (TEST)", ["CLIENT"]);

  async function artist(user: { id: string }, slug: string, displayName: string, kind: "TATTOO_ARTIST" | "PIERCER" | "APPRENTICE", styles: string[], bio: string, stationId: string, supervisorId?: string) {
    return db.artistProfile.upsert({ where: { slug }, create: { userId: user.id, slug, displayName, kind, styles, bio, isPublished: true, acceptsEnquiries: true, defaultStationId: stationId, supervisorId }, update: { displayName, styles, bio, defaultStationId: stationId, supervisorId } });
  }
  const a = await artist(artistA, "mo-blackwork", "Mo Blackwork (TEST)", "TATTOO_ARTIST", ["blackwork", "fine line", "geometric"], "Fictional test artist. Bold blackwork and precise fine line. Chair-rent arrangement (Model A).", stations[0].id);
  const b = await artist(artistB, "jay-colour", "Jay Colour (TEST)", "TATTOO_ARTIST", ["neo-traditional", "colour realism", "cover-ups"], "Fictional test artist. Saturated colour and cover-up specialist. Commission arrangement (Model B).", stations[1].id);
  const pz = await artist(piercer, "sam-piercer", "Sam Piercer (TEST)", "PIERCER", ["ear curation", "facial", "body"], "Fictional test piercer. Implant-grade titanium only.", stations[2].id);
  await artist(apprentice, "ash-apprentice", "Ash Apprentice (TEST)", "APPRENTICE", ["linework", "flash"], "Fictional apprentice. All client work is supervised by Mo.", stations[0].id, a.id);

  // Availability: Tue–Sat 10:00–18:00 for artists; piercer Wed–Sun 11:00–19:00.
  for (const [profile, days, s, e] of [[a, [2, 3, 4, 5, 6], 600, 1080], [b, [2, 3, 4, 5, 6], 600, 1080], [pz, [3, 4, 5, 6, 7], 660, 1140]] as const) {
    await db.availabilityRule.deleteMany({ where: { artistId: profile.id } });
    await db.availabilityRule.createMany({ data: days.map((weekday) => ({ artistId: profile.id, weekday, startMinute: s, endMinute: e })) });
  }

  // Compensation models (effective-dated; A = chair rent £200/wk, B = 60/40).
  const mA = await db.membership.findUniqueOrThrow({ where: { userId_studioId: { userId: artistA.id, studioId: studio.id } } });
  const mB = await db.membership.findUniqueOrThrow({ where: { userId_studioId: { userId: artistB.id, studioId: studio.id } } });
  if (!(await db.compensationModel.findFirst({ where: { membershipId: mA.id } }))) await db.compensationModel.create({ data: { membershipId: mA.id, type: "CHAIR_RENT_WEEKLY", weeklyRentPence: 20000, rentDueWeekday: 1, effectiveFrom: new Date("2026-01-05"), eligibleBase: {}, notes: "TEST: artist retains 100% of sales under own merchant account (to be confirmed).", suppliesIncluded: false, suppliesNote: "Buys consumables from studio stock at artist price." } });
  if (!(await db.compensationModel.findFirst({ where: { membershipId: mB.id } }))) await db.compensationModel.create({ data: { membershipId: mB.id, type: "COMMISSION_SPLIT", artistPercent: 60, studioPercent: 40, effectiveFrom: new Date("2026-01-05"), eligibleBase: { excludeVat: false, excludeTips: true, excludeCardFees: false, excludeMaterials: false }, notes: "TEST: 60/40 on gross service sales excluding tips.", suppliesIncluded: true, suppliesNote: "Studio consumables included; jewellery and retail excluded." } });

  // Portfolio placeholders with explicit publication permission on record.
  const colours: [number, number, number][] = [[140, 176, 0], [40, 44, 40], [95, 131, 0], [166, 209, 24], [30, 30, 30], [120, 150, 20]];
  let i = 0;
  for (const profile of [a, b, pz]) {
    for (let k = 0; k < 2; k++) {
      const key = `portfolio/seed/${profile.slug}-${k}.png`;
      await mkdir(path.dirname(path.join(storageDir, key)), { recursive: true });
      await writeFile(path.join(storageDir, key), png(...colours[i++ % colours.length]));
      const asset = await db.imageAsset.upsert({ where: { storageKey: key }, create: { storageKey: key, originalName: `${profile.slug}-${k}.png`, mimeType: "image/png", sizeBytes: 300, visibility: "PORTFOLIO_PUBLIC", scanStatus: "CLEAN", photographer: "Studio (TEST)", rightsHolder: profile.displayName, permissions: { create: { purpose: "PORTFOLIO_PUBLICATION", granted: true } } }, update: {} });
      const existing = await db.portfolioItem.findFirst({ where: { artistId: profile.id, assetId: asset.id } });
      if (!existing) await db.portfolioItem.create({ data: { artistId: profile.id, assetId: asset.id, caption: `Placeholder ${k + 1} (TEST — not real client work)`, styleTags: profile.styles.slice(0, 1), isHealed: k === 1, isCover: k === 0, sortOrder: k, publishedAt: new Date() } });
    }
  }

  // Document library v1 (unapproved drafts until practitioners sign off).
  for (const d of SEED_DOCUMENTS) {
    await db.documentTemplateVersion.upsert({ where: { templateKey_version: { templateKey: d.templateKey, version: 1 } }, create: { templateKey: d.templateKey, version: 1, kind: d.kind, title: d.title, procedureType: d.procedureType, bodyMarkdown: d.bodyMarkdown, ownerName: "Studio owner", issueDate: new Date("2026-10-21"), reviewDate: new Date("2027-04-21"), isCurrent: true }, update: { bodyMarkdown: d.bodyMarkdown, title: d.title } });
  }

  // Two example enquiries so dashboards are not empty (clearly test data).
  if (!(await db.bookingRequest.findFirst({ where: { reference: "ENQ-2026-000001" } }))) {
    const r1 = await db.bookingRequest.create({ data: { reference: "ENQ-2026-000001", studioId: studio.id, clientId: client1.id, artistId: a.id, category: "TATTOO", source: "WEBSITE", status: "IN_DISCUSSION", placement: "outer forearm", bodyMapZone: "Forearm", sizeCm: 15, style: "fine line", colour: "black_and_grey", description: "(TEST) A fine-line fern wrapping the outer forearm, about 15 cm.", budgetBand: "£250–£500", preferredDays: ["Sat"], declaredOver18: true, dateOfBirth: new Date("1994-05-02"), conversation: { create: { messages: { create: [{ senderId: client1.id, body: "(TEST) Hi Mo, I'd love a fern on my forearm. References attached." }, { senderId: artistA.id, body: "(TEST) Love it. Roughly 15 cm would take about two hours. I'll send a quote." }] } } }, statusEvents: { create: [{ toStatus: "NEW", actorLabel: "Client", note: "Enquiry submitted" }, { fromStatus: "NEW", toStatus: "IN_DISCUSSION", actorLabel: "Artist: Mo", note: "First reply sent" }] } } });
    void r1;
    await db.bookingRequest.create({ data: { reference: "ENQ-2026-000002", studioId: studio.id, clientId: client2.id, artistId: b.id, category: "TATTOO", source: "INSTAGRAM", status: "NEW", placement: "upper arm", bodyMapZone: "Upper arm", sizeCm: 20, style: "neo-traditional", colour: "colour", isCoverUp: true, description: "(TEST) Cover-up of an old tribal band with a neo-traditional peony.", declaredOver18: true, conversation: { create: {} }, statusEvents: { create: { toStatus: "NEW", actorLabel: "Client", note: "Enquiry submitted" } } } });
    await db.bookingReferenceCounter.upsert({ where: { prefix_year: { prefix: "ENQ", year: 2026 } }, create: { prefix: "ENQ", year: 2026, next: 3 }, update: { next: 3 } });
  }

  // One confirmed appointment next week for Artist B so the planner shows real rows.
  if (!(await db.appointment.findFirst({ where: { reference: "RI-2026-000001" } }))) {
    const start = DateTime.now().setZone("Europe/London").plus({ weeks: 1 }).startOf("week").plus({ days: 2, hours: 11 }); // next Wednesday 11:00
    const appt = await db.appointment.create({ data: { reference: "RI-2026-000001", studioId: studio.id, clientId: client2.id, artistId: b.id, stationId: stations[1].id, category: "TATTOO", status: "CONFIRMED", startsAt: start.toJSDate(), endsAt: start.plus({ hours: 3 }).toJSDate(), quotedPence: 24000, depositPence: 6000, depositPaidAt: new Date() } });
    const pay = await db.payment.create({ data: { appointmentId: appt.id, clientId: client2.id, purpose: "DEPOSIT", method: "BANK_TRANSFER", status: "SUCCEEDED", amountPence: 6000, verifiedById: owner.id, verifiedAt: new Date(), bankReference: "RI-2026-000001" } });
    await db.financialLedgerEntry.createMany({ data: [{ entryGroupId: "seed-dep-1", account: "BANK", debitPence: 6000, creditPence: 0, description: "Deposit received for RI-2026-000001 (TEST)", occurredAt: new Date(), appointmentId: appt.id, paymentId: pay.id, artistId: b.id }, { entryGroupId: "seed-dep-1", account: "CLIENT_DEPOSITS_HELD", debitPence: 0, creditPence: 6000, description: "Deposit received for RI-2026-000001 (TEST)", occurredAt: new Date(), appointmentId: appt.id, paymentId: pay.id, artistId: b.id }] });
    await db.bookingReferenceCounter.upsert({ where: { prefix_year: { prefix: "RI", year: 2026 } }, create: { prefix: "RI", year: 2026, next: 2 }, update: { next: 2 } });
  }
  // Skills catalogue + apprentice progress
  for (const [i, sk] of SEED_SKILLS.entries()) {
    await db.skill.upsert({ where: { key: sk.key }, create: { key: sk.key, area: sk.area, title: sk.title, description: sk.description, isCore: sk.isCore ?? true, sortOrder: i }, update: { title: sk.title, description: sk.description, isCore: sk.isCore ?? true, sortOrder: i, area: sk.area } });
  }
  const skillByKey = Object.fromEntries((await db.skill.findMany()).map((x) => [x.key, x.id]));
  if ((await db.skillProgress.count({ where: { apprenticeId: apprentice.id } })) === 0) {
    await db.skillProgress.createMany({ data: [
      { apprenticeId: apprentice.id, skillId: skillByKey["hyg-hand-hygiene"], status: "COMPETENT", signedOffById: artistA.id, signedOffAt: new Date("2026-09-10"), mentorNote: "(TEST) Observed over four sessions." },
      { apprenticeId: apprentice.id, skillId: skillByKey["hyg-station-setup"], status: "COMPETENT", signedOffById: artistA.id, signedOffAt: new Date("2026-09-17") },
      { apprenticeId: apprentice.id, skillId: skillByKey["hyg-clean-down"], status: "READY_FOR_REVIEW", apprenticeNote: "(TEST) Done solo three times this week." },
      { apprenticeId: apprentice.id, skillId: skillByKey["line-single-pass"], status: "IN_PROGRESS", apprenticeNote: "(TEST) Practice skin daily." },
    ] });
    await db.practiceLog.createMany({ data: [
      { apprenticeId: apprentice.id, date: new Date("2026-10-13"), minutes: 420, activity: "Station set-up, clean-down, practice skin linework", supervisorId: a.id, verifiedById: artistA.id, verifiedAt: new Date("2026-10-14") },
      { apprenticeId: apprentice.id, date: new Date("2026-10-15"), minutes: 360, activity: "Shadowing consultations; stencil practice", supervisorId: a.id, verifiedById: artistA.id, verifiedAt: new Date("2026-10-16") },
      { apprenticeId: apprentice.id, date: new Date("2026-10-20"), minutes: 300, activity: "Practice skin: single-pass lines, 3 and 5 liners", supervisorId: a.id },
    ] });
  }
  // Stock: a few products and lots
  const supplier = await db.supplier.upsert({ where: { id: "sup-test-1" }, create: { id: "sup-test-1", name: "Killer Ink Supplies (TEST)" }, update: {} });
  const products: [string, string, string, number, number | null, number | null, string | null][] = [
    ["INK-BLK-30", "Tattoo ink, lining black 30 ml (TEST)", "ink", 2, 1200, 1500, "Dynamic"],
    ["CART-RL-3", "Cartridges 3RL, box of 20 (TEST)", "cartridge", 5, 1800, 2200, "Cheyenne"],
    ["CART-RL-5", "Cartridges 5RL, box of 20 (TEST)", "cartridge", 5, 1800, 2200, "Cheyenne"],
    ["GLV-NIT-M", "Nitrile gloves, medium, box of 100 (TEST)", "glove", 3, 650, 800, null],
    ["FILM-2ND", "Adhesive film dressing roll 15 cm (TEST)", "dressing", 2, 2400, 3000, null],
    ["JEW-TI-16", "Titanium labret 16g 8 mm (TEST)", "jewellery", 4, 350, 1200, "Neometal"],
  ];
  for (const [sku, name, category, reorderLevel, costPence, retailPence, brand] of products) {
    const pr = await db.product.upsert({ where: { sku }, create: { sku, name, category, reorderLevel, costPence, retailPence, brand, supplierId: supplier.id, ...(category === "jewellery" ? { material: "ASTM F-136 titanium", gauge: "16g", length: "8 mm" } : {}) }, update: {} });
    if ((await db.inventoryLot.count({ where: { productId: pr.id } })) === 0) {
      const lot = await db.inventoryLot.create({ data: { productId: pr.id, lotNumber: `LOT-${sku}-A`, expiresAt: category === "ink" || category === "cartridge" ? new Date("2027-06-30") : null, quantity: category === "ink" ? 2 : 8 } });
      await db.stockMovement.create({ data: { lotId: lot.id, delta: lot.quantity, reason: "received", reference: "PO-TEST-001", actorId: owner.id } });
    }
  }
  await db.studioSetting.upsert({ where: { studioId_key: { studioId: studio.id, key: "academy.minimumHours" } }, create: { studioId: studio.id, key: "academy.minimumHours", value: 500 }, update: {} });

  console.log("Seeded fictional TEST data for studio", studio.id);
}

main().finally(() => db.$disconnect());
