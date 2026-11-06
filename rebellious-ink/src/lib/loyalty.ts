import { randomBytes } from "node:crypto";
import { db, type Tx } from "./db";
import { audit } from "./audit";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { sendEmail } from "./email";
import { env } from "./env";
import { formatPence } from "./money";

export const LOYALTY_DEFAULTS = { enabled: true, referralBonusPence: 1000, welcomeCreditPence: 1000, earnPercent: 5, minRedeemPence: 500 };

export async function loyaltySettings() {
  const rows = await db.studioSetting.findMany({ where: { key: { startsWith: "loyalty." } } });
  const v = Object.fromEntries(rows.map((r) => [r.key.replace("loyalty.", ""), r.value]));
  return {
    enabled: typeof v.enabled === "boolean" ? v.enabled : LOYALTY_DEFAULTS.enabled,
    referralBonusPence: typeof v.referralBonusPence === "number" ? v.referralBonusPence : LOYALTY_DEFAULTS.referralBonusPence,
    welcomeCreditPence: typeof v.welcomeCreditPence === "number" ? v.welcomeCreditPence : LOYALTY_DEFAULTS.welcomeCreditPence,
    earnPercent: typeof v.earnPercent === "number" ? v.earnPercent : LOYALTY_DEFAULTS.earnPercent,
    minRedeemPence: typeof v.minRedeemPence === "number" ? v.minRedeemPence : LOYALTY_DEFAULTS.minRedeemPence,
  };
}

function makeCode(name?: string | null) {
  const stem = (name ?? "RI").replace(/[^a-z]/gi, "").slice(0, 4).toUpperCase() || "RINK";
  return `${stem}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/** Every client gets an account with a unique referral code on first use. */
export async function ensureAccount(userId: string, client: Tx | typeof db = db) {
  const existing = await client.loyaltyAccount.findUnique({ where: { userId } });
  if (existing) return existing;
  const user = await client.user.findUnique({ where: { id: userId } });
  for (let i = 0; i < 5; i++) {
    try { return await client.loyaltyAccount.create({ data: { userId, referralCode: makeCode(user?.name) } }); } catch { /* collision, retry */ }
  }
  throw new Error("Could not allocate a referral code");
}

/** Link a new client to a referrer when they enquire with a code. Self-referral and reuse are ignored, not rewarded. */
export async function attachReferral(tx: Tx, referredUserId: string, code: string | null | undefined) {
  const settings = await loyaltySettings();
  if (!settings.enabled || !code) return null;
  const referrer = await tx.loyaltyAccount.findUnique({ where: { referralCode: code.trim().toUpperCase() } });
  if (!referrer || referrer.userId === referredUserId) return null;
  const referred = await ensureAccount(referredUserId, tx);
  const already = await tx.referral.findUnique({ where: { referredId: referred.id } });
  if (already) return already;
  const priorBookings = await tx.appointment.count({ where: { clientId: referredUserId, status: { in: ["CONFIRMED", "COMPLETED", "CHECKED_IN", "IN_SESSION"] } } });
  if (priorBookings > 0) return null; // only genuinely new clients
  return tx.referral.create({ data: { referrerId: referrer.id, referredId: referred.id, code: referrer.referralCode } });
}

async function credit(tx: Tx, accountId: string, type: "REFERRED_WELCOME" | "REFERRAL_BONUS" | "POINTS_EARNED" | "ADJUSTMENT" | "REDEEMED", amountPence: number, note: string, appointmentId?: string | null, actorId?: string | null) {
  await tx.loyaltyTransaction.create({ data: { accountId, type, amountPence, note, appointmentId: appointmentId ?? null, actorId: actorId ?? null } });
  return tx.loyaltyAccount.update({ where: { id: accountId }, data: { balancePence: { increment: amountPence } } });
}

/**
 * Mark an appointment completed (artist on their own, or owner/manager). Awards
 * earn-rate credit on the final price and qualifies a pending referral on the
 * client's first completed appointment, crediting both sides.
 */
export async function completeAppointment(p: Principal, appointmentId: string, finalPricePence: number) {
  const result = await db.$transaction(async (tx) => {
    const a = await tx.appointment.findUnique({ where: { id: appointmentId }, include: { client: true, request: true } });
    if (!a) throw new NotFoundError();
    if (a.artistId !== p.artistProfileId && !can(p, "bookings.override")) throw new ForbiddenError();
    if (a.status === "COMPLETED") throw new ValidationError("Already completed.");
    if (!["CONFIRMED", "CHECKED_IN", "IN_SESSION"].includes(a.status)) throw new ValidationError("Only confirmed appointments can be completed.");
    if (finalPricePence < 0) throw new ValidationError("Final price cannot be negative.");
    await tx.appointment.update({ where: { id: a.id }, data: { status: "COMPLETED", completedAt: new Date(), finalPricePence } });
    if (a.request && a.request.status !== "COMPLETED") {
      await tx.bookingRequest.update({ where: { id: a.request.id }, data: { status: "COMPLETED" } });
      await tx.enquiryStatusEvent.create({ data: { requestId: a.request.id, fromStatus: a.request.status, toStatus: "COMPLETED", actorId: p.userId, actorLabel: p.name ?? p.email, note: `Completed, final price ${formatPence(finalPricePence)}` } });
    }
    const settings = await loyaltySettings();
    const rewards: string[] = [];
    if (settings.enabled) {
      const account = await ensureAccount(a.clientId, tx);
      const earned = Math.floor((finalPricePence * settings.earnPercent) / 100);
      if (earned > 0) { await credit(tx, account.id, "POINTS_EARNED", earned, `${settings.earnPercent}% back on ${a.reference}`, a.id, p.userId); rewards.push(`client earned ${formatPence(earned)}`); }
      const referral = await tx.referral.findUnique({ where: { referredId: account.id }, include: { referrer: true } });
      if (referral && referral.status === "PENDING") {
        await credit(tx, account.id, "REFERRED_WELCOME", settings.welcomeCreditPence, `Welcome credit for joining via ${referral.code}`, a.id, p.userId);
        await credit(tx, referral.referrerId, "REFERRAL_BONUS", settings.referralBonusPence, `Referral bonus: ${a.client.name ?? "a friend"} completed their first appointment`, a.id, p.userId);
        await tx.referral.update({ where: { id: referral.id }, data: { status: "REWARDED", qualifiedAt: new Date() } });
        rewards.push(`referral rewarded (${formatPence(settings.welcomeCreditPence)} + ${formatPence(settings.referralBonusPence)})`);
      }
    }
    await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "appointment.completed", entityType: "Appointment", entityId: a.id, before: { status: a.status }, after: { status: "COMPLETED", finalPricePence, rewards } }, tx);
    return { appointment: a, rewards };
  });
  // Notify the referrer, if any, outside the transaction.
  const referral = await db.referral.findFirst({ where: { referred: { userId: result.appointment.clientId }, status: "REWARDED", qualifiedAt: { gte: new Date(Date.now() - 60000) } }, include: { referrer: { include: { user: true } } } });
  if (referral) {
    const s = await loyaltySettings();
    await sendEmail({ to: referral.referrer.user.email, userId: referral.referrer.userId, templateKey: "loyalty.referral_rewarded", subject: `You've earned ${formatPence(s.referralBonusPence)} studio credit`, text: `Someone you referred has completed their first appointment, so ${formatPence(s.referralBonusPence)} credit has been added to your account. See it at ${env().APP_BASE_URL}/my/rewards`, html: `<p>Someone you referred has completed their first appointment, so <strong>${formatPence(s.referralBonusPence)}</strong> credit has been added to your account.</p><p><a href="${env().APP_BASE_URL}/my/rewards">See your rewards</a></p>` }).catch((e) => console.error("notify failed", e));
  }
  return result;
}

