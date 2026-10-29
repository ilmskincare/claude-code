import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { WeekPlanner } from "@/components/week-planner";
import { DateTime } from "luxon";
import { STUDIO_TZ } from "@/lib/time";

export default async function Planner({ searchParams }: { searchParams: Promise<{ week?: string; artist?: string }> }) {
  const { week, artist } = await searchParams;
  const start = (week ? DateTime.fromISO(week, { zone: STUDIO_TZ }) : DateTime.now().setZone(STUDIO_TZ)).startOf("week");
  const [appts, artists] = await Promise.all([
    db.appointment.findMany({ where: { ...(artist ? { artistId: artist } : {}), startsAt: { gte: start.toJSDate(), lt: start.plus({ weeks: 1 }).toJSDate() }, status: { not: "CANCELLED" } }, include: { client: { select: { name: true } }, artist: true } }),
    db.artistProfile.findMany({ include: { availabilityRules: true }, orderBy: { displayName: "asc" } }),
  ]);
  const rules = artist ? artists.find((a) => a.id === artist)?.availabilityRules ?? [] : [];
  return (<>
    <PageHeader title="Studio planner" intro="All artists, stations and buffers. Moving a booking happens from its page and always needs a reason." />
    <form className="flex gap-2 mb-4 items-center text-sm"><label htmlFor="artist">Artist</label><select id="artist" name="artist" className="select max-w-xs" defaultValue={artist ?? ""}><option value="">Everyone</option>{artists.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}</select><input type="hidden" name="week" value={start.toISODate()!} /><button className="btn btn-secondary">Filter</button></form>
    <WeekPlanner weekStartIso={start.toISODate()!} basePath={`/owner/calendar${artist ? `?artist=${artist}&` : "?"}`.replace(/\?$/, "")} appointments={appts.map((a) => ({ id: a.id, reference: a.reference, startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString(), status: a.status, title: a.client.name ?? "Client", artist: a.artist.displayName }))} rules={rules} linkPrefix="/owner/bookings" />
  </>);
}
