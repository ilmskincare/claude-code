import { beforeAll, afterAll, describe, expect, it } from "vitest";
import Stripe from "stripe";
import { resetTestDatabase, seedMinimal, acceptedEnquiry, testDb } from "./helpers";
import { createHold, createPendingAppointmentFromHold } from "@/lib/booking";
import { handleStripeEvent } from "@/lib/stripe";
import { DateTime } from "luxon";

let s: Awaited<ReturnType<typeof seedMinimal>>;
beforeAll(async () => { await resetTestDatabase(); s = await seedMinimal(); });
afterAll(async () => { await testDb.$disconnect(); });

describe("Stripe webhook handling", () => {
  it("verifies signatures, confirms on checkout.session.completed and ignores replays", async () => {
    const r = await acceptedEnquiry(s.studio.id, s.c1.id, s.artist.id, s.artistUser.id, "ENQ-W-1");
    const slot = DateTime.now().setZone("Europe/London").plus({ days: 3 }).startOf("day").plus({ hours: 12 }).toJSDate();
    const { hold } = await createHold({ requestId: r.id, clientId: s.c1.id, startsAt: slot });
    const appt = await createPendingAppointmentFromHold(hold.id, { userId: s.c1.id, label: "test" });

    const payload = JSON.stringify({ id: "evt_test_1", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_test_abc", object: "checkout.session", payment_status: "paid", amount_total: 5000, metadata: { appointmentId: appt.id, reference: appt.reference } } } });
    const secret = "whsec_test_placeholder_not_real";
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
    // Signature verification exactly as the route performs it.
    expect(() => Stripe.webhooks.constructEvent(payload, header, "whsec_wrong")).toThrow();
    const event = Stripe.webhooks.constructEvent(payload, header, secret);

    const first = await handleStripeEvent(event);
    expect(first.outcome).toBe("confirmed");
    const replay = await handleStripeEvent(event);
    expect(replay.outcome).toBe("duplicate");
    const a = await testDb.appointment.findUniqueOrThrow({ where: { id: appt.id } });
    expect(a.status).toBe("CONFIRMED");
    expect(await testDb.payment.count({ where: { providerRef: "cs_test_abc", status: "SUCCEEDED" } })).toBe(1);
    expect(await testDb.webhookEvent.count({ where: { eventId: "evt_test_1" } })).toBe(1);
    // A confirmation email went to the client's outbox (dev mailbox in test).
    const mail = await testDb.devMailbox.findFirst({ where: { to: "c1@test.local", subject: { contains: appt.reference } } });
    expect(mail).not.toBeNull();
  });
});
