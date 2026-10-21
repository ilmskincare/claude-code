import { DateTime } from "luxon";
import { db } from "./db";
import { sendEmail } from "./email";
import { env } from "./env";
import { STUDIO_TZ } from "./time";
import { formatPence } from "./money";
import { copyRecipients, oversightSettings } from "./oversight";

const OPEN = ["NEW", "NEEDS_INFORMATION", "IN_DISCUSSION", "QUOTED", "AWAITING_ACCEPTANCE"] as const;
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

/** What the owners need to see each morning. Pure data so it can be tested without sending. */
export async function digestData(now = new Date()) {
  const s = await oversightSettings();
  const since = new Date(now.getTime() - 24 * 3600000);
  const [fresh, open, unpaid, today] = await Promise.all([
    db.bookingRequest.findMany({ where: { createdAt: { gte: since } }, include: { client: { select: { name: true, email: true } }, artist: { select: { displayName: true } } }, orderBy: { createdAt: "desc" } }),
    db.bookingRequest.findMany({ where: { status: { in: [...OPEN] } }, include: { client: { select: { name: true } }, artist: { select: { displayName: true } }, conversation: { include: { messages: { where: { visibility: "CLIENT_VISIBLE" }, orderBy: { createdAt: "desc" }, take: 1 } } } } }),
    db.bookingRequest.findMany({ where: { status: "AWAITING_DEPOSIT", updatedAt: { lt: new Date(now.getTime() - s.depositHours * 3600000) } }, include: { client: { select: { name: true } }, artist: { select: { displayName: true } } }, orderBy: { updatedAt: "asc" } }),
    (() => { const d = DateTime.fromJSDate(now, { zone: STUDIO_TZ }); return db.appointment.findMany({ where: { startsAt: { gte: d.startOf("day").toJSDate(), lt: d.endOf("day").toJSDate() }, status: { in: ["PENDING_DEPOSIT", "CONFIRMED", "CHECKED_IN", "IN_SESSION"] } }, include: { artist: { select: { displayName: true } }, client: { select: { name: true } } }, orderBy: { startsAt: "asc" } }); })(),
  ]);
  const cutoff = now.getTime() - s.flakyHours * 3600000;
  const waiting = open.flatMap((r) => {
    const last = r.conversation?.messages[0];
    // Waiting on the studio when the client wrote last (or nobody has replied to a new enquiry) and that was longer ago than the limit.
    const clientLast = last ? last.senderId === r.clientId : true;
    const at = last ? last.createdAt : r.createdAt;
    if (!clientLast || at.getTime() > cutoff) return [];
    return [{ id: r.id, reference: r.reference, client: r.client.name ?? "client", artist: r.artist?.displayName ?? "unassigned", status: r.status, hours: Math.floor((now.getTime() - at.getTime()) / 3600000) }];
  }).sort((a, b) => b.hours - a.hours);
  return {
    settings: s,
    fresh: fresh.map((r) => ({ id: r.id, reference: r.reference, client: r.client.name ?? r.client.email, artist: r.artist?.displayName ?? "match me", category: r.category })),
    waiting,
    unpaid: unpaid.map((r) => ({ id: r.id, reference: r.reference, client: r.client.name ?? "client", artist: r.artist?.displayName ?? "unassigned", hours: Math.floor((now.getTime() - r.updatedAt.getTime()) / 3600000) })),
    today: today.map((a) => ({ id: a.id, at: DateTime.fromJSDate(a.startsAt, { zone: STUDIO_TZ }).toFormat("HH:mm"), artist: a.artist.displayName, client: a.client.name ?? "client", status: a.status, depositPence: a.depositPence, paid: Boolean(a.depositPaidAt) })),
  };
}

