import { Prisma } from "@/generated/prisma/client";
import { db, type Tx } from "./db";
import { allocateReference } from "./references";
import { holdDesignForRequest, markDesignBooked, flashSettings } from "./flash";
import { generateSlots, type Slot } from "./slots";
import { DateTime } from "luxon";
import { STUDIO_TZ } from "./time";
import { assertTransition } from "./enquiry-state";
import { audit } from "./audit";
import { ValidationError, NotFoundError } from "./rbac";
import { postJournal, depositReceivedLines } from "./finance/ledger";

export const HOLD_MINUTES = 20;

/** Appointments that still block the diary: confirmed ones, and pending ones whose deposit window has not lapsed. */
function blockingAppointmentWhere(artistId: string, now: Date): Prisma.AppointmentWhereInput {
  return {
    artistId,
    OR: [
      { status: { in: ["CONFIRMED", "CHECKED_IN", "IN_SESSION"] } },
      { status: "PENDING_DEPOSIT", OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: now } }] },
    ],
  };
}

/** Lazily release lapsed pending appointments for one artist (called under the artist advisory lock). */
async function releaseLapsedForArtist(tx: Tx, artistId: string, now: Date) {
  const lapsed = await tx.appointment.findMany({ where: { artistId, status: "PENDING_DEPOSIT", holdExpiresAt: { lt: now } }, select: { id: true } });
  for (const a of lapsed) {
    await tx.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED", cancelledAt: now, cancelReason: "Deposit not received before hold expiry" } });
    await audit({ actorLabel: "System: hold expiry", action: "appointment.expired", entityType: "Appointment", entityId: a.id, before: { status: "PENDING_DEPOSIT" }, after: { status: "CANCELLED" } }, tx);
  }
  return lapsed.length;
}

