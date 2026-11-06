import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, EnquiryBadge } from "@/components/ui";
import { formatStudio } from "@/lib/time";
import { OPEN_STATUSES } from "@/lib/enquiry-state";

export default async function OwnerEnquiries({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  const list = await db.bookingRequest.findMany({ where: all ? {} : { status: { in: OPEN_STATUSES } }, include: { client: { select: { name: true } }, artist: true }, orderBy: { updatedAt: "desc" }, take: 200 });
  return (<>
    <PageHeader title="Enquiries" intro="Every enquiry in the studio. Unassigned ones need an artist." actions={<><Link href="/owner/enquiries?all=1" className="btn btn-secondary">Show all</Link><Link href="/enquire" className="btn btn-primary">Log desk enquiry</Link></>} />
    <table className="data"><thead><tr><th>Reference</th><th>Client</th><th>Service</th><th>Artist</th><th>Status</th><th>Updated</th></tr></thead><tbody>{list.map((r) => <tr key={r.id}><td><Link href={`/owner/enquiries/${r.id}`} className="underline">{r.reference}</Link></td><td>{r.client.name}</td><td>{r.category.replace(/_/g, " ").toLowerCase()}</td><td>{r.artist?.displayName ?? <span className="badge badge-warn">Unassigned</span>}</td><td><EnquiryBadge status={r.status} /></td><td>{formatStudio(r.updatedAt)}</td></tr>)}</tbody></table>
  </>);
}