/** Sends the morning digest to the owners. Returns what was sent and to whom. */
export async function sendDailyDigest(now = new Date()) {
  const d = await digestData(now);
  if (!d.settings.digestEnabled) return { sent: 0, to: [] as string[], data: d };
  const to = await copyRecipients();
  if (to.length === 0) return { sent: 0, to, data: d };
  const base = env().APP_BASE_URL;
  const day = DateTime.fromJSDate(now, { zone: STUDIO_TZ }).setLocale("en-GB").toFormat("cccc d LLLL");
  const sec = (title: string, lines: string[], empty: string) => `${title}\n${lines.length ? lines.map((l) => `  - ${l}`).join("\n") : `  ${empty}`}\n\n`;
  const text =
    `Rebellious Ink: ${day}\n\n` +
    sec(`Waiting on an artist for more than ${d.settings.flakyHours} hours (${d.waiting.length})`, d.waiting.map((w) => `${w.reference}: ${w.client} has waited ${w.hours}h for ${w.artist} (${w.status.toLowerCase().replace(/_/g, " ")}) ${base}/owner/enquiries/${w.id}`), "Nobody is waiting. Good.") +
    sec(`New enquiries in the last 24 hours (${d.fresh.length})`, d.fresh.map((f) => `${f.reference}: ${f.client}, ${f.category.toLowerCase()}, for ${f.artist} ${base}/owner/enquiries/${f.id}`), "None.") +
    sec(`Deposits unpaid for more than ${d.settings.depositHours} hours (${d.unpaid.length})`, d.unpaid.map((u) => `${u.reference}: ${u.client} with ${u.artist}, ${u.hours}h ${base}/owner/enquiries/${u.id}`), "None.") +
    sec(`Today's appointments (${d.today.length})`, d.today.map((t) => `${t.at} ${t.artist}: ${t.client}, deposit ${formatPence(t.depositPence)} ${t.paid ? "paid" : "NOT PAID"}`), "None booked.") +
    `Open everything: ${base}/owner/enquiries\nThis digest goes to the studio's owners. Change who gets it, or switch it off, under Settings.`;
  const li = (lines: string[], empty: string) => (lines.length ? `<ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>` : `<p><em>${esc(empty)}</em></p>`);
  const html =
    `<h2>Rebellious Ink: ${esc(day)}</h2>` +
    `<h3>Waiting on an artist for more than ${d.settings.flakyHours} hours (${d.waiting.length})</h3>` + li(d.waiting.map((w) => `<a href="${base}/owner/enquiries/${w.id}">${esc(w.reference)}</a>: ${esc(w.client)} has waited <strong>${w.hours}h</strong> for ${esc(w.artist)} (${esc(w.status.toLowerCase().replace(/_/g, " "))})`), "Nobody is waiting. Good.") +
    `<h3>New enquiries in the last 24 hours (${d.fresh.length})</h3>` + li(d.fresh.map((f) => `<a href="${base}/owner/enquiries/${f.id}">${esc(f.reference)}</a>: ${esc(f.client)}, ${esc(f.category.toLowerCase())}, for ${esc(f.artist)}`), "None.") +
    `<h3>Deposits unpaid for more than ${d.settings.depositHours} hours (${d.unpaid.length})</h3>` + li(d.unpaid.map((u) => `<a href="${base}/owner/enquiries/${u.id}">${esc(u.reference)}</a>: ${esc(u.client)} with ${esc(u.artist)}, ${u.hours}h`), "None.") +
    `<h3>Today's appointments (${d.today.length})</h3>` + li(d.today.map((t) => `${t.at} ${esc(t.artist)}: ${esc(t.client)}, deposit ${formatPence(t.depositPence)} ${t.paid ? "paid" : "<strong>not paid</strong>"}`), "None booked.") +
    `<p><a href="${base}/owner/enquiries">Open everything</a></p><p style="color:#666;font-size:12px">This digest goes to the studio's owners. Change who gets it, or switch it off, under Settings.</p>`;
  let sent = 0;
  for (const addr of to) { await sendEmail({ to: addr, templateKey: "oversight.daily_digest", subject: `Studio digest: ${d.waiting.length} waiting, ${d.fresh.length} new, ${d.today.length} today`, text, html, payload: { waiting: d.waiting.length, fresh: d.fresh.length, unpaid: d.unpaid.length, today: d.today.length } }); sent++; }
  return { sent, to, data: d };
}
