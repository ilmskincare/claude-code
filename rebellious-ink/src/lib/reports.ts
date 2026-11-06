import { DateTime } from "luxon";
import { db } from "./db";
import { STUDIO_TZ } from "./time";
import { stockOverview } from "./inventory";

/**
 * Owner reports. Every report is a plain table (columns + rows) over a date range, so the page
 * can show it and the export route can turn it into CSV without a second code path. Money is in
 * pence in the data and formatted by the page. Nothing here reads health data.
 */
export type Report = { key: string; title: string; blurb: string; columns: string[]; rows: (string | number)[][]; money?: number[] /* column indexes holding pence */ };
export type Range = { from: Date; to: Date; label: string };

export const PRESETS = ["this_week", "this_month", "last_month", "last_30", "this_year", "custom"] as const;
export type Preset = (typeof PRESETS)[number];

export function rangeFor(preset: Preset, from?: string, to?: string, now = new Date()): Range {
  const n = DateTime.fromJSDate(now, { zone: STUDIO_TZ });
  const fmt = (a: DateTime, b: DateTime) => `${a.setLocale("en-GB").toFormat("d LLL yyyy")} to ${b.setLocale("en-GB").toFormat("d LLL yyyy")}`;
  let a: DateTime, b: DateTime;
  switch (preset) {
    case "this_week": a = n.startOf("week"); b = n.endOf("week"); break;
    case "last_month": a = n.minus({ months: 1 }).startOf("month"); b = n.minus({ months: 1 }).endOf("month"); break;
    case "last_30": a = n.minus({ days: 29 }).startOf("day"); b = n.endOf("day"); break;
    case "this_year": a = n.startOf("year"); b = n.endOf("year"); break;
    case "custom": {
      const pa = from ? DateTime.fromISO(from, { zone: STUDIO_TZ }) : n.startOf("month");
      const pb = to ? DateTime.fromISO(to, { zone: STUDIO_TZ }) : n;
      a = (pa.isValid ? pa : n.startOf("month")).startOf("day"); b = (pb.isValid ? pb : n).endOf("day");
      if (b < a) [a, b] = [b.startOf("day"), a.endOf("day")];
      break;
    }
    default: a = n.startOf("month"); b = n.endOf("month");
  }
  return { from: a.toJSDate(), to: b.toJSDate(), label: fmt(a, b) };
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const BOOKED = new Set(["AWAITING_DEPOSIT", "CONFIRMED", "FORMS_PENDING", "CHECKED_IN", "IN_SESSION", "COMPLETED"]);
const LOST = new Set(["CANCELLED", "EXPIRED", "DECLINED"]);
const hours1 = (ms: number) => Math.round((ms / 3600000) * 10) / 10;
const median = (xs: number[]) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export async function enquiriesReport(r: Range): Promise<Report[]> {
  const rows = await db.bookingRequest.findMany({ where: { createdAt: { gte: r.from, lte: r.to } }, select: { status: true, source: true, category: true, artist: { select: { displayName: true } } } });
  const by = <K extends string>(key: (x: (typeof rows)[number]) => K) => { const m = new Map<K, { n: number; booked: number; done: number; lost: number }>(); for (const x of rows) { const k = key(x); const v = m.get(k) ?? { n: 0, booked: 0, done: 0, lost: 0 }; v.n++; if (BOOKED.has(x.status)) v.booked++; if (x.status === "COMPLETED") v.done++; if (LOST.has(x.status)) v.lost++; m.set(k, v); } return [...m.entries()].sort((a, b) => b[1].n - a[1].n); };
  const toRows = (entries: [string, { n: number; booked: number; done: number; lost: number }][]) => entries.map(([k, v]) => [k, v.n, v.booked, `${pct(v.booked, v.n)}%`, v.done, v.lost]);
  const total = { n: rows.length, booked: rows.filter((x) => BOOKED.has(x.status)).length, done: rows.filter((x) => x.status === "COMPLETED").length, lost: rows.filter((x) => LOST.has(x.status)).length };
  const cols = ["", "Enquiries", "Booked", "Conversion", "Completed", "Lost"];
  return [
    { key: "enquiries_by_artist", title: "Enquiries by artist", blurb: "Who the enquiries are for and how many turned into a booking (deposit stage or later).", columns: ["Artist", ...cols.slice(1)], rows: [...toRows(by((x) => x.artist?.displayName ?? "Unassigned / match me")), ["All", total.n, total.booked, `${pct(total.booked, total.n)}%`, total.done, total.lost]] },
    { key: "enquiries_by_source", title: "Enquiries by source", blurb: "Where enquiries came from.", columns: ["Source", ...cols.slice(1)], rows: toRows(by((x) => x.source.toLowerCase().replace(/_/g, " "))) },
    { key: "enquiries_by_service", title: "Enquiries by service", blurb: "Tattoo, piercing, flash and the games.", columns: ["Service", ...cols.slice(1)], rows: toRows(by((x) => x.category.toLowerCase())) },
  ];
}

export async function responseReport(r: Range): Promise<Report> {
  const rows = await db.bookingRequest.findMany({ where: { createdAt: { gte: r.from, lte: r.to } }, select: { id: true, clientId: true, createdAt: true, status: true, artist: { select: { displayName: true } }, conversation: { select: { messages: { where: { visibility: "CLIENT_VISIBLE" }, orderBy: { createdAt: "asc" }, select: { senderId: true, createdAt: true } } } } } });
  const m = new Map<string, { n: number; replied: number; firstHours: number[]; waitingNow: number }>();
  const now = Date.now();
  for (const x of rows) {
    const k = x.artist?.displayName ?? "Unassigned / match me";
    const v = m.get(k) ?? { n: 0, replied: 0, firstHours: [], waitingNow: 0 };
    v.n++;
    const msgs = x.conversation?.messages ?? [];
    const firstStaff = msgs.find((mm) => mm.senderId !== x.clientId);
    if (firstStaff) { v.replied++; v.firstHours.push(hours1(firstStaff.createdAt.getTime() - x.createdAt.getTime())); }
    const last = msgs[msgs.length - 1];
    const clientLast = last ? last.senderId === x.clientId : true;
    if (clientLast && !LOST.has(x.status) && x.status !== "COMPLETED" && now - (last?.createdAt ?? x.createdAt).getTime() > 24 * 3600000) v.waitingNow++;
    m.set(k, v);
  }
  return { key: "response_times", title: "Response times", blurb: "How quickly each artist first replies to a new enquiry, and how many clients are waiting over 24 hours right now.", columns: ["Artist", "Enquiries", "Replied", "Average first reply (h)", "Median first reply (h)", "Waiting now >24h"], rows: [...m.entries()].sort((a, b) => b[1].n - a[1].n).map(([k, v]) => [k, v.n, v.replied, v.firstHours.length ? Math.round((v.firstHours.reduce((a, b) => a + b, 0) / v.firstHours.length) * 10) / 10 : "", v.firstHours.length ? median(v.firstHours) : "", v.waitingNow]) };
}

export async function bookingsReport(r: Range): Promise<Report> {
  const rows = await db.appointment.findMany({ where: { startsAt: { gte: r.from, lte: r.to } }, select: { status: true, depositPence: true, depositPaidAt: true, category: true, artist: { select: { displayName: true } } } });
  const m = new Map<string, { n: number; done: number; cancelled: number; noShow: number; depositsPaid: number; unpaid: number }>();
  for (const x of rows) {
    const v = m.get(x.artist.displayName) ?? { n: 0, done: 0, cancelled: 0, noShow: 0, depositsPaid: 0, unpaid: 0 };
    v.n++; if (x.status === "COMPLETED") v.done++; if (x.status === "CANCELLED") v.cancelled++; if (x.status === "NO_SHOW") v.noShow++;
    if (x.depositPaidAt) v.depositsPaid += x.depositPence; else if (x.status === "PENDING_DEPOSIT") v.unpaid++;
    m.set(x.artist.displayName, v);
  }
  const t = [...m.values()].reduce((a, v) => ({ n: a.n + v.n, done: a.done + v.done, cancelled: a.cancelled + v.cancelled, noShow: a.noShow + v.noShow, depositsPaid: a.depositsPaid + v.depositsPaid, unpaid: a.unpaid + v.unpaid }), { n: 0, done: 0, cancelled: 0, noShow: 0, depositsPaid: 0, unpaid: 0 });
  return { key: "bookings", title: "Bookings by artist", blurb: "Appointments starting in the period: completed, cancelled, no-shows, deposits taken and still unpaid.", columns: ["Artist", "Appointments", "Completed", "Cancelled", "No-show", "Deposits paid", "Deposits unpaid"], money: [5], rows: [...[...m.entries()].sort((a, b) => b[1].n - a[1].n).map(([k, v]) => [k, v.n, v.done, v.cancelled, v.noShow, v.depositsPaid, v.unpaid]), ["All", t.n, t.done, t.cancelled, t.noShow, t.depositsPaid, t.unpaid]] };
}

export async function takingsReport(r: Range): Promise<Report[]> {
  const [payments, retail] = await Promise.all([
    db.payment.findMany({ where: { status: "SUCCEEDED", createdAt: { gte: r.from, lte: r.to } }, select: { purpose: true, method: true, amountPence: true } }),
    db.retailSale.findMany({ where: { createdAt: { gte: r.from, lte: r.to } }, select: { totalPence: true, quantity: true, method: true, practitioner: { select: { displayName: true } }, product: { select: { name: true, category: true } } } }),
  ]);
  const byPurpose = new Map<string, { n: number; sum: number }>();
  const byMethod = new Map<string, { n: number; sum: number }>();
  for (const p of payments) { const a = byPurpose.get(p.purpose) ?? { n: 0, sum: 0 }; a.n++; a.sum += p.amountPence; byPurpose.set(p.purpose, a); const b = byMethod.get(p.method) ?? { n: 0, sum: 0 }; b.n++; b.sum += p.amountPence; byMethod.set(p.method, b); }
  const total = payments.reduce((s, p) => s + p.amountPence, 0);
  const byPractitioner = new Map<string, { items: number; sum: number }>();
  for (const s of retail) { const v = byPractitioner.get(s.practitioner.displayName) ?? { items: 0, sum: 0 }; v.items += s.quantity; v.sum += s.totalPence; byPractitioner.set(s.practitioner.displayName, v); }
  const nice = (s: string) => s.toLowerCase().replace(/_/g, " ");
  return [
    { key: "takings_by_purpose", title: "Payments received", blurb: "Successful payments through the site in the period: deposits, balances, retail and tips, by what they were for and how they were paid.", columns: ["Purpose", "Payments", "Amount"], money: [2], rows: [...[...byPurpose.entries()].map(([k, v]) => [nice(k), v.n, v.sum]), ["All", payments.length, total]] },
    { key: "takings_by_method", title: "Payments by method", blurb: "Card, bank transfer, cash and vouchers.", columns: ["Method", "Payments", "Amount"], money: [2], rows: [...byMethod.entries()].map(([k, v]) => [nice(k), v.n, v.sum]) },
    { key: "retail_by_practitioner", title: "Retail and jewellery sales", blurb: "Aftercare, jewellery and other retail sold at the desk, by who sold it.", columns: ["Practitioner", "Items", "Amount"], money: [2], rows: [...[...byPractitioner.entries()].map(([k, v]) => [k, v.items, v.sum]), ["All", retail.reduce((s, x) => s + x.quantity, 0), retail.reduce((s, x) => s + x.totalPence, 0)]] },
  ];
}

export async function gamesReport(r: Range): Promise<Report> {
  const [plays, views] = await Promise.all([
    db.play.groupBy({ by: ["game", "status"], where: { createdAt: { gte: r.from, lte: r.to } }, _count: { _all: true } }),
    db.analyticsEvent.groupBy({ by: ["game", "name"], where: { createdAt: { gte: r.from, lte: r.to }, name: { in: ["game_viewed", "age_gate_passed"] } }, _count: { _all: true } }),
  ]);
  const games = new Map<string, { views: number; gate: number; plays: number; booked: number }>();
  const get = (g: string | null) => { const k = g ?? "unknown"; const v = games.get(k) ?? { views: 0, gate: 0, plays: 0, booked: 0 }; games.set(k, v); return v; };
  for (const v of views) { const g = get(v.game); if (v.name === "game_viewed") g.views += v._count._all; else g.gate += v._count._all; }
  for (const p of plays) { const g = get(p.game); g.plays += p._count._all; if (p.status === "BOOKED") g.booked += p._count._all; }
  const label: Record<string, string> = { gumball: "Gumball machine", trio: "Three machines" };
  return { key: "games", title: "Games", blurb: "Page views, age checks, free goes and how many turned into a booking.", columns: ["Game", "Page views", "Age checks passed", "Goes", "Booked", "Goes to bookings"], rows: [...games.entries()].map(([k, v]) => [label[k] ?? k, v.views, v.gate, v.plays, v.booked, `${pct(v.booked, v.plays)}%`]) };
}

export async function marketingReport(r: Range): Promise<Report[]> {
  const [prefs, campaigns] = await Promise.all([
    db.privacyPreference.findMany({ where: { purpose: "MARKETING_EMAIL" }, orderBy: { version: "desc" }, select: { userId: true, granted: true, withdrawnAt: true, grantedAt: true, source: true, version: true } }),
    db.marketingCampaign.findMany({ where: { sentAt: { gte: r.from, lte: r.to } }, orderBy: { sentAt: "desc" }, select: { name: true, subject: true, recipientCount: true, sentCount: true, failedCount: true, sentAt: true } }),
  ]);
  const latest = new Map<string, (typeof prefs)[number]>();
  for (const p of prefs) if (!latest.has(p.userId)) latest.set(p.userId, p);
  const optedIn = [...latest.values()].filter((p) => p.granted && !p.withdrawnAt).length;
  const newIn = prefs.filter((p) => p.granted && p.grantedAt && p.grantedAt >= r.from && p.grantedAt <= r.to).length;
  const newOut = prefs.filter((p) => !p.granted && p.withdrawnAt && p.withdrawnAt >= r.from && p.withdrawnAt <= r.to).length;
  const bySource = new Map<string, number>();
  for (const p of latest.values()) if (p.granted && !p.withdrawnAt) { const k = (p.source ?? "unknown").split(":")[0]; bySource.set(k, (bySource.get(k) ?? 0) + 1); }
  return [
    { key: "marketing_list", title: "Email marketing list", blurb: "People you may email right now, where their consent came from, and how the list moved in the period.", columns: ["Measure", "Count"], rows: [["Opted in now", optedIn], ["New opt-ins in period", newIn], ["Opt-outs in period", newOut], ...[...bySource.entries()].map(([k, v]) => [`Opted in via ${k}`, v])] },
    { key: "campaigns", title: "Campaigns sent", blurb: "Email campaigns sent in the period.", columns: ["Campaign", "Subject", "Recipients", "Sent", "Failed", "Sent on"], rows: campaigns.map((c) => [c.name, c.subject ?? "", c.recipientCount, c.sentCount, c.failedCount, c.sentAt ? DateTime.fromJSDate(c.sentAt, { zone: STUDIO_TZ }).toFormat("dd/MM/yyyy") : ""]) },
  ];
}

export async function stockReport(): Promise<Report> {
  const all = await stockOverview();
  const rows = all.filter((p) => p.isLow || p.expiringLots > 0 || p.expiredLots > 0).map((p) => [p.name, p.sku, p.category, p.onHand, p.reorderLevel, p.isLow ? "LOW" : "", p.expiringLots, p.expiredLots, p.supplier?.name ?? ""]);
  return { key: "stock_attention", title: "Stock needing attention", blurb: "Items at or below their reorder level, and lots expiring within 60 days or already expired.", columns: ["Product", "SKU", "Category", "On hand", "Reorder at", "Low", "Lots expiring", "Lots expired", "Supplier"], rows };
}

export async function apprenticesReport(r: Range): Promise<Report> {
  const [logs, skills, apprentices] = await Promise.all([
    db.practiceLog.findMany({ where: { date: { gte: r.from, lte: r.to } }, select: { apprenticeId: true, minutes: true, verifiedAt: true } }),
    db.skillProgress.groupBy({ by: ["apprenticeId", "status"], _count: { _all: true } }),
    db.artistProfile.findMany({ where: { kind: "APPRENTICE" }, select: { userId: true, displayName: true, supervisor: { select: { displayName: true } } } }),
  ]);
  const rows = apprentices.map((a) => {
    const mine = logs.filter((l) => l.apprenticeId === a.userId);
    const logged = mine.reduce((s, l) => s + l.minutes, 0), verified = mine.filter((l) => l.verifiedAt).reduce((s, l) => s + l.minutes, 0);
    const competent = skills.filter((s) => s.apprenticeId === a.userId && s.status === "COMPETENT").reduce((s, x) => s + x._count._all, 0);
    const ready = skills.filter((s) => s.apprenticeId === a.userId && s.status === "READY_FOR_REVIEW").reduce((s, x) => s + x._count._all, 0);
    return [a.displayName, a.supervisor?.displayName ?? "", Math.round(logged / 6) / 10, Math.round(verified / 6) / 10, competent, ready];
  });
  return { key: "apprentices", title: "Apprentices", blurb: "Hours logged and verified in the period, skills signed off so far, and skills waiting for a mentor's review.", columns: ["Apprentice", "Supervisor", "Hours logged", "Hours verified", "Skills competent", "Awaiting review"], rows };
}

export async function clientsReport(r: Range): Promise<Report> {
  const [newClients, completed, deskAdded] = await Promise.all([
    db.clientProfile.count({ where: { createdAt: { gte: r.from, lte: r.to } } }),
    db.appointment.groupBy({ by: ["clientId"], where: { status: "COMPLETED" }, _count: { _all: true } }),
    db.auditLog.count({ where: { action: "client.created_at_desk", createdAt: { gte: r.from, lte: r.to } } }),
  ]);
  const repeat = completed.filter((c) => c._count._all >= 2).length;
  return { key: "clients", title: "Clients", blurb: "New clients in the period and how many people have come back for a second completed appointment.", columns: ["Measure", "Count"], rows: [["New clients (signed up or added)", newClients], ["Of which added at the desk", deskAdded], ["Clients with a completed appointment", completed.length], ["Repeat clients (2+ completed)", repeat]] };
}

export async function allReports(r: Range): Promise<Report[]> {
  const [enq, resp, book, tak, games, mkt, stock, appr, clients] = await Promise.all([enquiriesReport(r), responseReport(r), bookingsReport(r), takingsReport(r), gamesReport(r), marketingReport(r), stockReport(), apprenticesReport(r), clientsReport(r)]);
  return [...enq, resp, book, ...tak, games, ...mkt, stock, appr, clients];
}

export function toCsv(rep: Report) {
  const cell = (v: string | number, i: number) => { const s = rep.money?.includes(i) && typeof v === "number" ? (v / 100).toFixed(2) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [rep.columns.map((c, i) => cell(c, -1 - i)).join(","), ...rep.rows.map((row) => row.map(cell).join(","))].join("\n") + "\n";
}
