import Link from "next/link";
import { DateTime } from "luxon";
import { STUDIO_TZ } from "@/lib/time";

export type PlannerAppt = { id: string; reference: string; startsAt: string; endsAt: string; status: string; title: string; artist: string };
type Rule = { weekday: number; startMinute: number; endMinute: number };

const TONE: Record<string, string> = { CONFIRMED: "bg-acid text-ink", PENDING_DEPOSIT: "bg-warn text-ink", CHECKED_IN: "bg-acid-bright text-ink", IN_SESSION: "bg-acid-deep text-bone", COMPLETED: "bg-graphite text-bone", NO_SHOW: "bg-danger text-white" };

/** Server-rendered week grid (08:00–21:00). Drag-and-drop is ticket P1-15; moves happen via the appointment page with a reason. */
export function WeekPlanner({ weekStartIso, basePath, appointments, rules, linkPrefix }: { weekStartIso: string; basePath: string; appointments: PlannerAppt[]; rules: Rule[]; linkPrefix: string }) {
  const start = DateTime.fromISO(weekStartIso, { zone: STUDIO_TZ });
  const days = Array.from({ length: 7 }, (_, i) => start.plus({ days: i }));
  const DAY_START = 8 * 60, DAY_END = 21 * 60, PX = 1.1;
  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-sm"><Link className="underline" href={`${basePath}?week=${start.minus({ weeks: 1 }).toISODate()}`}>← Previous week</Link><strong>{start.toFormat("d LLL")} – {start.plus({ days: 6 }).toFormat("d LLL yyyy")}</strong><Link className="underline" href={`${basePath}?week=${start.plus({ weeks: 1 }).toISODate()}`}>Next week →</Link></div>
      <div className="grid grid-cols-7 gap-1 overflow-x-auto min-w-[700px]">
        {days.map((d) => {
          const dayAppts = appointments.filter((a) => DateTime.fromISO(a.startsAt, { zone: STUDIO_TZ }).hasSame(d, "day"));
          const dayRules = rules.filter((r) => r.weekday === d.weekday);
          return (
            <div key={d.toISODate()} className="card p-1 relative" style={{ height: (DAY_END - DAY_START) * PX + 28 }}>
              <p className="text-xs font-bold text-center mb-1">{d.toFormat("ccc d")}</p>
              <div className="relative" style={{ height: (DAY_END - DAY_START) * PX }}>
                {dayRules.map((r, i) => <div key={i} className="absolute left-0 right-0 bg-acid-soft/40 rounded" style={{ top: (r.startMinute - DAY_START) * PX, height: (r.endMinute - r.startMinute) * PX }} aria-hidden />)}
                {dayAppts.map((a) => { const s = DateTime.fromISO(a.startsAt, { zone: STUDIO_TZ }); const e = DateTime.fromISO(a.endsAt, { zone: STUDIO_TZ }); const top = (s.hour * 60 + s.minute - DAY_START) * PX; const h = Math.max(18, e.diff(s, "minutes").minutes * PX); return <Link key={a.id} href={`${linkPrefix}/${a.id}`} className={`absolute left-0.5 right-0.5 rounded px-1 text-[11px] leading-tight overflow-hidden ${TONE[a.status] ?? "bg-graphite text-bone"}`} style={{ top, height: h }} title={`${a.reference} ${a.title} ${s.toFormat("HH:mm")}–${e.toFormat("HH:mm")}`}><strong>{s.toFormat("HH:mm")}</strong> {a.title}<br />{a.artist}</Link>; })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="hint mt-2">Shaded = working hours. Green = confirmed, amber = awaiting deposit.</p>
    </div>
  );
}