/** Desk applies credit to an appointment balance. Never more than the balance, never below the minimum. */
export async function redeemCredit(p: Principal, appointmentId: string, amountPence: number) {
  if (!can(p, "loyalty.redeem") && !can(p, "bookings.override")) throw new ForbiddenError();
  return db.$transaction(async (tx) => {
    const a = await tx.appointment.findUnique({ where: { id: appointmentId } });
    if (!a) throw new NotFoundError();
    const settings = await loyaltySettings();
    const account = await ensureAccount(a.clientId, tx);
    if (amountPence < settings.minRedeemPence) throw new ValidationError(`Minimum redemption is ${formatPence(settings.minRedeemPence)}.`);
    if (amountPence > account.balancePence) throw new ValidationError(`Only ${formatPence(account.balancePence)} available.`);
    await credit(tx, account.id, "REDEEMED", -amountPence, `Applied to ${a.reference}`, a.id, p.userId);
    await tx.appointment.update({ where: { id: a.id }, data: { creditAppliedPence: { increment: amountPence } } });
    await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "loyalty.redeemed", entityType: "Appointment", entityId: a.id, after: { amountPence } }, tx);
    return amountPence;
  });
}

export async function rewardsFor(userId: string) {
  const account = await ensureAccount(userId);
  const [transactions, referrals, settings] = await Promise.all([
    db.loyaltyTransaction.findMany({ where: { accountId: account.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.referral.findMany({ where: { referrerId: account.id }, include: { referred: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } }),
    loyaltySettings(),
  ]);
  return { account, transactions, referrals, settings, shareUrl: `${env().APP_BASE_URL}/enquire?ref=${account.referralCode}` };
}
