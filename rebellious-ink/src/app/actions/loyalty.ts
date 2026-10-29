"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { completeAppointment, redeemCredit } from "@/lib/loyalty";
import { setMarketingPreference } from "@/lib/marketing";
import type { ActionState } from "./enquiry";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const refresh = (id: string) => { for (const a of ["my", "studio", "owner"]) revalidatePath(`/${a}/bookings/${id}`); revalidatePath("/owner"); revalidatePath("/my/rewards"); };

export async function completeAppointmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const id = String(formData.get("appointmentId"));
  const price = Math.round(Number(formData.get("finalPricePounds")) * 100);
  if (!Number.isFinite(price)) return { error: "Enter the final price." };
  try { const r = await completeAppointment(p, id, price); refresh(id); return { ok: true, error: r.rewards.length ? `Completed. Rewards: ${r.rewards.join("; ")}.` : undefined }; } catch (e) { return { error: msg(e) }; }
}

export async function redeemCreditAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const id = String(formData.get("appointmentId"));
  const amount = Math.round(Number(formData.get("amountPounds")) * 100);
  try { await redeemCredit(p, id, amount); } catch (e) { return { error: msg(e) }; }
  refresh(id);
  return { ok: true };
}

export async function setMarketingPreferenceAction(formData: FormData) {
  const p = await requirePrincipal();
  await setMarketingPreference(p.userId, formData.get("granted") === "yes", "portal");
  revalidatePath("/my/preferences");
}
