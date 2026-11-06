"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePrincipal } from "@/lib/session";
import { campaignSchema, saveCampaign, sendCampaign, sendCampaignTest } from "@/lib/marketing";
import type { ActionState } from "./enquiry";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

export async function saveCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const id = String(formData.get("id") ?? "") || undefined;
  const parsed = campaignSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  let c;
  try { c = await saveCampaign(p, parsed.data, id); } catch (e) { return { error: msg(e) }; }
  revalidatePath("/owner/marketing"); revalidatePath(`/owner/marketing/${c.id}`);
  if (!id) redirect(`/owner/marketing/${c.id}`);
  return { ok: true };
}

export async function sendTestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  try { await sendCampaignTest(p, String(formData.get("id"))); } catch (e) { return { error: msg(e) }; }
  return { ok: true };
}

export async function sendCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  if (formData.get("confirm") !== "SEND") return { error: "Type SEND to confirm." };
  const id = String(formData.get("id"));
  try { await sendCampaign(p, id); } catch (e) { return { error: msg(e) }; }
  revalidatePath("/owner/marketing"); revalidatePath(`/owner/marketing/${id}`);
  return { ok: true };
}
