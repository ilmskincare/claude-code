import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { formatStudio } from "@/lib/time";

export default async function Audit({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireCapability("audit.view");
  const { q } = await searchParams;
  const rows = await db.auditLog.findMany({ where: q ? { OR: [{ action: { contains: q } }, { entityType: { contains: q, mode: "insensitive" } }, { actorLabel: { contains: q, mode: "insensitive" } }, { entityId: q }] } : {}, orderBy: { createdAt: "desc" }, take: 200 });
  return (<>
    <PageHeader title="Audit log" intro="Who did what, when, to which record, with before and after values. Health record access is logged separately and only visible to the owner." />
    <form className="flex gap-2 mb-4"><input name="q" className="input max-w-sm" placeholder="Search action, entity, actor or id" defaultValue={q ?? ""} /><button className="btn btn-secondary">Search</button></form>
    <table className="data"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Reason</th><th>Change</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td className="whitespace-nowrap">{formatStudio(r.createdAt, "dd/MM HH:mm:ss")}</td><td>{r.actorLabel}</td><td><code className="text-xs">{r.action}</code></td><td className="text-xs">{r.entityType} <span className="opacity-50">{r.entityId.slice(0, 8)}</span></td><td className="text-xs">{r.reason}</td><td><details className="text-xs"><summary className="cursor-pointer">view</summary><pre className="whitespace-pre-wrap">{JSON.stringify({ before: r.before, after: r.after }, null, 1)}</pre></details></td></tr>)}</tbody></table>
  </>);
}
