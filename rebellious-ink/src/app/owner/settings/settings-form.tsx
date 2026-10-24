"use client";
import { useActionState } from "react";
import { updateSettingAction } from "@/app/actions/studio";

export function SettingsForm({ defs }: { defs: { key: string; label: string; hint: string; value: unknown }[] }) {
  return <div className="grid md:grid-cols-2 gap-4">{defs.map((d) => <SettingRow key={d.key} d={d} />)}</div>;
}

function SettingRow({ d }: { d: { key: string; label: string; hint: string; value: unknown } }) {
  const [state, action, pending] = useActionState(updateSettingAction, undefined);
  return (
    <form action={action} className="card p-4 space-y-2">
      <input type="hidden" name="key" value={d.key} />
      <label className="field" htmlFor={d.key}>{d.label}</label>
      <div className="flex gap-2"><input id={d.key} name="value" className="input" defaultValue={String(d.value)} /><button className="btn btn-secondary" disabled={pending}>Save</button></div>
      <p className="hint">{d.hint}{state?.ok ? " · Saved" : ""}{state?.error ? ` · ${state.error}` : ""}</p>
    </form>
  );
}
