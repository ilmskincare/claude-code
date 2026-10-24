import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { loadHours } from "@/lib/availability";
import { PageHeader, BackLink } from "@/components/ui";
import { HoursEditor } from "@/components/hours-editor";

export default async function OwnerArtistHours({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("roster.manage");
  const { id } = await params;
  const artist = await db.artistProfile.findUnique({ where: { id } });
  if (!artist) notFound();
  const h = await loadHours(id);
  const ser = (r: (typeof h.weekly)[number]) => ({ ...r, validFrom: r.validFrom ? r.validFrom.toISOString() : null });
  return (<>
    <BackLink href="/owner/artists">Artists</BackLink>
    <PageHeader title={`${artist.displayName}: hours`} intro="Changes here are audited and take effect immediately for online bookings." />
    <HoursEditor artistId={id} weekly={h.weekly.map(ser)} oneOff={h.oneOff.map(ser)} leave={h.leave.map((l) => ({ id: l.id, startsAt: l.startsAt.toISOString(), endsAt: l.endsAt.toISOString(), reason: l.reason }))} />
  </>);
}
