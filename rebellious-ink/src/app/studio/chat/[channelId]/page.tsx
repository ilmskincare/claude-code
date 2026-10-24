import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePrincipal } from "@/lib/session";
import { channelMessages, listChannels, staffDirectory } from "@/lib/chat";
import { ForbiddenError, NotFoundError } from "@/lib/rbac";
import { openDirectAction } from "@/app/actions/chat";
import { ChatPane } from "@/components/chat-pane";
import { PageHeader } from "@/components/ui";
import { formatStudio } from "@/lib/time";

export default async function ChatChannel({ params }: { params: Promise<{ channelId: string }> }) {
  const p = await requirePrincipal("/studio/chat");
  const { channelId } = await params;
  let thread;
  try { thread = await channelMessages(p, channelId); } catch (e) { if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound(); throw e; }
  const [channels, people] = await Promise.all([listChannels(p), staffDirectory()]);
  return (<>
    <PageHeader title="Staff chat" intro="Studio-wide, management, and one-to-one. Nothing here reaches clients. Owners can read every channel." />
    <div className="grid lg:grid-cols-[280px_1fr] gap-4 items-start">
      <aside className="space-y-3">
        <ul className="card divide-y divide-graphite">
          {channels.map((c) => <li key={c.id}><Link href={`/studio/chat/${c.id}`} className={`block px-3 py-2 ${c.id === channelId ? "bg-steel" : ""}`} aria-current={c.id === channelId ? "page" : undefined}><span className="flex items-center justify-between"><span className="font-semibold">{c.kind === "STUDIO" ? "# " : c.kind === "MANAGEMENT" ? "🔒 " : ""}{c.title}</span>{c.unread > 0 && <span className="badge badge-acid">{c.unread}</span>}</span>{c.last && <span className="block text-xs opacity-60 truncate">{c.last.by}: {c.last.body} · {formatStudio(c.last.at, "dd/MM HH:mm")}</span>}</Link></li>)}
        </ul>
        <form action={openDirectAction} className="card p-3 flex gap-2 items-end">
          <div className="flex-1"><label className="field text-sm" htmlFor="dm-user">New direct message</label><select id="dm-user" name="userId" className="select" required defaultValue=""><option value="" disabled>Choose a colleague…</option>{people.filter((x) => x.userId !== p.userId).map((x) => <option key={x.userId} value={x.userId}>{x.name}</option>)}</select></div>
          <button className="btn btn-secondary">Open</button>
        </form>
      </aside>
      <ChatPane key={thread.channel.id} channelId={thread.channel.id} title={thread.channel.title} members={thread.channel.members} kind={thread.channel.kind} initial={thread.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
    </div>
  </>);
}
