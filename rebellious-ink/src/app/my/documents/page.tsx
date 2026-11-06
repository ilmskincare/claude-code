import Link from "next/link";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { PageHeader, Empty } from "@/components/ui";
import { formatStudio } from "@/lib/time";

export default async function MyDocuments() {
  const p = await requirePrincipal("/my/documents");
  const [pdfs, notifications] = await Promise.all([
    db.generatedPDF.findMany({ where: { recipientUserId: p.userId }, orderBy: { createdAt: "desc" } }),
    db.notification.findMany({ where: { userId: p.userId }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return (<>
    <PageHeader title="My documents" intro="Guides and signed forms issued to you, with a record of exactly which version was sent." />
    {pdfs.length === 0 ? <Empty>No PDFs issued yet. Current guides are always available <Link href="/guides" className="underline">here</Link>.</Empty> : <ul className="space-y-2">{pdfs.map((d) => <li key={d.id} className="card p-3">{d.title} · {formatStudio(d.createdAt)}</li>)}</ul>}
    <h2 className="text-xl font-bold mt-8">Emails we have sent you</h2>
    <table className="data mt-2"><thead><tr><th>When</th><th>Subject</th><th>Status</th></tr></thead><tbody>{notifications.map((n) => <tr key={n.id}><td>{formatStudio(n.createdAt)}</td><td>{n.subject}</td><td>{n.status.toLowerCase()}</td></tr>)}</tbody></table>
  </>);
}
