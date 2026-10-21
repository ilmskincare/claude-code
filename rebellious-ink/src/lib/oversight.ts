import { db } from "./db";
import { isPlaceholderEmail } from "./staff-auth";

/**
 * Owner oversight. The owners (or any addresses listed in oversight.copyTo) receive:
 *  - a blind copy of every client-facing transactional email (acknowledgements, quotes, bookings), never sign-in links or marketing;
 *  - a copy of every message posted in an enquiry thread, with the text, so they can see how artists are treating clients;
 *  - a morning digest that lists new enquiries, threads waiting on an artist for too long, unpaid deposits and today's appointments.
 * Nothing here widens what a client or artist can see; it only informs the studio's owners, who already have access to every thread.
 */
export const OVERSIGHT_DEFAULTS = { copyTo: [] as string[], copyEmails: true, copyMessages: true, digestEnabled: true, flakyHours: 24, depositHours: 48 };

/** Client-facing emails that owners are blind-copied on. Sign-in links and marketing are deliberately excluded. */
export const COPY_TEMPLATES = new Set(["enquiry.acknowledged", "enquiry.new_message", "quote.sent", "booking.confirmed", "booking.rescheduled", "booking.cancelled"]);

export async function oversightSettings() {
  const rows = await db.studioSetting.findMany({ where: { key: { startsWith: "oversight." } } });
  const v = Object.fromEntries(rows.map((r) => [r.key.replace("oversight.", ""), r.value]));
  const bool = (k: "copyEmails" | "copyMessages" | "digestEnabled") => (typeof v[k] === "boolean" ? (v[k] as boolean) : OVERSIGHT_DEFAULTS[k]);
  const num = (k: "flakyHours" | "depositHours") => (typeof v[k] === "number" && (v[k] as number) > 0 ? (v[k] as number) : OVERSIGHT_DEFAULTS[k]);
  const copyTo = Array.isArray(v.copyTo) ? (v.copyTo as unknown[]).filter((x): x is string => typeof x === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)).map((x) => x.toLowerCase()) : [];
  return { copyTo, copyEmails: bool("copyEmails"), copyMessages: bool("copyMessages"), digestEnabled: bool("digestEnabled"), flakyHours: num("flakyHours"), depositHours: num("depositHours") };
}

/** Who gets copies: the configured list, otherwise every active owner. Never the people in `exclude` (the sender or the recipient of the original). */
export async function copyRecipients(exclude: (string | null | undefined)[] = []) {
  const s = await oversightSettings();
  let list = s.copyTo;
  if (list.length === 0) {
    const owners = await db.membership.findMany({ where: { status: "ACTIVE", roles: { has: "OWNER" } }, include: { user: { select: { email: true } } } });
    list = owners.map((m) => m.user.email.toLowerCase());
  }
  const skip = new Set(exclude.filter((x): x is string => Boolean(x)).map((x) => x.toLowerCase()));
  return [...new Set(list)].filter((e) => !skip.has(e) && !isPlaceholderEmail(e));
}
