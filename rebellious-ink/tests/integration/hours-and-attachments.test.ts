import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { availableSlots } from "@/lib/booking";
import { addRule, addLeave, removeRule } from "@/lib/availability";
import { postMessage, loadRequestFor } from "@/lib/enquiries";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { DateTime } from "luxon";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email: `${userId}@test.local`, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });

beforeAll(async () => { await resetTestDatabase(); s = await seedMinimal(); });
afterAll(async () => { await testDb.$disconnect(); });

describe("artist hours", () => {
  it("walk-in-only hours are never offered as online slots; booking hours are", async () => {
    await testDb.availabilityRule.deleteMany({ where: { artistId: s.artist.id } });
    const me = principal(s.artistUser.id, ["RESIDENT_ARTIST"], s.artist.id);
    await addRule(me, s.artist.id, { weekday: 6, start: "12:00", end: "18:00", mode: "walk_ins", label: "", oneOffDate: "" });
    const from = new Date(), to = new Date(Date.now() + 14 * 86400000);
    expect(await availableSlots(s.artist.id, from, to, 60)).toHaveLength(0);
    const rule = await addRule(me, s.artist.id, { weekday: 6, start: "10:00", end: "12:00", mode: "bookings", label: "", oneOffDate: "" });
    const slots = await availableSlots(s.artist.id, from, to, 60);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((x) => DateTime.fromJSDate(x.startsAt, { zone: "Europe/London" }).hour < 12)).toBe(true);
    await removeRule(me, rule.id);
    expect(await availableSlots(s.artist.id, from, to, 60)).toHaveLength(0);
  });
  it("time off removes slots and reports clashing bookings; artist B cannot edit artist A's hours", async () => {
    const me = principal(s.artistUser.id, ["RESIDENT_ARTIST"], s.artist.id);
    const day = DateTime.now().setZone("Europe/London").plus({ days: 3 }).toISODate()!;
    await addRule(me, s.artist.id, { weekday: 1, start: "09:00", end: "17:00", mode: "bookings", label: "Extra day", oneOffDate: day });
    const before = await availableSlots(s.artist.id, new Date(), new Date(Date.now() + 5 * 86400000), 60);
    expect(before.length).toBeGreaterThan(0);
    const r = await addLeave(me, s.artist.id, { from: day, to: day, reason: "Convention" });
    expect(r.clashingAppointments).toBe(0);
    expect(await availableSlots(s.artist.id, new Date(), new Date(Date.now() + 5 * 86400000), 60)).toHaveLength(0);
    const other = principal(s.artistBUser.id, ["RESIDENT_ARTIST"], s.artistB.id);
    await expect(addRule(other, s.artist.id, { weekday: 2, start: "10:00", end: "12:00", mode: "bookings", label: "", oneOffDate: "" })).rejects.toThrow(/permission/);
  });
});

describe("consultation attachments", () => {
  it("client and artist can attach images to the thread; files are private and listed on the message", async () => {
    const req = await testDb.bookingRequest.create({ data: { reference: "ENQ-A-1", studioId: s.studio.id, clientId: s.c1.id, artistId: s.artist.id, category: "TATTOO", status: "NEW", description: "t", declaredOver18: true, conversation: { create: {} } } });
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
    const file = new File([png], "sketch.png", { type: "image/png" });
    const client = principal(s.c1.id, ["CLIENT"]);
    const m1 = await postMessage(client, req.id, "", "CLIENT_VISIBLE", [file]);
    expect(m1.body).toMatch(/1 image attached/);
    const artist = principal(s.artistUser.id, ["RESIDENT_ARTIST"], s.artist.id);
    await postMessage(artist, req.id, "Here is the stencil idea", "CLIENT_VISIBLE", [file, file]);
    const { request } = await loadRequestFor(artist, req.id);
    const msgs = request.conversation!.messages;
    expect(msgs[0].attachments).toHaveLength(1);
    expect(msgs[1].attachments).toHaveLength(2);
    expect(msgs[1].attachments[0].visibility).toBe("PRIVATE_REFERENCE");
    await expect(postMessage(client, req.id, "", "CLIENT_VISIBLE", [])).rejects.toThrow(/Write a message or attach/);
    await expect(postMessage(client, req.id, "x", "CLIENT_VISIBLE", [new File([png], "evil.exe", { type: "application/x-msdownload" })])).rejects.toThrow(/Only JPEG/);
  });
});
