"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { socialPostSchema, savePost, publishPost } from "@/lib/social";
import type { ActionState } from "./enquiry";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

export async function savePostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const id = String(formData.get("id") ?? "") || undefined;
  const parsed = socialPostSchema.safeParse({ caption: formData.get("caption"), assetId: formData.get("assetId"), scheduledFor: formData.get("scheduledFor"), channels: formData.getAll("channels").map(String) });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { await savePost(p, parsed.data, id); } catch (e) { return { error: msg(e) }; }
  revalidatePath("/owner/social");
  return { ok: true };
}

export async function publishPostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  try { await publishPost(p, String(formData.get("id"))); } catch (e) { return { error: msg(e) }; }
  revalidatePath("/owner/social");
  return { ok: true };
}
