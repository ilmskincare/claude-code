import { Resend } from "resend";
import { db } from "./db";
import { env, emailProviderConfigured, isProduction } from "./env";
import { COPY_TEMPLATES, copyRecipients, oversightSettings } from "./oversight";

export type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  templateKey: string;
  userId?: string | null;
  payload?: Record<string, unknown>;
  /** Extra blind-copy addresses. Owner copies for client-facing templates are added automatically. */
  bcc?: string[];
};

/**
 * Transactional email. Uses Resend when configured. In non-production without a
 * key it writes to the DevMailbox table so flows remain testable end-to-end and
 * nothing is faked on a success screen: the Notification row records SENT only
 * when a provider accepted the message.
 */
export async function sendEmail(input: EmailInput) {
  const bcc = [...new Set([...(input.bcc ?? []), ...(await ownerCopies(input))])].filter((a) => a.toLowerCase() !== input.to.toLowerCase());
  const notification = await db.notification.create({
    data: {
      userId: input.userId ?? null,
      channel: "email",
      templateKey: input.templateKey,
      to: input.to,
      subject: input.subject,
      payload: { ...(input.payload ?? {}), ...(bcc.length ? { bcc } : {}) } as object,
    },
  });

  if (!emailProviderConfigured()) {
    if (isProduction()) {
      await db.notification.update({ where: { id: notification.id }, data: { status: "FAILED", error: "No email provider configured" } });
      throw new Error("Email provider not configured");
    }
    await db.devMailbox.create({ data: { to: input.to, subject: input.subject, text: input.text, html: input.html } });
    await db.notification.update({ where: { id: notification.id }, data: { status: "SENT", providerId: "dev-mailbox", sentAt: new Date() } });
    return { id: notification.id, provider: "dev-mailbox" as const };
  }

  const resend = new Resend(env().RESEND_API_KEY);
  const result = await resend.emails.send({
    from: env().EMAIL_FROM,
    to: input.to,
    ...(bcc.length ? { bcc } : {}),
    ...(env().EMAIL_REPLY_TO ? { replyTo: env().EMAIL_REPLY_TO } : {}),
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  if (result.error) {
    await db.notification.update({ where: { id: notification.id }, data: { status: "FAILED", error: result.error.message } });
    throw new Error(`Resend error: ${result.error.message}`);
  }
  await db.notification.update({
    where: { id: notification.id },
    data: { status: "SENT", providerId: result.data?.id ?? null, sentAt: new Date() },
  });
  return { id: notification.id, provider: "resend" as const };
}

/** Owners are blind-copied on client-facing emails only (never sign-in links or marketing), unless switched off under Settings. */
async function ownerCopies(input: EmailInput) {
  if (!COPY_TEMPLATES.has(input.templateKey)) return [];
  try {
    const s = await oversightSettings();
    if (!s.copyEmails) return [];
    return await copyRecipients([input.to]);
  } catch (e) { console.error("owner copy lookup failed", e); return []; }
}
