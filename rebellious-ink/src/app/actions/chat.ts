"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { openDirect, sendMessage } from "@/lib/chat";

type ActionState = { ok?: boolean; error?: string; sentId?: string } | undefined;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export async function sendChatAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const channelId = String(formData.get("channelId") ?? "");
  try {
    const m = await sendMessage(p, channelId, String(formData.get("body") ?? ""));
    revalidatePath(`/studio/chat/${channelId}`); revalidatePath("/studio/chat");
    return { ok: true, sentId: m.id };
  } catch (e) { return { error: msg(e) }; }
}

export async function openDirectAction(formData: FormData) {
  const p = await requirePrincipal();
  const c = await openDirect(p, String(formData.get("userId") ?? ""));
  redirect(`/studio/chat/${c.id}`);
}
