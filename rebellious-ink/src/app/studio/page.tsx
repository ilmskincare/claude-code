import Link from "next/link";
import { requirePrincipal } from "@/lib/session";
import { artistDashboard } from "@/lib/metrics";
import { PageHeader, Stat, EnquiryBadge, AppointmentBadge, Empty } from "@/components/ui";
import { formatStudio } from "@/lib/time";
import { formatPence } from "@/lib/money";

export default async function StudioHome() {
  const p = await requirePrincipal("/studio");
  if (!p.artistProfileId) return <Empty>You do not have an artist profile. Owners manage enquiries from the <Link href="/owner" className="underline">command centre</Link>.</Empty>;
  const d = await artistDashboard(p.artistProfileId);
  return (<>
    <PageHeader title={`Today, ${p.name?.split(" ")[0] ?? "artist"}`} intro="Only your own enquiries, bookings and earnings appear here." />
    <div className="grid sm:grid-cols-3 gap-4 mb-8"><Stat label="Open enquiries" value={d.inbox.length} /><Stat label="Upcoming appointments" value={d.upcoming.length} /><Stat label="Deposits this month" value={formatPence(d.depositsThisMonthPence)} hint="Verified deposits on your bookings" /></div>
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="card p-5"><h2 className="text-xl font-bold mb-3">Inbox</h2>{d.inbox.length === 0 ? <p className="opacity-60">Nothing waiting.</p> : <ul className="space-y-2">{d.inbox.map((r) => <li key={r.id} className="flex justify-between items-center gap-2"><Link href={`/studio/enquiries/${r.id}`} className="underline-offset-4 hover:underline"><strong>{r.reference}</strong> · {r.client.name}</Link><EnquiryBadge status={r.status} /></li>)}</ul>}</section>
      <section className="card p-5"><h2 className="text-xl font-bold mb-3">Next up</h2>{d.upcoming.length === 0 ? <p className="opacity-60">No upcoming bookings.</p> : <ul className="space-y-2">{d.upcoming.map((a) => <li key={a.id} className="flex justify-between items-center gap-2"><span><strong>{formatStudio(a.startsAt, "ccc d LLL HH:mm")}</strong> · {a.client.name} · {a.reference}</span><AppointmentBadge status={a.status} /></li>)}</ul>}</section>
    </div>
  </>);
}
