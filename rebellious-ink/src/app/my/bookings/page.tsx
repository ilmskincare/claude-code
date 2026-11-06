import Link from "next/link";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { PageHeader, AppointmentBadge, Empty } from "@/components/ui";
import { formatStudio } from "@/lib/time";

export default async function MyBookings() {
  const p = await requirePrincipal("/my/bookings");
  const appts = await db.appointment.findMany({ where: { clientId: p.userId }, include: { artist: true }, orderBy: { startsAt: "desc" } });
  return (<>
    <PageHeader title="My bookings" />
    {appts.length === 0 ? <Empty>No bookings yet.</Empty> : <ul className="space-y-3">{appts.map((a) => <li key={a.id} className="card p-4 flex flex-wrap justify-between items-center gap-3"><div><Link href={`/my/bookings/${a.id}`} className="font-bold text-lg underline-offset-4 hover:underline">{a.reference}</Link><p className="hint">{formatStudio(a.startsAt)} with {a.artist.displayName}</p></div><AppointmentBadge status={a.status} /></li>)}</ul>}
  </>);
}
