"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { addRule, removeRule, addLeave, removeLeave, ruleSchema, leaveSchema } from "@/lib/availability";
import type { ActionState } from "./enquiry";

function message(e: unknown) { return e instanceof Error ? e.message : "Something went wrong."; }
function refresh(artistId: string) { revalidatePath("/studio/hours"); revalidatePath(`/owner/artists/${artistId}/hours`); revalidatePath("/owner/calendar"); revalidatePath("/studio/diary"); }

export async function addRuleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const artistId = String(formData.get("artistId"));
  const parsed = ruleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { await addRule(p, artistId, parsed.data); } catch (e) { return { error: message(e) }; }
  refresh(artistId);
  return { ok: true };
}

export async function removeRuleAction(formData: FormData) {
  const p = await requirePrincipal();
  await removeRule(p, String(formData.get("ruleId")));
  refresh(String(formData.get("artistId")));
}

export async function addLeaveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const artistId = String(formData.get("artistId"));
  const parsed = leaveSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const r = await addLeave(p, artistId, parsed.data);
    refresh(artistId);
    return r.clashingAppointments > 0 ? { ok: true, error: `Time off saved, but ${r.clashingAppointments} existing booking(s) fall inside it. Move or cancel them from the planner.` } : { ok: true };
  } catch (e) { return { error: message(e) }; }
}

export async function removeLeaveAction(formData: FormData) {
  const p = await requirePrincipal();
  await removeLeave(p, String(formData.get("leaveId")));
  refresh(String(formData.get("artistId")));
}
