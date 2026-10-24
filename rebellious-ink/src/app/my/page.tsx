import Link from "next/link";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { PageHeader, EnquiryBadge, Empty } from "@/components/ui";
import { formatStudio } from "@/lib/time";

export default async function MyEnquiries() {
  const p = await requirePrincipal("/my");
  const requests = await db.bookingRequest.findMany({ where: { clientId: p.userId }, include: { artist: true, quotes: { where: { status: "SENT" } } }, orderBy: { updatedAt: "desc" } });
  return (
    <>
      <PageHeader title={`Hello${p.name ? `, ${p.name.split(" ")[0]}` : ""}`} intro="Your enquiries, quotes and messages with the studio." />
      {requests.length === 0 ? <Empty>You have no enquiries yet. <Link href="/enquire" className="underline">Start one</Link>.</Empty> : (
        <ul className="space-y-3">{requests.map((r) => (
          <li key={r.id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
            <div><Link href={`/my/enquiries/${r.id}`} className="font-bold text-lg underline-offset-4 hover:underline">{r.reference}</Link><p className="hint">{r.category.replace(/_/g, " ").toLowerCase()} · {r.artist?.displayName ?? "artist to be matched"} · updated {formatStudio(r.updatedAt)}</p></div>
            <div className="flex items-center gap-2">{r.quotes.length > 0 && <span className="badge badge-warn">Quote waiting</span>}<EnquiryBadge status={r.status} /></div>
          </li>))}
        </ul>
      )}
    </>
  );
}
