import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const ruleSchema = z.object({
  weekday: z.coerce.number().int().min(1).max(7),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  mode: z.enum(["bookings", "walk_ins", "both"]).default("bookings"),
  label: z.string().trim().max(60).optional().or(z.literal("")),
  oneOffDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export const leaveSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(120).optional().or(z.literal("")),
});

export const minutes = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const hhmm = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/** Artists manage their own hours; owner/manager (roster.manage) manage anyone's. */
export async function assertCanManageHours(p: Principal, artistId: string) {
  if (can(p, "roster.manage")) return;
  if (p.artistProfileId && p.artistProfileId === artistId) return;
  throw new ForbiddenError();
}

export async function loadHours(artistId: string) {
  const [rules, leave] = await Promise.all([
    db.availabilityRule.findMany({ where: { artistId }, orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] }),
    db.leave.findMany({ where: { artistId, endsAt: { gte: new Date(Date.now() - 7 * 86400000) } }, orderBy: { startsAt: "asc" } }),
  ]);
  return { weekly: rules.filter((r) => !r.validFrom), oneOff: rules.filter((r) => r.validFrom), leave };
}

export async function addRule(p: Principal, artistId: string, input: z.infer<typeof ruleSchema>) {
  await assertCanManageHours(p, artistId);
  const startMinute = minutes(input.start), endMinute = minutes(input.end);
  if (endMinute <= startMinute) throw new ValidationError("End time must be after start time.");
  const oneOff = input.oneOffDate ? new Date(input.oneOffDate + "T00:00:00Z") : null;
  const weekday = oneOff ? ((oneOff.getUTCDay() + 6) % 7) + 1 : input.weekday;
  const rule = await db.availabilityRule.create({ data: {
    artistId, weekday, startMinute, endMinute,
    acceptsBookings: input.mode !== "walk_ins", acceptsWalkIns: input.mode !== "bookings",
    label: input.label || null, validFrom: oneOff, validTo: oneOff,
  } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "availability.rule_added", entityType: "AvailabilityRule", entityId: rule.id, after: rule });
  return rule;
}

export async function removeRule(p: Principal, ruleId: string) {
  const rule = await db.availabilityRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new NotFoundError();
  await assertCanManageHours(p, rule.artistId);
  await db.availabilityRule.delete({ where: { id: ruleId } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "availability.rule_removed", entityType: "AvailabilityRule", entityId: ruleId, before: rule });
}

export async function addLeave(p: Principal, artistId: string, input: z.infer<typeof leaveSchema>) {
  await assertCanManageHours(p, artistId);
  const { DateTime } = await import("luxon");
  const startsAt = DateTime.fromISO(input.from, { zone: "Europe/London" }).startOf("day");
  const endsAt = DateTime.fromISO(input.to, { zone: "Europe/London" }).endOf("day");
  if (!startsAt.isValid || !endsAt.isValid || endsAt < startsAt) throw new ValidationError("Check the dates.");
  const clash = await db.appointment.count({ where: { artistId, status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING_DEPOSIT"] }, startsAt: { lt: endsAt.toJSDate() }, endsAt: { gt: startsAt.toJSDate() } } });
  const leave = await db.leave.create({ data: { artistId, startsAt: startsAt.toJSDate(), endsAt: endsAt.toJSDate(), reason: input.reason || null } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "availability.leave_added", entityType: "Leave", entityId: leave.id, after: leave });
  return { leave, clashingAppointments: clash };
}

export async function removeLeave(p: Principal, leaveId: string) {
  const leave = await db.leave.findUnique({ where: { id: leaveId } });
  if (!leave) throw new NotFoundError();
  await assertCanManageHours(p, leave.artistId);
  await db.leave.delete({ where: { id: leaveId } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "availability.leave_removed", entityType: "Leave", entityId: leaveId, before: leave });
}
