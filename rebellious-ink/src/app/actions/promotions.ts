"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { promotionSchema, savePromotion, endPromotion } from "@/lib/promotions";
import type { ActionState } from "./enquiry";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const refresh = () => { for (const path of ["/", "/artists", "/owner/promotions", "/owner/rates", "/studio/promotions"]) revalidatePath(path); revalidatePath("/artists/[slug]", "page"); };

export async function savePromotionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const id = String(formData.get("id") ?? "") || undefined;
  const raw = Object.fromEntries(formData.entries());
  const parsed = promotionSchema.safeParse({ ...raw, showOnPublic: formData.get("showOnPublic") === "on" || formData.get("showOnPublic") === "true" });
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  try { await savePromotion(p, parsed.data, id); } catch (e) { return { error: msg(e) }; }
  refresh();
  return { ok: true };
}

export async function endPromotionAction(formData: FormData) {
  const p = await requirePrincipal();
  await endPromotion(p, String(formData.get("id")));
  refresh();
}
