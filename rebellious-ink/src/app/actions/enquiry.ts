"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createEnquiry, enquirySchema, postMessage } from "@/lib/enquiries";
import { getPrincipal, requirePrincipal } from "@/lib/session";
import { respondToQuote } from "@/lib/quotes";
import { createHold, createPendingAppointmentFromHold } from "@/lib/booking";
import { createDepositCheckout } from "@/lib/stripe";
import { stripeConfigured } from "@/lib/env";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; ok?: boolean } | undefined;

function message(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong.";
}

export async function submitEnquiry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = enquirySchema.safeParse({
    ...raw,
    preferredDays: formData.getAll("preferredDays").map(String),
    isCoverUp: raw.isCoverUp === "on", hasScarConcern: raw.hasScarConcern === "on",
    declaredOver18: raw.declaredOver18 === "on", privacyAccepted: raw.privacyAccepted === "on", marketingOptIn: raw.marketingOptIn === "on",
    sizeCm: raw.sizeCm === "" ? undefined : raw.sizeCm,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `${first.path.join(".")}: ${first.message}` };
  }
  const files = formData.getAll("references").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 6);
  const h = await headers();
  let reference: string;
  try {
    const p = await getPrincipal();
    const r = await createEnquiry(parsed.data, files, { createdBy: p && p.roles.some((x) => x !== "CLIENT") ? p : null, ip: h.get("x-forwarded-for") });
    reference = r.reference;
  } catch (e) {
    return { error: message(e) };
  }
  redirect(`/enquire/thanks/${reference}`);
}

export async function sendMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const requestId = String(formData.get("requestId"));
  const visibility = formData.get("internal") === "on" ? "INTERNAL_ONLY" : "CLIENT_VISIBLE";
  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  try {
    await postMessage(p, requestId, String(formData.get("body") ?? ""), visibility, files);
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath(`/my/enquiries/${requestId}`);
  revalidatePath(`/studio/enquiries/${requestId}`);
  revalidatePath(`/owner/enquiries/${requestId}`);
  return { ok: true };
}

export async function respondQuote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const quoteId = String(formData.get("quoteId"));
  const decision = formData.get("decision") === "accept" ? "ACCEPTED" : "DECLINED";
  let requestId: string;
  try {
    const q = await respondToQuote(p, quoteId, decision);
    requestId = q.requestId;
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath(`/my/enquiries/${requestId}`);
  if (decision === "ACCEPTED") redirect(`/my/enquiries/${requestId}/book`);
  return { ok: true };
}

/** Client picks a slot → hold → pending appointment → Stripe Checkout (or bank-transfer instructions). */
export async function bookSlot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const requestId = String(formData.get("requestId"));
  const startsAt = new Date(String(formData.get("startsAt")));
  if (Number.isNaN(startsAt.getTime())) return { error: "Please choose a time." };
  let appointmentId: string;
  try {
    const { hold } = await createHold({ requestId, clientId: p.userId, startsAt });
    const appt = await createPendingAppointmentFromHold(hold.id, { userId: p.userId, label: "Client" });
    appointmentId = appt.id;
  } catch (e) {
    return { error: message(e) };
  }
  if (stripeConfigured()) {
    const session = await createDepositCheckout(appointmentId);
    if (session.url) redirect(session.url);
  }
  redirect(`/my/bookings/${appointmentId}`);
}
