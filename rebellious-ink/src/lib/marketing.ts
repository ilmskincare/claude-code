import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";
import { sendEmail } from "./email";
import { env } from "./env";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { escapeHtml } from "./enquiries";

export const campaignSchema = z.object({
  name: z.string().trim().min(2).max(120),
  subject: z.string().trim().min(2).max(150),
  body: z.string().trim().min(10).max(20000),
  artistId: z.string().optional().or(z.literal("")),
});

/** Clients who have granted MARKETING_EMAIL and not withdrawn it (latest version wins). */
export async function marketingAudience(filter: { artistId?: string | null } = {}) {
  const prefs = await db.privacyPreference.findMany({ where: { purpose: "MARKETING_EMAIL" }, orderBy: { version: "desc" } });
  const latest = new Map<string, (typeof prefs)[number]>();
  for (const p of prefs) if (!latest.has(p.userId)) latest.set(p.userId, p);
  let userIds = [...latest.values()].filter((p) => p.granted && !p.withdrawnAt).map((p) => p.userId);
  if (filter.artistId) {
    const withArtist = await db.bookingRequest.findMany({ where: { artistId: filter.artistId, clientId: { in: userIds } }, select: { clientId: true }, distinct: ["clientId"] });
    userIds = withArtist.map((r) => r.clientId);
  }
  const users = await db.user.findMany({ where: { id: { in: userIds }, isSuspended: false }, select: { id: true, email: true, name: true } });
  return users;
}

export function unsubscribeToken(userId: string) {
  const sig = createHmac("sha256", env().AUTH_SECRET).update(`unsub:${userId}`).digest("hex").slice(0, 32);
  return `${userId}.${sig}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;
  const expected = createHmac("sha256", env().AUTH_SECRET).update(`unsub:${userId}`).digest("hex").slice(0, 32);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  return userId;
}

export async function setMarketingPreference(userId: string, granted: boolean, source: string) {
  const last = await db.privacyPreference.findFirst({ where: { userId, purpose: "MARKETING_EMAIL" }, orderBy: { version: "desc" } });
  const row = await db.privacyPreference.create({ data: { userId, purpose: "MARKETING_EMAIL", granted, grantedAt: granted ? new Date() : null, withdrawnAt: granted ? null : new Date(), source, version: (last?.version ?? 0) + 1 } });
  await audit({ actorId: userId, actorLabel: "Client", action: granted ? "privacy.marketing_opt_in" : "privacy.marketing_opt_out", entityType: "PrivacyPreference", entityId: row.id, after: { granted, source } });
  return row;
}

export async function saveCampaign(p: Principal, input: z.infer<typeof campaignSchema>, id?: string) {
  if (!can(p, "studio.manage") && !can(p, "portfolio.publish")) throw new ForbiddenError();
  const data = { name: input.name, subject: input.subject, body: input.body, channel: "email", audience: { artistId: input.artistId || null }, createdById: p.userId };
  const c = id ? await db.marketingCampaign.update({ where: { id }, data }) : await db.marketingCampaign.create({ data });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: id ? "marketing.campaign_updated" : "marketing.campaign_created", entityType: "MarketingCampaign", entityId: c.id, after: { name: c.name, subject: c.subject } });
  return c;
}

function render(body: string, name: string | null, unsubUrl: string) {
  const text = body.replace(/\{\{\s*name\s*\}\}/g, name ?? "there");
  const html = text.split(/\n{2,}/).map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br/>")}</p>`).join("");
  return {
    text: `${text}\n\n—\nYou are receiving this because you opted in to Rebellious Ink news. Unsubscribe: ${unsubUrl}`,
    html: `${html}<hr/><p style="font-size:12px;color:#666">You are receiving this because you opted in to Rebellious Ink news. <a href="${unsubUrl}">Unsubscribe</a></p>`,
  };
}

/** Send a test to the sender only. */
export async function sendCampaignTest(p: Principal, campaignId: string) {
  const c = await db.marketingCampaign.findUnique({ where: { id: campaignId } });
  if (!c) throw new NotFoundError();
  const r = render(c.body ?? "", p.name, `${env().APP_BASE_URL}/unsubscribe/${unsubscribeToken(p.userId)}`);
  await sendEmail({ to: p.email, userId: p.userId, templateKey: `campaign:${c.id}:test`, subject: `[TEST] ${c.subject}`, ...r });
}

/** Send to the opted-in audience. Each recipient gets their own Notification row; never sent twice. */
export async function sendCampaign(p: Principal, campaignId: string) {
  if (!can(p, "studio.manage")) throw new ForbiddenError("Only the owner can send a campaign.");
  const c = await db.marketingCampaign.findUnique({ where: { id: campaignId } });
  if (!c) throw new NotFoundError();
  if (c.status === "sent" || c.status === "sending") throw new ValidationError("This campaign has already been sent.");
  const audience = await marketingAudience({ artistId: (c.audience as { artistId?: string | null })?.artistId ?? null });
  if (audience.length === 0) throw new ValidationError("No opted-in recipients for this audience.");
  await db.marketingCampaign.update({ where: { id: c.id }, data: { status: "sending", recipientCount: audience.length } });
  let sent = 0, failed = 0;
  for (const u of audience) {
    const already = await db.notification.findFirst({ where: { userId: u.id, templateKey: `campaign:${c.id}` } });
    if (already) continue;
    const r = render(c.body ?? "", u.name, `${env().APP_BASE_URL}/unsubscribe/${unsubscribeToken(u.id)}`);
    try { await sendEmail({ to: u.email, userId: u.id, templateKey: `campaign:${c.id}`, subject: c.subject ?? c.name, ...r }); sent++; } catch { failed++; }
  }
  const done = await db.marketingCampaign.update({ where: { id: c.id }, data: { status: failed === audience.length ? "failed" : "sent", sentCount: sent, failedCount: failed, sentAt: new Date() } });
  await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: "marketing.campaign_sent", entityType: "MarketingCampaign", entityId: c.id, after: { recipients: audience.length, sent, failed } });
  return done;
}
