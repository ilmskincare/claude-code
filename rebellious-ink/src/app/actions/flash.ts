"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrincipal, requirePrincipal } from "@/lib/session";
import { designSchema, hotspotSchema, bookDesignSchema, createDesign, updateDesign, retireDesign, createSheet, addDesignFromSheet, bulkAdjustPrices, bookDesign } from "@/lib/flash";
import type { ActionState } from "./enquiry";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const refresh = () => { for (const p of ["/flash", "/owner/flash", "/studio/flash"]) revalidatePath(p); revalidatePath("/flash/[id]", "page"); revalidatePath("/owner/flash/sheets/[id]", "page"); };

function parseDesign(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return designSchema.safeParse({ ...raw, apprenticeAvailable: raw.apprenticeAvailable === "on", repeatable: raw.repeatable === "on", editionSize: raw.editionSize === "" ? undefined : raw.editionSize });
}

export async function saveDesignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const id = String(formData.get("id") ?? "") || undefined;
  const parsed = parseDesign(formData);
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  const file = formData.get("image");
  try {
    if (id) await updateDesign(p, id, parsed.data, file instanceof File ? file : null);
    else { if (!(file instanceof File) || file.size === 0) return { error: "Upload the design image." }; await createDesign(p, parsed.data, file); }
  } catch (e) { return { error: msg(e) }; }
  refresh();
  return { ok: true };
}

export async function retireDesignAction(formData: FormData) {
  const p = await requirePrincipal();
  await retireDesign(p, String(formData.get("id")));
  refresh();
}

export async function uploadSheetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Upload the sheet image." };
  let sheetId: string;
  try { sheetId = (await createSheet(p, { title: String(formData.get("title") ?? ""), artistId: String(formData.get("artistId") ?? "") || undefined }, file)).id; } catch (e) { return { error: msg(e) }; }
  refresh();
  redirect(`${p.artistProfileId && !formData.get("artistId") ? "/studio" : "/owner"}/flash/sheets/${sheetId}`);
}

export async function addHotspotAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const parsed = hotspotSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  try { await addDesignFromSheet(p, String(formData.get("sheetId")), { ...parsed.data, theme: String(formData.get("theme") ?? ""), apprenticeAvailable: formData.get("apprenticeAvailable") === "on", repeatable: formData.get("repeatable") === "on" }); } catch (e) { return { error: msg(e) }; }
  refresh();
  return { ok: true };
}

export async function bulkPriceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const size = formData.get("size") === "palm" ? "palm" : "small";
  const delta = Math.round(Number(formData.get("deltaPounds")) * 100);
  if (!Number.isFinite(delta) || delta === 0) return { error: "Enter an amount, e.g. 10 or -5." };
  let n = 0;
  try { n = await bulkAdjustPrices(p, size, delta); } catch (e) { return { error: msg(e) }; }
  refresh();
  return { ok: true, error: `${n} design override${n === 1 ? "" : "s"} adjusted. Designs on the default price follow Settings instead.` };
}

/** Public "Book this": signed-out visitors are sent to sign in and come straight back. */
export async function bookDesignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await getPrincipal();
  const designId = String(formData.get("designId"));
  if (!p) redirect(`/login?next=${encodeURIComponent(`/flash/${designId}`)}`);
  const parsed = bookDesignSchema.safeParse({ ...Object.fromEntries(formData.entries()), declaredOver18: formData.get("declaredOver18") === "on" });
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  let requestId: string;
  try { requestId = (await bookDesign(p, parsed.data)).id; } catch (e) { return { error: msg(e) }; }
  refresh(); revalidatePath("/my");
  redirect(`/my/enquiries/${requestId}/book`);
}
