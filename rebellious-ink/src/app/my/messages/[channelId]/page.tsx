import { notFound } from "next/navigation";
import { requirePrincipal } from "@/lib/session";
import { channelMessages } from "@/lib/chat";
import { ForbiddenError, NotFoundError } from "@/lib/rbac";
import { ChatPane } from "@/components/chat-pane";
import { BackLink } from "@/components/ui";

export default async function MyMessageThread({ params }: { params: Promise<{ channelId: string }> }) {
  const p = await requirePrincipal("/my/messages");
  const { channelId } = await params;
  let thread;
  try { thread = await channelMessages(p, channelId); } catch (e) { if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound(); throw e; }
  if (thread.channel.kind !== "CLIENT") notFound();
  return (<>
    <BackLink href="/my/messages">Messages</BackLink>
    <ChatPane key={thread.channel.id} clientView channelId={thread.channel.id} title={thread.channel.title} members={thread.channel.members} kind={thread.channel.kind} initial={thread.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
  </>);
}
