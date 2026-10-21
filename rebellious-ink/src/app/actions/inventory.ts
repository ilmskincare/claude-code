"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePrincipal } from "@/lib/session";
import { productSchema, receiveSchema, adjustSchema, issueSchema, upsertProduct, receiveStock, adjustStock, issueToArtist, recordArtistStockPayment } from "@/lib/inventory";
import type { ActionState } from "./enquiry";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const refresh = (productId?: string) => { revalidatePath("/owner/stock"); revalidatePath("/studio/stock"); if (productId) revalidatePath(`/owner/stock/${productId}`); };

export async function saveProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const id = String(formData.get("id") ?? "") || undefined;
  const parsed = productSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  let product;
  try { product = await upsertProduct(p, parsed.data, id); } catch (e) { return { error: msg(e) }; }
  refresh(product.id);
  if (!id) redirect(`/owner/stock/${product.id}`);
  return { ok: true };
}

export async function receiveStockAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const parsed = receiveSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { await receiveStock(p, parsed.data); } catch (e) { return { error: msg(e) }; }
  refresh(parsed.data.productId);
  return { ok: true };
}

export async function adjustStockAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const parsed = adjustSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { await adjustStock(p, parsed.data); } catch (e) { return { error: msg(e) }; }
  refresh(String(formData.get("productId")));
  return { ok: true };
}

export async function issueStockAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const raw = Object.fromEntries(formData.entries());
  const parsed = issueSchema.safeParse({ ...raw, unitPricePounds: raw.unitPricePounds === "" ? undefined : raw.unitPricePounds });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { await issueToArtist(p, parsed.data); } catch (e) { return { error: msg(e) }; }
  refresh(parsed.data.productId);
  return { ok: true };
}

export async function artistStockPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const amount = Math.round(Number(formData.get("amountPounds")) * 100);
  const method = formData.get("method") === "CASH" ? "CASH" : "BANK";
  try { await recordArtistStockPayment(p, String(formData.get("artistId")), amount, method, String(formData.get("note") ?? "")); } catch (e) { return { error: msg(e) }; }
  refresh(); revalidatePath("/owner/artists");
  return { ok: true };
}
