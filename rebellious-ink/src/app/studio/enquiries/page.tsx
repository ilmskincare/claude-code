import Link from "next/link";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { PageHeader, EnquiryBadge, Empty } from "@/components/ui";
import { formatStudio } from "@/lib/time";

export default async function StudioEnquiries() {
  const p = await requirePrincipal("/studio/enquiries");
  const list = p.artistProfileId ? await db.bookingRequest.findMany({ where: { artistId: p.artistProfileId }, include: { client: { select: { name: true } } }, orderBy: { updatedAt: "desc" } }) : [];
  return (<>
    <PageHeader title="My enquiries" />
    {list.length === 0 ? <Empty>No enquiries assigned to you.</Empty> : <table className="data"><thead><tr><th>Reference</th><th>Client</th><th>Service</th><th>Status</th><th>Updated</th></tr></thead><tbody>{list.map((r) => <tr key={r.id}><td><Link href={`/studio/enquiries/${r.id}`} className="underline">{r.reference}</Link></td><td>{r.client.name}</td><td>{r.category.replace(/_/g, " ").toLowerCase()}</td><td><EnquiryBadge status={r.status} /></td><td>{formatStudio(r.updatedAt)}</td></tr>)}</tbody></table>}
  </>);
}
