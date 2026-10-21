"use client";
import { useActionState } from "react";
import { addRuleAction, removeRuleAction, addLeaveAction, removeLeaveAction } from "@/app/actions/availability";
import { Alert } from "./ui";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
type Rule = { id: string; weekday: number; startMinute: number; endMinute: number; acceptsBookings: boolean; acceptsWalkIns: boolean; label: string | null; validFrom: string | null };
type LeaveRow = { id: string; startsAt: string; endsAt: string; reason: string | null };

function modeLabel(r: Rule) { return r.acceptsBookings && r.acceptsWalkIns ? "Bookings + walk-ins" : r.acceptsWalkIns ? "Walk-ins only" : "Online bookings"; }
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric" });

export function HoursEditor({ artistId, weekly, oneOff, leave }: { artistId: string; weekly: Rule[]; oneOff: Rule[]; leave: LeaveRow[] }) {
  const [ruleState, ruleAction, rulePending] = useActionState(addRuleAction, undefined);
  const [leaveState, leaveAction, leavePending] = useActionState(addLeaveAction, undefined);
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="card p-5 space-y-4">
        <h2 className="text-xl font-bold">Weekly pattern</h2>
        <p className="hint">Online booking slots are only offered inside hours marked for bookings. Walk-in hours are shown on your public profile.</p>
        {DAYS.map((d, i) => { const rows = weekly.filter((r) => r.weekday === i + 1); return (
          <div key={d} className="flex flex-wrap items-center gap-2 border-t border-graphite pt-2">
            <span className="w-28 font-semibold">{d}</span>
            {rows.length === 0 ? <span className="opacity-50">Not in</span> : rows.map((r) => (
              <form key={r.id} action={removeRuleAction} className="flex items-center gap-2 badge badge-outline py-1">
                <input type="hidden" name="ruleId" value={r.id} /><input type="hidden" name="artistId" value={artistId} />
                <span>{hhmm(r.startMinute)}–{hhmm(r.endMinute)} · {modeLabel(r)}{r.label ? ` · ${r.label}` : ""}</span>
                <button className="underline" aria-label={`Remove ${d} ${hhmm(r.startMinute)}`}>remove</button>
              </form>
            ))}
          </div>); })}
        <form action={ruleAction} className="space-y-2 border-t border-graphite pt-3">
          {ruleState?.error && <Alert tone="danger">{ruleState.error}</Alert>}{ruleState?.ok && <Alert tone="success">Hours added.</Alert>}
          <input type="hidden" name="artistId" value={artistId} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><label className="field" htmlFor="weekday">Day</label><select id="weekday" name="weekday" className="select" defaultValue={2}>{DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></div>
            <div><label className="field" htmlFor="start">From</label><input id="start" name="start" type="time" className="input" defaultValue="10:00" required /></div>
            <div><label className="field" htmlFor="end">To</label><input id="end" name="end" type="time" className="input" defaultValue="18:00" required /></div>
            <div><label className="field" htmlFor="mode">Use for</label><select id="mode" name="mode" className="select" defaultValue="bookings"><option value="bookings">Online bookings</option><option value="walk_ins">Walk-ins only</option><option value="both">Bookings + walk-ins</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="field" htmlFor="oneOffDate">One-off date (optional)</label><input id="oneOffDate" name="oneOffDate" type="date" className="input" /><p className="hint">Leave blank for every week. Set a date for a single extra day; the day picker above is ignored.</p></div>
            <div><label className="field" htmlFor="label">Label (optional)</label><input id="label" name="label" className="input" placeholder="Flash day, guest spot…" /></div>
          </div>
          <button className="btn btn-primary" disabled={rulePending}>{rulePending ? "Saving…" : "Add hours"}</button>
        </form>
        {oneOff.length > 0 && <div className="border-t border-graphite pt-3"><h3 className="font-bold mb-2">One-off days</h3><ul className="space-y-1">{oneOff.map((r) => <li key={r.id}><form action={removeRuleAction} className="flex items-center gap-2"><input type="hidden" name="ruleId" value={r.id} /><input type="hidden" name="artistId" value={artistId} /><span>{fmtDate(r.validFrom!)} · {hhmm(r.startMinute)}–{hhmm(r.endMinute)} · {modeLabel(r)}{r.label ? ` · ${r.label}` : ""}</span><button className="underline text-sm">remove</button></form></li>)}</ul></div>}
      </section>
      <section className="card p-5 space-y-4">
        <h2 className="text-xl font-bold">Time off</h2>
        <p className="hint">Holidays, sickness, conventions. Whole days; no online slots are offered and the planner shows you as away.</p>
        {leave.length === 0 ? <p className="opacity-50">None booked.</p> : <ul className="space-y-1">{leave.map((l) => <li key={l.id}><form action={removeLeaveAction} className="flex items-center gap-2"><input type="hidden" name="leaveId" value={l.id} /><input type="hidden" name="artistId" value={artistId} /><span>{fmtDate(l.startsAt)} – {fmtDate(l.endsAt)}{l.reason ? ` · ${l.reason}` : ""}</span><button className="underline text-sm">remove</button></form></li>)}</ul>}
        <form action={leaveAction} className="space-y-2 border-t border-graphite pt-3">
          {leaveState?.error && <Alert tone={leaveState.ok ? "warn" : "danger"}>{leaveState.error}</Alert>}{leaveState?.ok && !leaveState.error && <Alert tone="success">Time off saved.</Alert>}
          <input type="hidden" name="artistId" value={artistId} />
          <div className="grid grid-cols-2 gap-2"><div><label className="field" htmlFor="from">From</label><input id="from" name="from" type="date" className="input" required /></div><div><label className="field" htmlFor="to">To</label><input id="to" name="to" type="date" className="input" required /></div></div>
          <div><label className="field" htmlFor="reason">Reason (optional, private)</label><input id="reason" name="reason" className="input" /></div>
          <button className="btn btn-primary" disabled={leavePending}>{leavePending ? "Saving…" : "Add time off"}</button>
        </form>
      </section>
    </div>
  );
}
