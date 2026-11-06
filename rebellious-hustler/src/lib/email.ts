import { Resend } from "resend";
import { env, emailConfigured } from "./env";

export type EmailMessage = { to: string; subject: string; text: string; html: string };

/** Sends through Resend when RESEND_API_KEY is set; otherwise logs the message so nothing is lost in development. */
export async function sendEmail(message: EmailMessage): Promise<{ sent: boolean; id?: string }> {
  if (!emailConfigured()) {
    console.log(`[email not sent: RESEND_API_KEY missing] to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.text}`);
    return { sent: false };
  }
  const resend = new Resend(env().RESEND_API_KEY);
  const result = await resend.emails.send({ from: env().EMAIL_FROM, to: message.to, subject: message.subject, text: message.text, html: message.html });
  if (result.error) throw new Error(`Resend: ${result.error.message}`);
  return { sent: true, id: result.data?.id };
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** Shared dark wrapper for customer emails. */
export function emailShell(title: string, bodyHtml: string) {
  return `<!doctype html><html lang="en-GB"><body style="margin:0;background:#0a0a0a;color:#f3f5f6;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;">
  <p style="font-size:26px;margin:0 0 4px;color:#f3f5f6;">Rebellious Hustler</p>
  <p style="margin:0 0 24px;color:#8f8a86;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">One brand. One voice. One community.</p>
  <h1 style="font-size:20px;margin:0 0 16px;color:#f3f5f6;">${escapeHtml(title)}</h1>
  ${bodyHtml}
  <p style="margin-top:32px;color:#8f8a86;font-size:12px;">Rebellious Hustler, 4 Fox &amp; Goose Shopping Centre, Birmingham, B8 2EP</p>
</div></body></html>`;
}
