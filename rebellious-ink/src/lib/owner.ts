import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { audit } from "./audit";
import { sendEmail } from "./email";
import { env } from "./env";
import { formatStudio } from "./time";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { confirmAppointmentWithDeposit } from "./booking";
import { transitionRequest } from "./enquiries";

export const rescheduleSchema = z.object({
  startsAt: z.string().datetime({ offset: true }),
  reason: z.string().trim().min(5).max(500),
});

/** Owner/manager override: move an appointment. Requires a reason, writes audit, notifies client and artist. */
export async function rescheduleAppointment(p: Principal, appointmentId: string, input: z.infer<typeof rescheduleSchema>) {
  if (!can(p, "bookings.override")) throw new ForbiddenError();
  const newStart = new Date(input.startsAt);
  const result = await db.$transaction(async (tx) => {
    const a = await tx.appointment.findUnique({ where: { id: appointmentId }, include: { client: true, artist: { include: { user: true } } } });
    if (!a) throw new NotFoundError("Appointment not found");
    if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(a.status)) throw new ValidationError("This appointment can no longer be moved.");
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${a.artistId}))`;
    const duration = a.endsAt.getTime() - a.startsAt.getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    try {
      await tx.appointment.update({ where: { id: a.id }, data: { startsAt: newStart, endsAt: newEnd } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) throw new ValidationError("That time clashes with another booking for this artist or station.");
      throw e;
    }
    await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: "appointment.rescheduled", entityType: "Appointment", entityId: a.id, before: { startsAt: a.startsAt, endsAt: a.endsAt }, after: { startsAt: newStart, endsAt: newEnd }, reason: input.reason }, tx);
    return a;
  });
  const when = formatStudio(newStart);
  const recipients = [result.client, result.artist.user];
  await Promise.all(recipients.map((u) => sendEmail({
    to: u.email, userId: u.id, templateKey: "booking.rescheduled",
    subject: `Appointment ${result.reference} moved to ${when}`,
    text: `Appointment ${result.reference} has been moved to ${when}. Reason: ${input.reason}. Sign in for details: ${env().APP_BASE_URL}/login`,
    html: `<p>Appointment <strong>${result.reference}</strong> has been moved to <strong>${when}</strong>.</p><p>Reason: ${input.reason}</p><p><a href="${env().APP_BASE_URL}/login">Sign in for details</a></p>`,
    payload: { appointmentId: result.id },
  }).catch((e) => console.error("notify failed", e))));
  return result;
}

export const cancelSchema = z.object({
  reason: z.string().trim().min(5).max(500),
  depositOutcome: z.enum(["retained", "refunded", "credited", "pending_review"]),
});

export async function cancelAppointment(p: Principal, appointmentId: string, input: z.infer<typeof cancelSchema>) {
  if (!can(p, "bookings.cancel")) throw new ForbiddenError();
  const result = await db.$transaction(async (tx) => {
    const a = await tx.appointment.findUnique({ where: { id: appointmentId }, include: { client: true, request: true } });
    if (!a) throw new NotFoundError("Appointment not found");
    if (a.status === "CANCELLED") throw new ValidationError("Already cancelled.");
    await tx.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: input.reason } });
    await tx.cancellation.create({ data: { appointmentId: a.id, initiatedBy: "owner", reason: input.reason, depositOutcome: input.depositOutcome } });
    if (a.request && !["CANCELLED", "COMPLETED"].includes(a.request.status)) {
      await transitionRequest(tx, a.request.id, "CANCELLED", { userId: p.userId, label: `Owner: ${p.name ?? p.email}` }, input.reason);
    }
    await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: "appointment.cancelled", entityType: "Appointment", entityId: a.id, before: { status: a.status }, after: { status: "CANCELLED", depositOutcome: input.depositOutcome }, reason: input.reason }, tx);
    return a;
  });
  await sendEmail({
    to: result.client.email, userId: result.clientId, templateKey: "booking.cancelled",
    subject: `Appointment ${result.reference} cancelled`,
    text: `Your appointment ${result.reference} has been cancelled. Reason: ${input.reason}. Deposit: ${input.depositOutcome.replace("_", " ")}. Contact the studio with any questions.`,
    html: `<p>Your appointment <strong>${result.reference}</strong> has been cancelled.</p><p>Reason: ${input.reason}<br/>Deposit: ${input.depositOutcome.replace("_", " ")}</p>`,
    payload: { appointmentId: result.id },
  }).catch((e) => console.error("notify failed", e));
  return result;
}

export const manualDepositSchema = z.object({
  amountPounds: z.coerce.number().min(1),
  method: z.enum(["BANK_TRANSFER", "CASH"]),
  bankReference: z.string().trim().max(60).optional().or(z.literal("")),
  note: z.string().trim().min(3).max(300),
});

/** Record a deposit the finance user has actually seen on the bank statement / in the till. */
export async function verifyManualDeposit(p: Principal, appointmentId: string, input: z.infer<typeof manualDepositSchema>) {
  if (!can(p, "finance.verify_manual_payment")) throw new ForbiddenError();
  const res = await db.$transaction((tx) => confirmAppointmentWithDeposit(tx, {
    appointmentId,
    amountPence: Math.round(input.amountPounds * 100),
    method: input.method,
    verifiedById: p.userId,
    bankReference: input.bankReference || null,
    actorLabel: `Finance: ${p.name ?? p.email} (${input.note})`,
  }));
  return res;
}
