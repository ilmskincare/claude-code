import { redirect } from "next/navigation";
import { requirePrincipal } from "@/lib/session";
import { openClientChat, isStaff } from "@/lib/chat";
import { ValidationError, NotFoundError } from "@/lib/rbac";

/** Target of the "Message [artist]" buttons. Signs the client in if needed, then opens their chat with that artist. */
export default async function StartMessage({ searchParams }: { searchParams: Promise<{ artist?: string }> }) {
  const { artist = "" } = await searchParams;
  const p = await requirePrincipal(`/messages/start?artist=${encodeURIComponent(artist)}`);
  try {
    const c = await openClientChat(p, artist);
    redirect(isStaff(p) ? `/studio/chat/${c.id}` : `/my/messages/${c.id}`);
  } catch (e) {
    if (e instanceof ValidationError || e instanceof NotFoundError) redirect(`/artists?message=${encodeURIComponent(e.message)}`);
    throw e;
  }
}
