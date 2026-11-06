import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { PageHeader, Alert } from "@/components/ui";
import { formatStudio } from "@/lib/time";
import { emailProviderConfigured, isProduction } from "@/lib/env";

export default async function Mailbox() {
  await requireCapability("studio.manage");
  const [notifications, dev] = await Promise.all([
    db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    !isProduction() && !emailProviderConfigured() ? db.devMailbox.findMany({ orderBy: { createdAt: "desc" }, take: 50 }) : [],
  ]);
  return (<>
    <PageHeader title="Notification outbox" intro="Every transactional message with its delivery status. Message bodies never include health information." />
    {!emailProviderConfigured() && <Alert tone="warn">No email provider configured: messages are written to the development outbox below instead of being sent. Add RESEND_API_KEY to send real email.</Alert>}
    <table className="data mt-4"><thead><tr><th>When</th><th>To</th><th>Template</th><th>Subject</th><th>Status</th></tr></thead><tbody>{notifications.map((n) => <tr key={n.id}><td>{formatStudio(n.createdAt)}</td><td>{n.to}</td><td className="text-xs">{n.templateKey}</td><td>{n.subject}</td><td><span className={`badge ${n.status === "SENT" ? "badge-acid" : n.status === "FAILED" ? "badge-danger" : "badge-muted"}`}>{n.status.toLowerCase()}</span></td></tr>)}</tbody></table>
    {dev.length > 0 && <><h2 className="text-xl font-bold mt-8">Development outbox (not sent)</h2><ul className="mt-2 space-y-2">{dev.map((m) => <li key={m.id} className="card p-3 text-sm"><p><strong>{m.subject}</strong> → {m.to} · {formatStudio(m.createdAt)}</p><pre className="whitespace-pre-wrap text-xs mt-1 opacity-80">{m.text}</pre></li>)}</ul></>}
  </>);
}
