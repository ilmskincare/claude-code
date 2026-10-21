"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { rateCardSchema, priceItemSchema, updateRateCard, addPriceItem, removePriceItem } from "@/lib/profiles";
import { db } from "@/lib/db";
import type { ActionState } from "./enquiry";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
async function refresh(artistId: string) { const a = await db.artistProfile.findUnique({ where: { id: artistId }, select: { slug: true } }); revalidatePath("/studio/profile"); revalidatePath(`/owner/artists/${artistId}/profile`); revalidatePath("/owner/rates"); revalidatePath("/owner/artists"); revalidatePath("/artists"); if (a) revalidatePath(`/artists/${a.slug}`); }

export async function saveRateCardAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const artistId = String(formData.get("artistId"));
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = rateCardSchema.safeParse({ ...raw, acceptsEnquiries: formData.has("acceptsEnquiriesPresent") ? raw.acceptsEnquiries === "on" : undefined });
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  try { await updateRateCard(p, artistId, parsed.data); } catch (e) { return { error: msg(e) }; }
  await refresh(artistId);
  return { ok: true };
}

export async function addPriceItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const artistId = String(formData.get("artistId"));
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = priceItemSchema.safeParse({ ...raw, priceToPounds: raw.priceToPounds === "" ? undefined : raw.priceToPounds, durationMinutes: raw.durationMinutes === "" ? undefined : raw.durationMinutes, includesJewellery: raw.includesJewellery === "on" });
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  try { await addPriceItem(p, artistId, parsed.data); } catch (e) { return { error: msg(e) }; }
  await refresh(artistId);
  return { ok: true };
}

export async function removePriceItemAction(formData: FormData) {
  const p = await requirePrincipal();
  await removePriceItem(p, String(formData.get("itemId")));
  await refresh(String(formData.get("artistId")));
}
