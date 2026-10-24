import { DateTime, Interval } from "luxon";

export const STUDIO_TZ = process.env.STUDIO_TIMEZONE || "Europe/London";

export const toStudio = (d: Date) => DateTime.fromJSDate(d, { zone: STUDIO_TZ });

export function formatStudio(d: Date, fmt = "ccc d LLL yyyy, HH:mm") {
  return toStudio(d).toFormat(fmt);
}

export function formatDateUK(d: Date) {
  return toStudio(d).toFormat("dd/MM/yyyy");
}

export function studioDay(isoDate: string) {
  return DateTime.fromISO(isoDate, { zone: STUDIO_TZ }).startOf("day");
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return Interval.fromDateTimes(aStart, aEnd).overlaps(Interval.fromDateTimes(bStart, bEnd));
}

export function minutesBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}
