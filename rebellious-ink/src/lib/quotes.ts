import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { sendEmail } from "./email";
import { env } from "./env";
import { formatPence } from "./money";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { canAccessRequest, transitionRequest } from "./enquiries";

export const quoteSchema = z.object({
  scope: z.string().trim().min(5).max(2000),
  priceBasis: z.enum(["hourly", "fixed", "per_session", "day_rate"]),
  amountPounds: z.coerce.number().min(1).max(100000),
  depositPounds: z.coerce.number().min(0).max(100000),
  estimatedMinutes: z.coerce.number().int().min(15).max(600),
  sessions: z.coerce.number().int().min(1).max(50),
  expiresInDays: z.coerce.number().int().min(1).max(90).default(14),
});

export const DEFAULT_TERMS_VERSION = "booking-terms-v1";
export const DEFAULT_TERMS = `Deposits secure your appointment and are deducted from the final price. Deposits are non-refundable if you cancel with less than 48 hours' notice or do not attend. You may reschedule once free of charge with at least 48 hours' notice. You must be 18 or over for tattooing and bring photographic ID. Please tell us about any health concerns before your appointment so your artist can plan safely.`;

/** Issue a quote. Artists may quote on their own enquiries; owner/manager on any. Policy: owner approval optional (StudioSetting quote.requiresOwnerApproval). */
export async function issueQuote(p: Principal, requestId: string, input: z.infer<typeof quoteSchema>) {
  const r = await db.bookingRequest.findUnique({ where: { id: requestId }, include: { client: true, quotes: true } });
  if (!r || !canAccessRequest(p, r)) throw new NotFoundError("Enquiry not found");
  const ownsAsArtist = p.artistProfileId && r.artistId === p.artistProfileId;
  if (!(ownsAsArtist && can(p, "quotes.issue")) && !can(p, "quotes.approve")) throw new ForbiddenError();
  if (!r.artistId) throw new ValidationError("Assign an artist before quoting.");
  if (input.depositPounds > input.amountPounds) throw new ValidationError("Deposit cannot exceed the quoted amount.");
  const requiresApproval = (await db.studioSetting.findFirst({ where: { key: "quote.requiresOwnerApproval" } }))?.value === true;
  const status = requiresApproval && !can(p, "quotes.approve") ? "DRAFT" : "SENT";

  const quote = await db.$transaction(async (tx) => {
    await tx.quote.updateMany({ where: { requestId, status: { in: ["SENT", "DRAFT"] } }, data: { status: "SUPERSEDED" } });
    const version = (r.quotes.reduce((m, q) => Math.max(m, q.version), 0) || 0) + 1;
    const q = await tx.quote.create({
      data: {
        requestId, artistId: r.artistId!, issuedById: p.userId, version, status,
        scope: input.scope, priceBasis: input.priceBasis,
        amountPence: Math.round(input.amountPounds * 100), depositPence: Math.round(input.depositPounds * 100),
        estimatedMinutes: input.estimatedMinutes, sessions: input.sessions,
        termsVersion: DEFAULT_TERMS_VERSION, termsText: DEFAULT_TERMS,
        expiresAt: new Date(Date.now() + input.expiresInDays * 86400000), sentAt: status === "SENT" ? new Date() : null,
      },
    });
    if (status === "SENT") {
      if (r.status !== "QUOTED" && r.status !== "AWAITING_ACCEPTANCE") await transitionRequest(tx, requestId, "QUOTED", { userId: p.userId, label: `Staff: ${p.name ?? p.email}` }, `Quote v${version} issued`);
      if (r.status !== "AWAITING_ACCEPTANCE") {
        const cur = await tx.bookingRequest.findUniqueOrThrow({ where: { id: requestId } });
        if (cur.status === "QUOTED") await transitionRequest(tx, requestId, "AWAITING_ACCEPTANCE", { userId: p.userId, label: `Staff: ${p.name ?? p.email}` }, "Sent to client");
      }
    }
    await audit({ actorId: p.userId, actorLabel: `Staff: ${p.name ?? p.email}`, action: "quote.issued", entityType: "Quote", entityId: q.id, after: { version, status, amountPence: q.amountPence, depositPence: q.depositPence } }, tx);
    return q;
  });

  if (status === "SENT") {
    await sendEmail({
      to: r.client.email, userId: r.clientId, templateKey: "quote.sent",
      subject: `Your quote for ${r.reference}`,
      text: `A quote of ${formatPence(quote.amountPence)} (deposit ${formatPence(quote.depositPence)}) is waiting for you. Sign in to review and accept: ${env().APP_BASE_URL}/my/enquiries/${r.id}`,
      html: `<p>A quote of <strong>${formatPence(quote.amountPence)}</strong> (deposit ${formatPence(quote.depositPence)}) is waiting for you.</p><p><a href="${env().APP_BASE_URL}/my/enquiries/${r.id}">Review and accept</a></p>`,
      payload: { requestId: r.id, quoteId: quote.id },
    }).catch((e) => console.error("notify failed", e));
  }
  return quote;
}

export async function approveQuote(p: Principal, quoteId: string) {
  if (!can(p, "quotes.approve")) throw new ForbiddenError();
  await db.$transaction(async (tx) => {
    const q = await tx.quote.findUniqueOrThrow({ where: { id: quoteId } });
    if (q.status !== "DRAFT") throw new ValidationError("Only draft quotes can be approved.");
    await tx.quote.update({ where: { id: quoteId }, data: { status: "SENT", sentAt: new Date() } });
    await transitionRequest(tx, q.requestId, "QUOTED", { userId: p.userId, label: `Owner: ${p.name ?? p.email}` }, `Quote v${q.version} approved`);
    await transitionRequest(tx, q.requestId, "AWAITING_ACCEPTANCE", { userId: p.userId, label: `Owner: ${p.name ?? p.email}` }, "Sent to client");
  });
}

/** Client accepts or declines. Clients cannot alter the quote; only respond to it. */
export async function respondToQuote(p: Principal, quoteId: string, decision: "ACCEPTED" | "DECLINED") {
  return db.$transaction(async (tx) => {
    const q = await tx.quote.findUnique({ where: { id: quoteId }, include: { request: true } });
    if (!q || q.request.clientId !== p.userId) throw new NotFoundError("Quote not found");
    if (q.status !== "SENT") throw new ValidationError("This quote is no longer open.");
    if (q.expiresAt && q.expiresAt < new Date()) {
      await tx.quote.update({ where: { id: quoteId }, data: { status: "EXPIRED" } });
      throw new ValidationError("This quote has expired. Please message your artist for a new one.");
    }
    await tx.quote.update({ where: { id: quoteId }, data: { status: decision, respondedAt: new Date() } });
    await transitionRequest(tx, q.requestId, decision === "ACCEPTED" ? "AWAITING_DEPOSIT" : "IN_DISCUSSION", { userId: p.userId, label: "Client" }, decision === "ACCEPTED" ? `Quote v${q.version} accepted (terms ${q.termsVersion})` : `Quote v${q.version} declined`);
    await audit({ actorId: p.userId, actorLabel: "Client", action: `quote.${decision.toLowerCase()}`, entityType: "Quote", entityId: q.id, after: { decision, termsVersion: q.termsVersion } }, tx);
    return q;
  });
}
