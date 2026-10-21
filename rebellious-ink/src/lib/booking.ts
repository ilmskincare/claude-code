import { Prisma } from "@/generated/prisma/client";
import { db, type Tx } from "./db";
import { allocateReference } from "./references";
import { generateSlots, type Slot } from "./slots";
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
    db.availabilityRule.findMany({ where: { artistId } }),
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
  return generateSlots({ from, to, durationMinutes, rules, busy: [...leave, ...appts, ...holds], now });
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
      tx.availabilityRule.findMany({ where: { artistId: request.artistId } }),
      tx.leave.findMany({ where: { artistId: request.artistId, endsAt: { gt: input.startsAt }, startsAt: { lt: endsAt } } }),
      tx.appointment.findMany({ where: { ...blockingAppointmentWhere(request.artistId, now), endsAt: { gt: input.startsAt }, startsAt: { lt: endsAt } } }),
      tx.bookingHold.findMany({ where: { artistId: request.artistId, consumedAt: null, endsAt: { gt: input.startsAt }, startsAt: { lt: endsAt } } }),
    ]);
    const ok = generateSlots({ from: input.startsAt, to: input.startsAt, durationMinutes: total, rules, busy: [...leave, ...appts, ...holds], now })
      .some((s) => s.startsAt.getTime() === input.startsAt.getTime());
    if (!ok) throw new ValidationError("That time is no longer available. Please choose another slot.");

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
  return lapsed.length;
}
