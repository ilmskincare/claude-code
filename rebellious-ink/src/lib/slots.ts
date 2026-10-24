import { DateTime } from "luxon";
import { STUDIO_TZ } from "./time";

export type Rule = { weekday: number; startMinute: number; endMinute: number; validFrom?: Date | null; validTo?: Date | null };
export type Busy = { startsAt: Date; endsAt: Date };
export type Slot = { startsAt: Date; endsAt: Date };

/**
 * Generates bookable start times for an artist between two dates.
 * Pure function: callers pass in availability rules, leave and existing
 * appointments/holds. All arithmetic is done in Europe/London so that the
 * clocks changing (BST ↔ GMT) does not shift a 10:00 appointment.
 */
export function generateSlots(opts: {
  from: Date;
  to: Date;
  durationMinutes: number; // total blocked time including buffers
  stepMinutes?: number;
  rules: Rule[];
  busy: Busy[];
  now?: Date;
  minNoticeHours?: number;
}): Slot[] {
  const step = opts.stepMinutes ?? 30;
  const now = opts.now ?? new Date();
  const earliest = now.getTime() + (opts.minNoticeHours ?? 24) * 3600 * 1000;
  const out: Slot[] = [];
  let day = DateTime.fromJSDate(opts.from, { zone: STUDIO_TZ }).startOf("day");
  const end = DateTime.fromJSDate(opts.to, { zone: STUDIO_TZ }).endOf("day");

  while (day <= end) {
    const weekday = day.weekday; // 1 = Monday
    const isoDay = day.toISODate()!;
    const dayRules = opts.rules.filter((r) => {
      if (r.weekday !== weekday) return false;
      // validFrom/validTo are calendar dates (stored at UTC midnight); compare by date, not instant, so BST offsets cannot shift them.
      if (r.validFrom && isoDay < DateTime.fromJSDate(r.validFrom, { zone: "utc" }).toISODate()!) return false;
      if (r.validTo && isoDay > DateTime.fromJSDate(r.validTo, { zone: "utc" }).toISODate()!) return false;
      return true;
    });
    for (const rule of dayRules) {
      for (let m = rule.startMinute; m + opts.durationMinutes <= rule.endMinute; m += step) {
        const startsAt = day.plus({ minutes: m });
        const endsAt = startsAt.plus({ minutes: opts.durationMinutes });
        if (startsAt.toMillis() < earliest) continue;
        const s = startsAt.toJSDate();
        const e = endsAt.toJSDate();
        const clash = opts.busy.some((b) => b.startsAt < e && b.endsAt > s);
        if (!clash) out.push({ startsAt: s, endsAt: e });
      }
    }
    day = day.plus({ days: 1 });
  }
  return out;
}
