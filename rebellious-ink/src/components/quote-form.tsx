"use client";
import { useActionState } from "react";
import { issueQuoteAction } from "@/app/actions/studio";
import { Alert } from "./ui";

export function QuoteForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(issueQuoteAction, undefined);
  return (
    <form action={action} className="space-y-3 border-t border-border pt-3">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">Quote sent to the client.</Alert>}
      <input type="hidden" name="requestId" value={requestId} />
      <div><label className="field" htmlFor="scope">Scope</label><textarea id="scope" name="scope" className="textarea" rows={3} required placeholder="What is included: design, size, placement, sessions, touch-up policy." /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><label className="field" htmlFor="priceBasis">Basis</label><select id="priceBasis" name="priceBasis" className="select" defaultValue="fixed"><option value="fixed">Fixed price</option><option value="hourly">Hourly</option><option value="per_session">Per session</option><option value="day_rate">Day rate</option></select></div>
        <div><label className="field" htmlFor="amountPounds">Total (£)</label><input id="amountPounds" name="amountPounds" type="number" min={1} step="0.01" className="input" required /></div>
        <div><label className="field" htmlFor="depositPounds">Deposit (£)</label><input id="depositPounds" name="depositPounds" type="number" min={0} step="0.01" className="input" required /></div>
        <div><label className="field" htmlFor="estimatedMinutes">Minutes</label><input id="estimatedMinutes" name="estimatedMinutes" type="number" min={15} step={15} className="input" defaultValue={120} required /></div>
        <div><label className="field" htmlFor="sessions">Sessions</label><input id="sessions" name="sessions" type="number" min={1} className="input" defaultValue={1} required /></div>
        <div><label className="field" htmlFor="expiresInDays">Valid (days)</label><input id="expiresInDays" name="expiresInDays" type="number" min={1} max={90} className="input" defaultValue={14} /></div>
      </div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Sending…" : "Send quote"}</button>
    </form>
  );
}
