import { DateTime } from "luxon";
import { db } from "./db";
import { STUDIO_TZ } from "./time";

/**
 * Owner dashboard figures computed from real rows. Distinguishes gross client
 * sales, studio receipts and cash-basis takings; never invents profit.
 */
export async function ownerDashboard(now = new Date()) {
  const today = DateTime.fromJSDate(now, { zone: STUDIO_TZ }).startOf("day");
  const weekStart = today.startOf("week");
  const [
    todaysAppointments, openEnquiries, awaitingDeposit, pendingManual,
    depositsToday, depositsWeek, confirmedWeek, cancelledWeek, noShowWeek, artists, recentAudit, sourceCounts,
    rentOverdue,
  ] = await Promise.all([
    db.appointment.findMany({ where: { startsAt: { gte: today.toJSDate(), lt: today.plus({ days: 1 }).toJSDate() }, status: { in: ["CONFIRMED", "CHECKED_IN", "IN_SESSION", "PENDING_DEPOSIT"] } }, include: { artist: true, client: { select: { name: true } } }, orderBy: { startsAt: "asc" } }),
    db.bookingRequest.count({ where: { status: { in: ["NEW", "NEEDS_INFORMATION", "IN_DISCUSSION", "QUOTED", "AWAITING_ACCEPTANCE"] } } }),
    db.bookingRequest.count({ where: { status: "AWAITING_DEPOSIT" } }),
    db.appointment.count({ where: { status: "PENDING_DEPOSIT" } }),
    db.payment.aggregate({ _sum: { amountPence: true }, where: { status: "SUCCEEDED", purpose: "DEPOSIT", verifiedAt: { gte: today.toJSDate() } } }),
    db.payment.aggregate({ _sum: { amountPence: true }, where: { status: "SUCCEEDED", verifiedAt: { gte: weekStart.toJSDate() } } }),
    db.appointment.count({ where: { status: { in: ["CONFIRMED", "COMPLETED", "CHECKED_IN", "IN_SESSION"] }, startsAt: { gte: weekStart.toJSDate(), lt: weekStart.plus({ weeks: 1 }).toJSDate() } } }),
    db.appointment.count({ where: { status: "CANCELLED", startsAt: { gte: weekStart.toJSDate(), lt: weekStart.plus({ weeks: 1 }).toJSDate() } } }),
    db.appointment.count({ where: { status: "NO_SHOW", startsAt: { gte: weekStart.toJSDate(), lt: weekStart.plus({ weeks: 1 }).toJSDate() } } }),
    db.artistProfile.findMany({ include: { user: { include: { memberships: { include: { compensationModels: { where: { effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] } } } } } }, appointments: { where: { startsAt: { gte: weekStart.toJSDate(), lt: weekStart.plus({ weeks: 1 }).toJSDate() }, status: { in: ["CONFIRMED", "COMPLETED", "CHECKED_IN", "IN_SESSION"] } }, select: { startsAt: true, endsAt: true, quotedPence: true } } } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.bookingRequest.groupBy({ by: ["source"], _count: { _all: true } }),
    db.chairRentCharge.count({ where: { status: "overdue" } }),
  ]);

  const depositsHeld = await db.financialLedgerEntry.aggregate({ _sum: { creditPence: true, debitPence: true }, where: { account: "CLIENT_DEPOSITS_HELD" } });
  const held = (depositsHeld._sum.creditPence ?? 0) - (depositsHeld._sum.debitPence ?? 0);

  return {
    today: today.toJSDate(),
    todaysAppointments,
    openEnquiries, awaitingDeposit, pendingManual,
    depositsTodayPence: depositsToday._sum.amountPence ?? 0,
    takingsWeekPence: depositsWeek._sum.amountPence ?? 0,
    depositsHeldPence: held,
    confirmedWeek, cancelledWeek, noShowWeek,
    artists: artists.map((a) => {
      const minutes = a.appointments.reduce((s, x) => s + (x.endsAt.getTime() - x.startsAt.getTime()) / 60000, 0);
      const model = a.user.memberships[0]?.compensationModels[0] ?? null;
      return { id: a.id, displayName: a.displayName, slug: a.slug, kind: a.kind, bookedHoursWeek: Math.round(minutes / 6) / 10, bookedValueWeekPence: a.appointments.reduce((s, x) => s + (x.quotedPence ?? 0), 0), model: model ? { type: model.type, weeklyRentPence: model.weeklyRentPence, studioPercent: model.studioPercent } : null };
    }),
    recentAudit,
    sources: sourceCounts.map((s) => ({ source: s.source, count: s._count._all })),
    rentOverdue,
  };
}

export async function artistDashboard(artistId: string, now = new Date()) {
  const today = DateTime.fromJSDate(now, { zone: STUDIO_TZ }).startOf("day");
  const [upcoming, inbox, earnings] = await Promise.all([
    db.appointment.findMany({ where: { artistId, startsAt: { gte: today.toJSDate() }, status: { in: ["CONFIRMED", "PENDING_DEPOSIT", "CHECKED_IN"] } }, include: { client: { select: { name: true } } }, orderBy: { startsAt: "asc" }, take: 10 }),
    db.bookingRequest.findMany({ where: { artistId, status: { in: ["NEW", "NEEDS_INFORMATION", "IN_DISCUSSION", "QUOTED", "AWAITING_ACCEPTANCE", "AWAITING_DEPOSIT"] } }, include: { client: { select: { name: true } } }, orderBy: { updatedAt: "desc" }, take: 20 }),
    db.payment.aggregate({ _sum: { amountPence: true }, where: { status: "SUCCEEDED", appointment: { artistId }, verifiedAt: { gte: today.startOf("month").toJSDate() } } }),
  ]);
  return { upcoming, inbox, depositsThisMonthPence: earnings._sum.amountPence ?? 0 };
}
