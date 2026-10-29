import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, acceptedEnquiry, testDb } from "./helpers";
import { createHold, createPendingAppointmentFromHold, confirmAppointmentWithDeposit, expireLapsedHolds } from "@/lib/booking";
import { DateTime } from "luxon";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const slot = DateTime.now().setZone("Europe/London").plus({ days: 7 }).startOf("day").plus({ hours: 10 }).toJSDate();

beforeAll(async () => { await resetTestDatabase(); s = await seedMinimal(); });
afterAll(async () => { await testDb.$disconnect(); });

describe("booking collisions (acceptance test 4)", () => {
  it("two clients racing for the same artist/time cannot both hold it", async () => {
    const r1 = await acceptedEnquiry(s.studio.id, s.c1.id, s.artist.id, s.artistUser.id, "ENQ-T-1");
    const r2 = await acceptedEnquiry(s.studio.id, s.c2.id, s.artist.id, s.artistUser.id, "ENQ-T-2");
    const results = await Promise.allSettled([
      createHold({ requestId: r1.id, clientId: s.c1.id, startsAt: slot }),
      createHold({ requestId: r2.id, clientId: s.c2.id, startsAt: slot }),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].reason.message).toMatch(/no longer available|just been taken/);
  });

  it("the exclusion constraint rejects a direct overlapping insert even if application checks are bypassed", async () => {
    const hold = await testDb.bookingHold.findFirstOrThrow({ where: { consumedAt: null } });
    const appt = await createPendingAppointmentFromHold(hold.id, { userId: s.c1.id, label: "test" });
    expect(appt.reference).toMatch(/^RI-\d{4}-\d{6}$/);
    await expect(testDb.appointment.create({ data: { reference: "RI-9999-999999", studioId: s.studio.id, clientId: s.c2.id, artistId: s.artist.id, category: "TATTOO", status: "CONFIRMED", startsAt: new Date(slot.getTime() + 30 * 60000), endsAt: new Date(slot.getTime() + 90 * 60000) } })).rejects.toThrow();
  });

  it("appointment stays PENDING_DEPOSIT until a verified deposit is recorded, then confirms idempotently (acceptance test 5)", async () => {
    const appt = await testDb.appointment.findFirstOrThrow({ where: { status: "PENDING_DEPOSIT" } });
    expect(appt.depositPaidAt).toBeNull();
    // Manual verification without a finance user is refused.
    await expect(testDb.$transaction((tx) => confirmAppointmentWithDeposit(tx, { appointmentId: appt.id, amountPence: 5000, method: "BANK_TRANSFER", actorLabel: "x" }))).rejects.toThrow(/authorised finance user/);
    // Underpayment is refused.
    await expect(testDb.$transaction((tx) => confirmAppointmentWithDeposit(tx, { appointmentId: appt.id, amountPence: 100, method: "CARD_STRIPE", providerRef: "cs_test_low", actorLabel: "x" }))).rejects.toThrow(/less than/);
    const first = await testDb.$transaction((tx) => confirmAppointmentWithDeposit(tx, { appointmentId: appt.id, amountPence: 5000, method: "CARD_STRIPE", providerRef: "cs_test_1", providerEventId: "evt_1", actorLabel: "System: Stripe webhook" }));
    expect(first.alreadyProcessed).toBe(false);
    expect(first.appointment.status).toBe("CONFIRMED");
    const second = await testDb.$transaction((tx) => confirmAppointmentWithDeposit(tx, { appointmentId: appt.id, amountPence: 5000, method: "CARD_STRIPE", providerRef: "cs_test_1", providerEventId: "evt_1_retry", actorLabel: "System: Stripe webhook" }));
    expect(second.alreadyProcessed).toBe(true);
    const payments = await testDb.payment.count({ where: { appointmentId: appt.id, status: "SUCCEEDED" } });
    expect(payments).toBe(1);
    const ledger = await testDb.financialLedgerEntry.findMany({ where: { appointmentId: appt.id } });
    expect(ledger.reduce((d, l) => d + l.debitPence, 0)).toBe(ledger.reduce((c, l) => c + l.creditPence, 0));
    expect(ledger.find((l) => l.account === "CLIENT_DEPOSITS_HELD")?.creditPence).toBe(5000);
    const request = await testDb.bookingRequest.findUniqueOrThrow({ where: { id: appt.requestId! } });
    expect(request.status).toBe("CONFIRMED");
    const auditRows = await testDb.auditLog.findMany({ where: { entityType: "Appointment", entityId: appt.id } });
    expect(auditRows.map((a) => a.action)).toContain("appointment.confirmed");
  });

  it("ledger rows are immutable at the database level", async () => {
    const row = await testDb.financialLedgerEntry.findFirstOrThrow();
    await expect(testDb.financialLedgerEntry.update({ where: { id: row.id }, data: { debitPence: 1 } })).rejects.toThrow(/immutable/);
    await expect(testDb.financialLedgerEntry.delete({ where: { id: row.id } })).rejects.toThrow(/immutable/);
  });

  it("lapsed holds release the slot and are audited", async () => {
    const r3 = await acceptedEnquiry(s.studio.id, s.c2.id, s.artist.id, s.artistUser.id, "ENQ-T-3");
    const later = new Date(slot.getTime() + 4 * 3600000);
    const { hold } = await createHold({ requestId: r3.id, clientId: s.c2.id, startsAt: later });
    const appt = await createPendingAppointmentFromHold(hold.id, { userId: s.c2.id, label: "test" });
    await testDb.appointment.update({ where: { id: appt.id }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
    const n = await expireLapsedHolds();
    expect(n).toBe(1);
    expect((await testDb.appointment.findUniqueOrThrow({ where: { id: appt.id } })).status).toBe("CANCELLED");
    const again = await createHold({ requestId: r3.id, clientId: s.c2.id, startsAt: later });
    expect(again.hold.startsAt.getTime()).toBe(later.getTime());
  });

  it("blocks a tattoo hold when the client has not declared 18+ (acceptance test 8)", async () => {
    const r = await testDb.bookingRequest.create({ data: { reference: "ENQ-T-U18", studioId: s.studio.id, clientId: s.c1.id, artistId: s.artist.id, category: "TATTOO", status: "AWAITING_DEPOSIT", description: "t", declaredOver18: false, conversation: { create: {} }, quotes: { create: { artistId: s.artist.id, issuedById: s.artistUser.id, status: "ACCEPTED", scope: "t", priceBasis: "fixed", amountPence: 100, depositPence: 50, estimatedMinutes: 30, termsVersion: "v1", termsText: "t" } } } });
    await expect(createHold({ requestId: r.id, clientId: s.c1.id, startsAt: new Date(slot.getTime() + 8 * 3600000) })).rejects.toThrow(/18 or over/);
  });
});
