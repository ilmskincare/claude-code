import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { copyRecipients, oversightSettings } from "@/lib/oversight";
import { sendEmail } from "@/lib/email";
import { postMessage } from "@/lib/enquiries";
import { digestData } from "@/lib/digest";
import { DateTime } from "luxon";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, email: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let artistA: Principal, client1: Principal;

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  artistA = principal(s.artistUser.id, "a@test.local", ["RESIDENT_ARTIST"], s.artist.id);
  client1 = principal(s.c1.id, "c1@test.local", ["CLIENT"]);
});
afterAll(async () => { await testDb.$disconnect(); });

describe("owner oversight", () => {
  it("copies default to every active owner, honour the configured list, and never include the excluded address", async () => {
    expect(await copyRecipients()).toEqual(["owner@test.local"]);
    expect(await copyRecipients(["OWNER@test.local"])).toEqual([]);
    await testDb.studioSetting.create({ data: { studioId: s.studio.id, key: "oversight.copyTo", value: ["Nikki@example.com", "sean@example.com", "not-an-email"] } });
    expect(await copyRecipients()).toEqual(["nikki@example.com", "sean@example.com"]);
    await testDb.studioSetting.deleteMany({ where: { key: "oversight.copyTo" } });
    expect((await oversightSettings()).flakyHours).toBe(24);
  });

  it("owners are blind-copied on client-facing emails, never on sign-in links", async () => {
    await sendEmail({ to: "c1@test.local", templateKey: "enquiry.acknowledged", subject: "Thanks", text: "t", html: "<p>t</p>" });
    await sendEmail({ to: "c1@test.local", templateKey: "auth.magic_link", subject: "Sign in", text: "t", html: "<p>t</p>" });
    const ack = await testDb.notification.findFirstOrThrow({ where: { templateKey: "enquiry.acknowledged", to: "c1@test.local" } });
    const link = await testDb.notification.findFirstOrThrow({ where: { templateKey: "auth.magic_link", to: "c1@test.local" } });
    expect((ack.payload as { bcc?: string[] }).bcc).toEqual(["owner@test.local"]);
    expect((link.payload as { bcc?: string[] }).bcc).toBeUndefined();
    await testDb.studioSetting.create({ data: { studioId: s.studio.id, key: "oversight.copyEmails", value: false } });
    await sendEmail({ to: "c1@test.local", templateKey: "quote.sent", subject: "Quote", text: "t", html: "<p>t</p>" });
    expect(((await testDb.notification.findFirstOrThrow({ where: { templateKey: "quote.sent" } })).payload as { bcc?: string[] }).bcc).toBeUndefined();
    await testDb.studioSetting.deleteMany({ where: { key: "oversight.copyEmails" } });
  });

  it("every thread message is copied to the owners with its text; the sender is never copied; internal notes are labelled", async () => {
    const r = await testDb.bookingRequest.create({ data: { reference: "ENQ-OV-1", studioId: s.studio.id, clientId: s.c1.id, artistId: s.artist.id, category: "TATTOO", status: "IN_DISCUSSION", description: "t", declaredOver18: true, conversation: { create: {} } } });
    await postMessage(artistA, r.id, "Hi, can you do Thursday at 2pm?");
    const copy = await testDb.notification.findFirstOrThrow({ where: { templateKey: "oversight.message_copy", to: "owner@test.local" }, orderBy: { createdAt: "desc" } });
    expect(copy.subject).toBe("Copy: message on ENQ-OV-1 from Artist Artist A");
    expect(await testDb.devMailbox.findFirst({ where: { subject: copy.subject ?? "" } })).toMatchObject({ text: expect.stringContaining("Thursday at 2pm") });
    await postMessage(client1, r.id, "Thursday works, see you then.");
    expect((await testDb.notification.findFirstOrThrow({ where: { templateKey: "oversight.message_copy", subject: { contains: "from Client" } } })).subject).toContain("Client One");
    await postMessage(artistA, r.id, "Note to self: bring the stencil.", "INTERNAL_ONLY");
    expect(await testDb.notification.count({ where: { templateKey: "oversight.message_copy", subject: { contains: "internal note on ENQ-OV-1" } } })).toBe(1);
    // The owner writing in a thread does not get a copy of their own message.
    const owner = principal(s.owner.id, "owner@test.local", ["OWNER"]);
    const before = await testDb.notification.count({ where: { templateKey: "oversight.message_copy" } });
    await postMessage(owner, r.id, "Owner here, all good.");
    expect(await testDb.notification.count({ where: { templateKey: "oversight.message_copy" } })).toBe(before);
    expect(await testDb.notification.count({ where: { templateKey: "oversight.message_copy", to: "a@test.local" } })).toBe(0);     // artists are never copied
  });

  it("the digest flags a client left waiting beyond the limit, an unpaid deposit, and today's appointments", async () => {
    const old = new Date(Date.now() - 30 * 3600000);
    const waiting = await testDb.bookingRequest.create({ data: { reference: "ENQ-OV-2", studioId: s.studio.id, clientId: s.c2.id, artistId: s.artist.id, category: "TATTOO", status: "IN_DISCUSSION", description: "t", declaredOver18: true, conversation: { create: { messages: { create: { senderId: s.c2.id, body: "Hello? Any update?", createdAt: old } } } } } });
    const answered = await testDb.bookingRequest.create({ data: { reference: "ENQ-OV-3", studioId: s.studio.id, clientId: s.c2.id, artistId: s.artist.id, category: "TATTOO", status: "IN_DISCUSSION", description: "t", declaredOver18: true, conversation: { create: { messages: { create: [{ senderId: s.c2.id, body: "Hello?", createdAt: old }, { senderId: s.artistUser.id, body: "Yes, Thursday.", createdAt: new Date(old.getTime() + 3600000) }] } } } } });
    const unpaid = await testDb.bookingRequest.create({ data: { reference: "ENQ-OV-4", studioId: s.studio.id, clientId: s.c2.id, artistId: s.artist.id, category: "TATTOO", status: "AWAITING_DEPOSIT", description: "t", declaredOver18: true, conversation: { create: {} } } });
    await testDb.$executeRaw`UPDATE "BookingRequest" SET "updatedAt" = now() - interval '60 hours' WHERE id = ${unpaid.id}`;
    const at = DateTime.now().setZone("Europe/London").set({ hour: 14, minute: 0, second: 0, millisecond: 0 }).toJSDate();   // 14:00 studio time, whatever the server clock
    await testDb.appointment.create({ data: { reference: "RI-OV-0001", category: "TATTOO", studioId: s.studio.id, requestId: unpaid.id, clientId: s.c2.id, artistId: s.artist.id, stationId: s.station.id, status: "CONFIRMED", startsAt: at, endsAt: new Date(at.getTime() + 3600000), depositPence: 5000, depositPaidAt: new Date() } });
    const d = await digestData();
    expect(d.waiting.map((w) => w.reference)).toContain("ENQ-OV-2");
    expect(d.waiting.find((w) => w.reference === "ENQ-OV-2")!.hours).toBeGreaterThanOrEqual(29);
    expect(d.waiting.map((w) => w.reference)).not.toContain("ENQ-OV-3");
    expect(d.unpaid.map((u) => u.reference)).toEqual(["ENQ-OV-4"]);
    expect(d.today).toHaveLength(1); expect(d.today[0]).toMatchObject({ at: "14:00", artist: "Artist A", paid: true });
    expect(d.fresh.map((f) => f.reference)).toEqual(expect.arrayContaining(["ENQ-OV-2", "ENQ-OV-3", "ENQ-OV-4"]));
    expect(waiting.id && answered.id).toBeTruthy();
  });
});
