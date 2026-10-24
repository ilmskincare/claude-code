import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { WeekPlanner } from "@/components/week-planner";
import { DateTime } from "luxon";
import { STUDIO_TZ } from "@/lib/time";

export default async function Diary({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const p = await requirePrincipal("/studio/diary");
  const { week } = await searchParams;
  const start = (week ? DateTime.fromISO(week, { zone: STUDIO_TZ }) : DateTime.now().setZone(STUDIO_TZ)).startOf("week");
  const appts = p.artistProfileId ? await db.appointment.findMany({ where: { artistId: p.artistProfileId, startsAt: { gte: start.toJSDate(), lt: start.plus({ weeks: 1 }).toJSDate() }, status: { not: "CANCELLED" } }, include: { client: { select: { name: true } }, artist: true } }) : [];
  const rules = p.artistProfileId ? await db.availabilityRule.findMany({ where: { artistId: p.artistProfileId } }) : [];
  return (<>
    <PageHeader title="My diary" intro="Your week. Setup and clean-down buffers are included in each block." />
    <WeekPlanner weekStartIso={start.toISODate()!} basePath="/studio/diary" appointments={appts.map((a) => ({ id: a.id, reference: a.reference, startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString(), status: a.status, title: a.client.name ?? "Client", artist: a.artist.displayName }))} rules={rules} linkPrefix="/my/bookings" />
  </>);
}
