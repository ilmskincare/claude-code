import { redirect } from "next/navigation";
import { requirePrincipal } from "@/lib/session";
import { listChannels } from "@/lib/chat";

export default async function ChatHome() {
  const p = await requirePrincipal("/studio/chat");
  const channels = await listChannels(p);
  if (channels.length === 0) redirect("/studio");
  redirect(`/studio/chat/${channels.find((c) => c.unread > 0)?.id ?? channels[0].id}`);
}
