import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { listChannels, openDirect, channelMessages, sendMessage, unreadTotal, staffDirectory } from "@/lib/chat";
import { rangeFor, enquiriesReport, responseReport, bookingsReport, takingsReport, gamesReport, clientsReport, toCsv } from "@/lib/reports";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, email: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let owner: Principal, artistA: Principal, artistB: Principal, client1: Principal;

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  owner = principal(s.owner.id, "owner@test.local", ["OWNER"]);
  artistA = principal(s.artistUser.id, "a@test.local", ["RESIDENT_ARTIST"], s.artist.id);
  artistB = principal(s.artistBUser.id, "b@test.local", ["RESIDENT_ARTIST"], s.artistB.id);
  client1 = principal(s.c1.id, "c1@test.local", ["CLIENT"]);
});
afterAll(async () => { await testDb.$disconnect(); });

describe("staff chat", () => {
  it("artists see the studio channel but not management; owners see both; clients see nothing", async () => {
    expect((await listChannels(artistA)).map((c) => c.kind)).toEqual(["STUDIO"]);
    expect((await listChannels(owner)).map((c) => c.kind)).toEqual(["STUDIO", "MANAGEMENT"]);
    expect(await listChannels(client1)).toEqual([]);
    const mgmt = (await listChannels(owner)).find((c) => c.kind === "MANAGEMENT")!;
    await expect(sendMessage(artistA, mgmt.id, "sneaky")).rejects.toThrow();
    await expect(channelMessages(client1, mgmt.id)).rejects.toThrow();
  });

  it("messages land, unread counts move, reading clears them, and the sender is never unread to themselves", async () => {
    const studio = (await listChannels(artistA)).find((c) => c.kind === "STUDIO")!;
    await sendMessage(artistA, studio.id, "Morning all, kettle is on.");
    expect(await unreadTotal(owner)).toBe(1); expect(await unreadTotal(artistB)).toBe(1); expect(await unreadTotal(artistA)).toBe(0);
    const read = await channelMessages(owner, studio.id);
    expect(read.messages.map((m) => [m.body, m.senderName, m.mine])).toEqual([["Morning all, kettle is on.", "Artist A", false]]);
    expect(await unreadTotal(owner)).toBe(0);
    const since = read.messages[0].createdAt;
    await sendMessage(owner, studio.id, "Cheers.");
    expect((await channelMessages(artistB, studio.id, since)).messages.map((m) => m.body)).toEqual(["Cheers."]);
    await expect(sendMessage(artistA, studio.id, "   ")).rejects.toThrow(/Write something/);
    await expect(sendMessage(artistA, studio.id, "x".repeat(2001))).rejects.toThrow(/under 2000/);
  });

  it("direct messages are private to the two people and the owners; opening twice reuses the same channel", async () => {
    expect((await staffDirectory()).map((d) => d.name)).toEqual(expect.arrayContaining(["Artist A", "Artist B", "Owner"]));
    const dm = await openDirect(artistA, s.artistBUser.id);
    expect((await openDirect(artistB, s.artistUser.id)).id).toBe(dm.id);
    await expect(openDirect(artistA, s.artistUser.id)).rejects.toThrow(/other than yourself/);
    await expect(openDirect(artistA, s.c1.id)).rejects.toThrow(/not on the team/);
    await sendMessage(artistA, dm.id, "Can you cover Saturday?");
    expect((await listChannels(artistB)).find((c) => c.kind === "DIRECT")?.unread).toBe(1);
    expect((await channelMessages(artistB, dm.id)).channel.title).toBe("Artist A");
    expect((await listChannels(artistB)).find((c) => c.kind === "DIRECT")?.unread).toBe(0);     // reading clears it
    expect((await channelMessages(owner, dm.id)).messages[0].body).toBe("Can you cover Saturday?");   // owners can read direct messages
    const apprenticeUser = await testDb.user.create({ data: { email: "appr@test.local", name: "Appr", memberships: { create: { studioId: s.studio.id, roles: ["APPRENTICE"] } } } });
    await expect(channelMessages(principal(apprenticeUser.id, "appr@test.local", ["APPRENTICE"]), dm.id)).rejects.toThrow();  // other staff cannot
  });
});

