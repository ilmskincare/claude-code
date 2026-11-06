import Link from "next/link";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { marketingAudience } from "@/lib/marketing";
import { PageHeader, Stat, Empty } from "@/components/ui";
import { formatStudio } from "@/lib/time";
import { emailProviderConfigured } from "@/lib/env";
import { Alert } from "@/components/ui";

export default async function Marketing() {
  await requireCapability("studio.manage");
  const [campaigns, audience] = await Promise.all([db.marketingCampaign.findMany({ orderBy: { createdAt: "desc" } }), marketingAudience()]);
  return (<>
    <PageHeader title="Email marketing" intro="Only clients who have opted in receive campaigns. Every email carries a one-click unsubscribe." actions={<Link href="/owner/marketing/new" className="btn btn-primary">New campaign</Link>} />
    {!emailProviderConfigured() && <div className="mb-4"><Alert tone="warn">No email provider is connected, so campaigns go to the development outbox rather than real inboxes.</Alert></div>}
    <div className="grid sm:grid-cols-2 gap-4 mb-6"><Stat label="Opted-in clients" value={audience.length} /><Stat label="Campaigns" value={campaigns.length} /></div>
    {campaigns.length === 0 ? <Empty>No campaigns yet.</Empty> : <table className="data"><thead><tr><th>Name</th><th>Subject</th><th>Status</th><th>Sent</th><th>Delivered / failed</th></tr></thead><tbody>{campaigns.map((c) => <tr key={c.id}><td><Link href={`/owner/marketing/${c.id}`} className="underline">{c.name}</Link></td><td>{c.subject}</td><td><span className={`badge ${c.status === "sent" ? "badge-acid" : c.status === "failed" ? "badge-danger" : "badge-muted"}`}>{c.status}</span></td><td>{c.sentAt ? formatStudio(c.sentAt) : "—"}</td><td>{c.status === "sent" || c.status === "failed" ? `${c.sentCount} / ${c.failedCount}` : "—"}</td></tr>)}</tbody></table>}
  </>);
}
