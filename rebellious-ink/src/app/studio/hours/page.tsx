import { requirePrincipal } from "@/lib/session";
import { loadHours } from "@/lib/availability";
import { PageHeader, Empty } from "@/components/ui";
import { HoursEditor } from "@/components/hours-editor";

export default async function StudioHours() {
  const p = await requirePrincipal("/studio/hours");
  if (!p.artistProfileId) return <Empty>No artist profile on this account.</Empty>;
  const h = await loadHours(p.artistProfileId);
  return (<>
    <PageHeader title="My hours" intro="When you are at the studio, what those hours are for, and when you are away. Clients only ever see genuinely free online-booking slots." />
    <HoursEditor artistId={p.artistProfileId} weekly={h.weekly.map(serialise)} oneOff={h.oneOff.map(serialise)} leave={h.leave.map((l) => ({ id: l.id, startsAt: l.startsAt.toISOString(), endsAt: l.endsAt.toISOString(), reason: l.reason }))} />
  </>);
}

function serialise(r: { id: string; weekday: number; startMinute: number; endMinute: number; acceptsBookings: boolean; acceptsWalkIns: boolean; label: string | null; validFrom: Date | null }) {
  return { ...r, validFrom: r.validFrom ? r.validFrom.toISOString() : null };
}
