"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { issueQuote, quoteSchema, approveQuote } from "@/lib/quotes";
import { assignArtist } from "@/lib/enquiries";
import { rescheduleAppointment, rescheduleSchema, cancelAppointment, cancelSchema, verifyManualDeposit, manualDepositSchema } from "@/lib/owner";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { can, ForbiddenError } from "@/lib/rbac";
import type { ActionState } from "./enquiry";
import { DateTime } from "luxon";

function message(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong.";
}
function refresh(requestId?: string, appointmentId?: string) {
  if (requestId) for (const a of ["my", "studio", "owner"]) revalidatePath(`/${a}/enquiries/${requestId}`);
  if (appointmentId) for (const a of ["my", "studio", "owner"]) revalidatePath(`/${a}/bookings/${appointmentId}`);
  revalidatePath("/owner"); revalidatePath("/owner/calendar"); revalidatePath("/studio");
}

export async function issueQuoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const requestId = String(formData.get("requestId"));
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { await issueQuote(p, requestId, parsed.data); } catch (e) { return { error: message(e) }; }
  refresh(requestId);
  return { ok: true };
}

export async function approveQuoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  try { await approveQuote(p, String(formData.get("quoteId"))); } catch (e) { return { error: message(e) }; }
  refresh(String(formData.get("requestId")));
  return { ok: true };
}

export async function assignArtistAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const requestId = String(formData.get("requestId"));
  try { await assignArtist(p, requestId, String(formData.get("artistId")), String(formData.get("reason") ?? "Assigned from desk")); } catch (e) { return { error: message(e) }; }
  refresh(requestId);
  return { ok: true };
}

export async function rescheduleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const appointmentId = String(formData.get("appointmentId"));
  const local = String(formData.get("startsAtLocal"));
  const parsed = rescheduleSchema.safeParse({ startsAt: localToIso(local), reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { const a = await rescheduleAppointment(p, appointmentId, parsed.data); refresh(a.requestId ?? undefined, appointmentId); } catch (e) { return { error: message(e) }; }
  return { ok: true };
}

export async function cancelAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const appointmentId = String(formData.get("appointmentId"));
  const parsed = cancelSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { const a = await cancelAppointment(p, appointmentId, parsed.data); refresh(a.requestId ?? undefined, appointmentId); } catch (e) { return { error: message(e) }; }
  return { ok: true };
}

export async function manualDepositAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const appointmentId = String(formData.get("appointmentId"));
  const parsed = manualDepositSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { const r = await verifyManualDeposit(p, appointmentId, parsed.data); refresh(r.appointment.requestId ?? undefined, appointmentId); } catch (e) { return { error: message(e) }; }
  return { ok: true };
}

export async function updateSettingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  if (!can(p, "settings.manage")) throw new ForbiddenError();
  const key = String(formData.get("key"));
  const rawValue = String(formData.get("value") ?? "");
  let value: unknown = rawValue;
  if (rawValue === "true" || rawValue === "false") value = rawValue === "true";
  else if (/^-?\d+(\.\d+)?$/.test(rawValue)) value = Number(rawValue);
  else if (rawValue.trim().startsWith("[")) { try { value = JSON.parse(rawValue); } catch { return { error: "Lists must be JSON, e.g. [\"hands\", \"neck\"]." }; } }
  const studio = await db.studio.findFirstOrThrow();
  const before = await db.studioSetting.findUnique({ where: { studioId_key: { studioId: studio.id, key } } });
  await db.studioSetting.upsert({ where: { studioId_key: { studioId: studio.id, key } }, create: { studioId: studio.id, key, value: value as object, updatedBy: p.userId }, update: { value: value as object, updatedBy: p.userId } });
  await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: "setting.updated", entityType: "StudioSetting", entityId: key, before: before?.value, after: value });
  revalidatePath("/owner/settings"); revalidatePath("/flash"); revalidatePath("/owner/flash"); revalidatePath("/play/gumball"); revalidatePath("/owner/gumball");
  return { ok: true };
}

/** Interpret a datetime-local string as Europe/London wall time. */
function localToIso(local: string) {
  if (!local) return "";
  const dt = DateTime.fromISO(local, { zone: process.env.STUDIO_TIMEZONE || "Europe/London" });
  return dt.isValid ? dt.toISO() : "";
}