/** Take a per-artist advisory lock for the rest of the transaction. */
async function lockArtist(tx: Tx, artistId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${artistId}))`;
}

/** Slots over the next six weeks from now. */
export async function upcomingSlots(artistId: string, durationMinutes: number) {
  const now = new Date();
  return availableSlots(artistId, now, new Date(now.getTime() + 42 * 86400000), durationMinutes, now);
}

export async function availableSlots(artistId: string, from: Date, to: Date, durationMinutes: number, now = new Date()): Promise<Slot[]> {
  const [rules, leave, appts, holds] = await Promise.all([
    db.availabilityRule.findMany({ where: { artistId, acceptsBookings: true } }),
    db.leave.findMany({ where: { artistId, endsAt: { gt: from }, startsAt: { lt: to } } }),
    db.appointment.findMany({
      where: { ...blockingAppointmentWhere(artistId, now), endsAt: { gt: from }, startsAt: { lt: to } },
      select: { startsAt: true, endsAt: true },
    }),
    db.bookingHold.findMany({
      where: { artistId, consumedAt: null, expiresAt: { gt: now }, endsAt: { gt: from }, startsAt: { lt: to } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);
  const slots = generateSlots({ from, to, durationMinutes, rules, busy: [...leave, ...appts, ...holds], now });
  return filterBySupervisor(db, artistId, slots, from, to);
}

/**
 * An apprentice may only be booked while their supervising artist is also in the studio:
 * every slot must sit inside one of the supervisor's working windows and outside their leave.
 */
export async function filterBySupervisor(client: Tx | typeof db, artistId: string, slots: Slot[], from: Date, to: Date): Promise<Slot[]> {
  if (slots.length === 0) return slots;
  const profile = await client.artistProfile.findUnique({ where: { id: artistId }, select: { supervisorId: true } });
  if (!profile?.supervisorId) return slots;
  const [rules, leave] = await Promise.all([
    client.availabilityRule.findMany({ where: { artistId: profile.supervisorId } }),
    client.leave.findMany({ where: { artistId: profile.supervisorId, endsAt: { gt: from }, startsAt: { lt: to } } }),
  ]);
  return slots.filter((s) => {
    const start = DateTime.fromJSDate(s.startsAt, { zone: STUDIO_TZ }), end = DateTime.fromJSDate(s.endsAt, { zone: STUDIO_TZ });
    const dayStart = start.startOf("day");
    const inWindow = rules.some((r) => {
      if (r.weekday !== start.weekday) return false;
      const iso = dayStart.toISODate()!;
      if (r.validFrom && iso < DateTime.fromJSDate(r.validFrom, { zone: "utc" }).toISODate()!) return false;
      if (r.validTo && iso > DateTime.fromJSDate(r.validTo, { zone: "utc" }).toISODate()!) return false;
      return start >= dayStart.plus({ minutes: r.startMinute }) && end <= dayStart.plus({ minutes: r.endMinute });
    });
    const onLeave = leave.some((l) => l.startsAt < s.endsAt && l.endsAt > s.startsAt);
    return inWindow && !onLeave;
  });
}

/**
 * Reserve a slot for a client who has accepted a quote. Runs under a per-artist
 * advisory lock so two clients racing for the same time are serialised; the
 * exclusion constraint on BookingHold is the backstop.
 */
export async function createHold(input: { requestId: string; clientId: string; startsAt: Date; now?: Date }) {
  const now = input.now ?? new Date();
  return db.$transaction(async (tx) => {
    const request = await tx.bookingRequest.findUnique({
      where: { id: input.requestId },
      include: { quotes: { where: { status: "ACCEPTED" }, orderBy: { version: "desc" }, take: 1 }, artist: true, service: true },
    });
    if (!request) throw new NotFoundError("Enquiry not found");
    if (request.clientId !== input.clientId) throw new NotFoundError("Enquiry not found");
    if (request.status !== "AWAITING_DEPOSIT") throw new ValidationError("This enquiry is not ready to book yet.");
    if (!request.artistId) throw new ValidationError("No artist assigned.");
    const quote = request.quotes[0];
    if (!quote) throw new ValidationError("No accepted quote.");
    if (request.category === "TATTOO" || request.category === "FLASH" || request.category === "MULTI_SESSION_PROJECT") {
      if (!request.declaredOver18) throw new ValidationError("Tattoo bookings require the client to be 18 or over.");
    }

    await lockArtist(tx, request.artistId);
    await tx.bookingHold.deleteMany({ where: { artistId: request.artistId, consumedAt: null, expiresAt: { lte: now } } });
    await releaseLapsedForArtist(tx, request.artistId, now);

    const setup = request.service?.setupMinutes ?? 15;
    const clean = request.service?.cleanMinutes ?? 15;
    const total = quote.estimatedMinutes + setup + clean;
    const endsAt = new Date(input.startsAt.getTime() + total * 60000);

    const [rules, leave, appts, holds] = await Promise.all([
      tx.availabilityRule.findMany({ where: { artistId: request.artistId, acceptsBookings: true } }),
      tx.leave.findMany({ where: { artistId: request.artistId, endsAt: { gt: input.startsAt }, startsAt: { lt: endsAt } } }),
      tx.appointment.findMany({ where: { ...blockingAppointmentWhere(request.artistId, now), endsAt: { gt: input.startsAt }, startsAt: { lt: endsAt } } }),
      tx.bookingHold.findMany({ where: { artistId: request.artistId, consumedAt: null, endsAt: { gt: input.startsAt }, startsAt: { lt: endsAt } } }),
    ]);
    const candidate = generateSlots({ from: input.startsAt, to: input.startsAt, durationMinutes: total, rules, busy: [...leave, ...appts, ...holds], now })
      .filter((s) => s.startsAt.getTime() === input.startsAt.getTime());
    const ok = (await filterBySupervisor(tx, request.artistId, candidate, input.startsAt, endsAt)).length > 0;
    if (!ok) throw new ValidationError("That time is no longer available. Please choose another slot.");
    // A one-off flash design stays reserved for this client while they pay.
    if (request.designId) await holdDesignForRequest(tx, request.designId, request.id, (await flashSettings(tx)).designHoldMinutes + HOLD_MINUTES, now);

    const hold = await tx.bookingHold.create({
      data: {
        requestId: request.id,
        clientId: input.clientId,
        artistId: request.artistId,
        stationId: request.artist?.defaultStationId ?? null,
        startsAt: input.startsAt,
        endsAt,
        expiresAt: new Date(now.getTime() + HOLD_MINUTES * 60000),
      },
    });
    return { hold, quote, request };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}

/**
 * Turn a hold into a PENDING_DEPOSIT appointment with a unique RI reference.
 * The appointment blocks the diary until the hold expiry; the deposit webhook
 * confirms it, or the expiry job releases it.
 */
export async function createPendingAppointmentFromHold(holdId: string, actor: { userId: string; label: string }) {
  return db.$transaction(async (tx) => {
    const hold = await tx.bookingHold.findUnique({ where: { id: holdId }, include: { request: { include: { quotes: { where: { status: "ACCEPTED" }, take: 1 } } } } });
    if (!hold || hold.consumedAt) throw new ValidationError("Hold not found or already used.");
    if (hold.expiresAt < new Date()) throw new ValidationError("Your hold has expired. Please choose a time again.");
    const quote = hold.request.quotes[0];
    if (!quote) throw new ValidationError("No accepted quote.");
    await lockArtist(tx, hold.artistId);
    await releaseLapsedForArtist(tx, hold.artistId, new Date());
    const reference = await allocateReference(tx, "RI");
    let appointment;
    try {
      appointment = await tx.appointment.create({
        data: {
          reference,
          studioId: hold.request.studioId,
          requestId: hold.requestId,
          clientId: hold.clientId,
          artistId: hold.artistId,
          stationId: hold.stationId,
          serviceId: hold.request.serviceId,
          category: hold.request.category,
          status: "PENDING_DEPOSIT",
          startsAt: hold.startsAt,
          endsAt: hold.endsAt,
          quotedPence: quote.amountPence,
          depositPence: quote.depositPence,
          holdExpiresAt: hold.expiresAt,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2002" || e.message.includes("no_overlap"))) {
        throw new ValidationError("That time has just been taken. Please choose another slot.");
      }
      throw e;
    }
    await tx.bookingHold.update({ where: { id: hold.id }, data: { consumedAt: new Date() } });
    await audit({ actorId: actor.userId, actorLabel: actor.label, action: "appointment.created_pending_deposit", entityType: "Appointment", entityId: appointment.id, after: { reference, startsAt: hold.startsAt } }, tx);
    return appointment;
  });
}

/**
 * Confirm an appointment because a deposit was verifiably recorded — either by
 * a signed Stripe webhook or by an authorised manual finance verification.
 * Idempotent: a second call for the same payment is a no-op.
 */
export async function confirmAppointmentWithDeposit(tx: Tx, input: {
  appointmentId: string;
  amountPence: number;
  method: "CARD_STRIPE" | "BANK_TRANSFER" | "CASH";
  providerRef?: string | null;
  providerEventId?: string | null;
  verifiedById?: string | null;
  bankReference?: string | null;
  actorLabel: string;
}) {
  const appt = await tx.appointment.findUnique({ where: { id: input.appointmentId }, include: { request: true } });
  if (!appt) throw new NotFoundError("Appointment not found");
  if (input.providerRef) {
    const existing = await tx.payment.findUnique({ where: { providerRef: input.providerRef } });
    if (existing?.status === "SUCCEEDED") return { appointment: appt, payment: existing, alreadyProcessed: true };
  }
  if (input.method !== "CARD_STRIPE" && !input.verifiedById) {
    throw new ValidationError("Manual deposits must be verified by an authorised finance user.");
  }
  if (input.amountPence < appt.depositPence) {
    throw new ValidationError(`Deposit of ${input.amountPence}p is less than the required ${appt.depositPence}p.`);
  }
  const payment = input.providerRef
    ? await tx.payment.upsert({
        where: { providerRef: input.providerRef },
        create: {
          appointmentId: appt.id, clientId: appt.clientId, purpose: "DEPOSIT", method: input.method, status: "SUCCEEDED",
          amountPence: input.amountPence, providerRef: input.providerRef, providerEventId: input.providerEventId ?? null,
          verifiedById: input.verifiedById ?? null, verifiedAt: new Date(), bankReference: input.bankReference ?? null,
        },
        update: { status: "SUCCEEDED", providerEventId: input.providerEventId ?? null, verifiedAt: new Date() },
      })
    : await tx.payment.create({
        data: {
          appointmentId: appt.id, clientId: appt.clientId, purpose: "DEPOSIT", method: input.method, status: "SUCCEEDED",
          amountPence: input.amountPence, verifiedById: input.verifiedById ?? null, verifiedAt: new Date(), bankReference: input.bankReference ?? null,
        },
      });

  await postJournal(tx, {
    description: `Deposit received for ${appt.reference}`,
    occurredAt: new Date(),
    lines: depositReceivedLines(input.amountPence, input.method),
    appointmentId: appt.id,
    paymentId: payment.id,
    artistId: appt.artistId,
    createdById: input.verifiedById ?? null,
  });

  const updated = appt.status === "PENDING_DEPOSIT"
    ? await tx.appointment.update({ where: { id: appt.id }, data: { status: "CONFIRMED", depositPaidAt: new Date(), holdExpiresAt: null } })
    : appt;

  if (appt.request && appt.request.status === "AWAITING_DEPOSIT") {
    assertTransition(appt.request.status, "CONFIRMED");
    await tx.bookingRequest.update({ where: { id: appt.request.id }, data: { status: "CONFIRMED" } });
    await markDesignBooked(tx, appt.request.id);
    await tx.enquiryStatusEvent.create({ data: { requestId: appt.request.id, fromStatus: "AWAITING_DEPOSIT", toStatus: "CONFIRMED", actorLabel: input.actorLabel, note: `Deposit ${input.method === "CARD_STRIPE" ? "card payment confirmed by Stripe" : "verified manually"}` } });
  }
  await audit({ actorId: input.verifiedById ?? null, actorLabel: input.actorLabel, action: "appointment.confirmed", entityType: "Appointment", entityId: appt.id, before: { status: appt.status }, after: { status: "CONFIRMED", paymentId: payment.id } }, tx);
  return { appointment: updated, payment, alreadyProcessed: false };
}

/** Release pending appointments and holds whose deposit window lapsed. Run by the scheduler. */
export async function expireLapsedHolds(now = new Date()) {
  const lapsed = await db.appointment.findMany({ where: { status: "PENDING_DEPOSIT", holdExpiresAt: { lt: now } }, include: { request: true } });
  for (const a of lapsed) {
    await db.$transaction(async (tx) => {
      await tx.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED", cancelledAt: now, cancelReason: "Deposit not received before hold expiry" } });
      await audit({ actorLabel: "System: hold expiry", action: "appointment.expired", entityType: "Appointment", entityId: a.id, before: { status: a.status }, after: { status: "CANCELLED" } }, tx);
    });
  }
  await db.bookingHold.deleteMany({ where: { consumedAt: null, expiresAt: { lt: now } } });
  await db.design.updateMany({ where: { status: "HELD", heldUntil: { lt: now } }, data: { status: "AVAILABLE", heldUntil: null, heldRequestId: null } });
  return lapsed.length;
}
