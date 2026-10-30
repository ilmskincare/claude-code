"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { openDirect, sendMessage, openClientChat } from "@/lib/chat";

type ActionState = { ok?: boolean; error?: string; sentId?: string } | undefined;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export async function sendChatAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const channelId = String(formData.get("channelId") ?? "");
  try {
    const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    const m = await sendMessage(p, channelId, String(formData.get("body") ?? ""), files);
    revalidatePath(`/studio/chat/${channelId}`); revalidatePath("/studio/chat"); revalidatePath(`/my/messages/${channelId}`); revalidatePath("/my/messages");
    return { ok: true, sentId: m.id };
  } catch (e) { return { error: msg(e) }; }
}

export async function openDirectAction(formData: FormData) {
  const p = await requirePrincipal();
  const c = await openDirect(p, String(formData.get("userId") ?? ""));
  redirect(`/studio/chat/${c.id}`);
}

/** "Message the artist" from the public site: opens the client channel and lands in it. */
export async function startClientChatAction(formData: FormData) {
  const p = await requirePrincipal();
  const c = await openClientChat(p, String(formData.get("artist") ?? ""));
  redirect(p.roles.some((r) => r !== "CLIENT") ? `/studio/chat/${c.id}` : `/my/messages/${c.id}`);
}
