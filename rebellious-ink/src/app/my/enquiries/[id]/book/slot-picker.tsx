"use client";
import { useActionState, useMemo, useState } from "react";
import { bookSlot } from "@/app/actions/enquiry";
import { Alert } from "@/components/ui";

export function SlotPicker({ requestId, slots, durationMinutes }: { requestId: string; slots: string[]; durationMinutes: number }) {
  const [state, action, pending] = useActionState(bookSlot, undefined);
  const [chosen, setChosen] = useState<string | null>(null);
  const byDay = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of slots) { const d = new Date(s).toLocaleDateString("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long" }); m.set(d, [...(m.get(d) ?? []), s]); }
    return [...m.entries()];
  }, [slots]);
  if (slots.length === 0) return <Alert tone="warn">No free slots in the next six weeks. Message your artist and we will find a time or add you to the waiting list.</Alert>;
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="startsAt" value={chosen ?? ""} />
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {byDay.map(([day, times]) => (
          <fieldset key={day} className="card p-4"><legend className="font-bold px-1">{day}</legend>
            <div className="flex flex-wrap gap-2 mt-2">{times.map((t) => { const label = new Date(t).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" }); return <button type="button" key={t} onClick={() => setChosen(t)} aria-pressed={chosen === t} className={`btn ${chosen === t ? "btn-primary" : "btn-secondary"}`}>{label}</button>; })}</div>
          </fieldset>
        ))}
      </div>
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <p>{chosen ? <>Selected: <strong>{new Date(chosen).toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "full", timeStyle: "short" })}</strong> · about {Math.round(durationMinutes / 6) / 10} h</> : "Pick a time above."}</p>
        <button className="btn btn-primary" disabled={!chosen || pending}>{pending ? "Holding your slot…" : "Hold slot and pay deposit"}</button>
      </div>
    </form>
  );
}
