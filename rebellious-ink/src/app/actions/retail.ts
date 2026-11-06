"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { retailSaleSchema, recordRetailSale } from "@/lib/retail";
import type { ActionState } from "./enquiry";

export async function recordRetailSaleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const practitionerId = String(formData.get("practitionerId") || p.artistProfileId || "");
  const parsed = retailSaleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  try { await recordRetailSale(p, practitionerId, parsed.data); } catch (e) { return { error: e instanceof Error ? e.message : "Something went wrong." }; }
  revalidatePath("/studio/sales"); revalidatePath("/owner/stock/sales"); revalidatePath("/owner/stock"); revalidatePath("/studio/stock");
  return { ok: true };
}
