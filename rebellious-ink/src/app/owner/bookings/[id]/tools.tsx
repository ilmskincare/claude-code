"use client";
import { useActionState } from "react";
import { rescheduleAction, cancelAction, manualDepositAction } from "@/app/actions/studio";
import { Alert } from "@/components/ui";

export function BookingTools({ appointmentId, status, depositPence, canOverride, canCancel, canVerify }: { appointmentId: string; status: string; depositPence: number; canOverride: boolean; canCancel: boolean; canVerify: boolean }) {
  const [r, reschedule, p1] = useActionState(rescheduleAction, undefined);
  const [c, cancel, p2] = useActionState(cancelAction, undefined);
  const [m, verify, p3] = useActionState(manualDepositAction, undefined);
  const closed = ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(status);
  return (
    <div className="space-y-6">
      {canVerify && status === "PENDING_DEPOSIT" && (
        <form action={verify} className="card p-5 space-y-3 border-2 border-warn">
          <h2 className="text-xl font-bold">Verify a manual deposit</h2>
          <p className="text-sm opacity-80">Only record this once you have actually seen the money on the bank statement or in the till. This confirms the booking and posts to the ledger under your name.</p>
          {m?.error && <Alert tone="danger">{m.error}</Alert>}{m?.ok && <Alert tone="success">Deposit verified and booking confirmed.</Alert>}
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field" htmlFor="amountPounds">Amount (£)</label><input id="amountPounds" name="amountPounds" type="number" step="0.01" min={1} className="input" defaultValue={(depositPence / 100).toFixed(2)} required /></div>
            <div><label className="field" htmlFor="method">Method</label><select id="method" name="method" className="select"><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option></select></div>
            <div><label className="field" htmlFor="bankReference">Bank reference seen</label><input id="bankReference" name="bankReference" className="input" /></div>
            <div><label className="field" htmlFor="note">Verification note</label><input id="note" name="note" className="input" placeholder="e.g. Seen on Starling 21/10, 14:02" required /></div>
          </div>
          <button className="btn btn-primary" disabled={p3}>Record verified deposit</button>
        </form>
      )}
      {canOverride && !closed && (
        <form action={reschedule} className="card p-5 space-y-3">
          <h2 className="text-xl font-bold">Move this appointment</h2>
          {r?.error && <Alert tone="danger">{r.error}</Alert>}{r?.ok && <Alert tone="success">Moved. Client and artist notified.</Alert>}
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <div><label className="field" htmlFor="startsAtLocal">New start (Europe/London)</label><input id="startsAtLocal" name="startsAtLocal" type="datetime-local" className="input" required /></div>
          <div><label className="field" htmlFor="reason">Reason (required, visible in audit and notifications)</label><input id="reason" name="reason" className="input" required minLength={5} /></div>
          <button className="btn btn-primary" disabled={p1}>Move and notify</button>
        </form>
      )}
      {canCancel && !closed && (
        <form action={cancel} className="card p-5 space-y-3">
          <h2 className="text-xl font-bold">Cancel</h2>
          {c?.error && <Alert tone="danger">{c.error}</Alert>}{c?.ok && <Alert tone="success">Cancelled and client notified.</Alert>}
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <div><label className="field" htmlFor="creason">Reason</label><input id="creason" name="reason" className="input" required minLength={5} /></div>
          <div><label className="field" htmlFor="depositOutcome">Deposit outcome (per policy)</label><select id="depositOutcome" name="depositOutcome" className="select"><option value="pending_review">Pending review</option><option value="retained">Retained</option><option value="credited">Credited to a future booking</option><option value="refunded">Refund (requires Stripe refund in Phase 3)</option></select></div>
          <button className="btn btn-danger" disabled={p2}>Cancel appointment</button>
        </form>
      )}
    </div>
  );
}
