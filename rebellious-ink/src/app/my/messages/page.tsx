import Link from "next/link";
import { requirePrincipal } from "@/lib/session";
import { listChannels } from "@/lib/chat";
import { PageHeader, Empty } from "@/components/ui";
import { formatStudio } from "@/lib/time";

export default async function MyMessages() {
  const p = await requirePrincipal("/my/messages");
  const channels = await listChannels(p);
  return (<>
    <PageHeader title="Messages" intro="Your chats with our artists. Start one from the Message button on any artist's page. The desk and the studio owners can see these chats so they can help." />
    {channels.length === 0 ? <Empty>No chats yet. <Link href="/artists" className="underline">Find an artist</Link> and press Message.</Empty> : (
      <ul className="card divide-y divide-border">
        {channels.map((c) => <li key={c.id}><Link href={`/my/messages/${c.id}`} className="block px-4 py-3 hover:bg-surface-muted"><span className="flex items-center justify-between gap-3"><span className="font-semibold">{c.title}</span>{c.unread > 0 && <span className="badge badge-acid">{c.unread} new</span>}</span>{c.last && <span className="block text-sm opacity-70 truncate">{c.last.by}: {c.last.body} · {formatStudio(c.last.at)}</span>}</Link></li>)}
      </ul>
    )}
  </>);
}