describe("owner reports", () => {
  it("builds the period, counts enquiries, response times, bookings, takings, games and clients, and exports CSV", async () => {
    const now = new Date();
    const r = rangeFor("last_30", undefined, undefined, now);
    expect(r.from < now && r.to > now).toBe(true);
    const custom = rangeFor("custom", "2026-01-05", "2026-01-01");
    expect(custom.from < custom.to).toBe(true);
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600000);
    const booked = await testDb.bookingRequest.create({ data: { reference: "ENQ-R-1", studioId: s.studio.id, clientId: s.c1.id, artistId: s.artist.id, category: "TATTOO", source: "INSTAGRAM", status: "CONFIRMED", description: "t", declaredOver18: true, createdAt: twoHoursAgo, conversation: { create: { messages: { create: [{ senderId: s.c1.id, body: "Hi", createdAt: twoHoursAgo }, { senderId: s.artistUser.id, body: "Hello", createdAt: new Date(twoHoursAgo.getTime() + 3600000) }] } } } } });
    await testDb.bookingRequest.create({ data: { reference: "ENQ-R-2", studioId: s.studio.id, clientId: s.c2.id, artistId: s.artist.id, category: "PIERCING", source: "WEBSITE", status: "DECLINED", description: "t", declaredOver18: true, conversation: { create: {} } } });
    const appt = await testDb.appointment.create({ data: { reference: "RI-R-0001", category: "TATTOO", studioId: s.studio.id, requestId: booked.id, clientId: s.c1.id, artistId: s.artist.id, stationId: s.station.id, status: "COMPLETED", startsAt: now, endsAt: new Date(now.getTime() + 3600000), depositPence: 5000, depositPaidAt: now } });
    await testDb.payment.create({ data: { appointmentId: appt.id, clientId: s.c1.id, purpose: "DEPOSIT", method: "BANK_TRANSFER", status: "SUCCEEDED", amountPence: 5000 } });
    await testDb.payment.create({ data: { clientId: s.c1.id, purpose: "TIP", method: "CASH", status: "SUCCEEDED", amountPence: 500 } });
    await testDb.payment.create({ data: { clientId: s.c1.id, purpose: "BALANCE", method: "CARD_STRIPE", status: "FAILED", amountPence: 9999 } });
    await testDb.play.create({ data: { game: "gumball", visitorId: "v", status: "BOOKED", result: {} } });
    await testDb.play.create({ data: { game: "gumball", visitorId: "v2", status: "RESULT_SHOWN", result: {} } });

    const [byArtist, bySource] = await enquiriesReport(r);
    expect(byArtist.rows.find((x) => x[0] === "Artist A")).toEqual(["Artist A", 2, 1, "50%", 0, 1]);
    expect(bySource.rows.map((x) => x[0]).sort()).toEqual(["instagram", "website"]);
    const resp = await responseReport(r);
    const rowA = resp.rows.find((x) => x[0] === "Artist A")!;
    expect(rowA[1]).toBe(2); expect(rowA[2]).toBe(1); expect(rowA[3]).toBe(1); expect(rowA[5]).toBe(0);
    const book = await bookingsReport(r);
    expect(book.rows.find((x) => x[0] === "Artist A")).toEqual(["Artist A", 1, 1, 0, 0, 5000, 0]);
    const [purpose, method] = await takingsReport(r);
    expect(purpose.rows.find((x) => x[0] === "All")).toEqual(["All", 2, 5500]);        // the failed payment is not counted
    expect(method.rows.map((x) => x[0]).sort()).toEqual(["bank transfer", "cash"]);
    const games = await gamesReport(r);
    expect(games.rows.find((x) => x[0] === "Gumball machine")?.slice(3)).toEqual([2, 1, "50%"]);
    const clients = await clientsReport(r);
    expect(clients.rows.find((x) => x[0] === "Clients with a completed appointment")?.[1]).toBe(1);
    const csv = toCsv(purpose);
    expect(csv.split("\n")[0]).toBe("Purpose,Payments,Amount");
    expect(csv).toContain("All,2,55.00");
  });
});
