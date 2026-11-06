"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { logSchema, evidenceSchema, signoffSchema, logHours, verifyHours, updateSkill, addEvidence, commentEvidence, signOffAsJuniorArtist } from "@/lib/academy";
import type { ActionState } from "./enquiry";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const refresh = (userId: string) => { revalidatePath("/studio/academy"); revalidatePath("/owner/academy"); revalidatePath(`/owner/academy/${userId}`); };

export async function logHoursAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const apprenticeId = String(formData.get("apprenticeId") || p.userId);
  const parsed = logSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  try { await logHours(p, apprenticeId, parsed.data); } catch (e) { return { error: msg(e) }; }
  refresh(apprenticeId);
  return { ok: true };
}

export async function verifyHoursAction(formData: FormData) {
  const p = await requirePrincipal();
  const decision = formData.get("decision") === "reject" ? "reject" : "verify";
  await verifyHours(p, String(formData.get("logId")), decision, String(formData.get("note") ?? ""));
  refresh(String(formData.get("apprenticeId")));
}

export async function updateSkillAction(formData: FormData) {
  const p = await requirePrincipal();
  const apprenticeId = String(formData.get("apprenticeId") || p.userId);
  const status = String(formData.get("status")) as "IN_PROGRESS" | "READY_FOR_REVIEW" | "COMPETENT" | "RENEWAL_DUE";
  await updateSkill(p, apprenticeId, String(formData.get("skillId")), status, String(formData.get("note") ?? ""));
  refresh(apprenticeId);
}

export async function addEvidenceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const apprenticeId = String(formData.get("apprenticeId") || p.userId);
  const parsed = evidenceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  try { await addEvidence(p, apprenticeId, parsed.data, files); } catch (e) { return { error: msg(e) }; }
  refresh(apprenticeId);
  return { ok: true };
}

export async function commentEvidenceAction(formData: FormData) {
  const p = await requirePrincipal();
  await commentEvidence(p, String(formData.get("evidenceId")), String(formData.get("comment") ?? ""));
  refresh(String(formData.get("apprenticeId")));
}

export async function juniorSignoffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const apprenticeId = String(formData.get("apprenticeId"));
  const parsed = signoffSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].path[0] === "confirm" ? "Type SIGN OFF to confirm." : parsed.error.issues[0].message };
  try { await signOffAsJuniorArtist(p, apprenticeId, parsed.data); } catch (e) { return { error: msg(e) }; }
  refresh(apprenticeId); revalidatePath("/owner/artists"); revalidatePath("/artists");
  return { ok: true };
}
