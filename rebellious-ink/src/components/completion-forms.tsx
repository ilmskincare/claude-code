"use client";
import { useActionState } from "react";
import { completeAppointmentAction, redeemCreditAction } from "@/app/actions/loyalty";
import { Alert } from "@/components/ui";

const COMPLETABLE = ["CONFIRMED", "CHECKED_IN", "IN_SESSION"];

/** Artist or desk closes the appointment with the final price. Loyalty earn and referral rewards follow from this. */
export function CompleteAppointmentForm({ appointmentId, status, suggestedPence }: { appointmentId: string; status: string; suggestedPence: number }) {
  const [s, act, pending] = useActionState(completeAppointmentAction, undefined);
  if (!COMPLETABLE.includes(status)) return s?.ok ? <Alert tone="success">{s.error ?? "Completed."}</Alert> : null;
  return (
    <form action={act} className="card p-5 space-y-3">
      <h2 className="text-xl font-bold">Mark completed</h2>
      <p className="text-sm opacity-80">Enter the final price actually charged (before any studio credit). This closes the booking, awards the client their loyalty credit and pays out any pending referral.</p>
      {s?.error && <Alert tone={s.ok ? "success" : "danger"}>{s.error}</Alert>}{s?.ok && !s.error && <Alert tone="success">Completed.</Alert>}
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <div><label className="field" htmlFor="finalPricePounds">Final price (£)</label><input id="finalPricePounds" name="finalPricePounds" type="number" step="0.01" min={0} className="input" defaultValue={(suggestedPence / 100).toFixed(2)} required /></div>
      <button className="btn btn-primary" disabled={pending}>Mark completed</button>
    </form>
  );
}

/** Desk applies studio credit from the client's loyalty balance to this booking. */
export function ApplyCreditForm({ appointmentId, balancePence, minRedeemPence, appliedPence, closed }: { appointmentId: string; balancePence: number; minRedeemPence: number; appliedPence: number; closed: boolean }) {
  const [s, act, pending] = useActionState(redeemCreditAction, undefined);
  return (
    <form action={act} className="card p-5 space-y-3">
      <h2 className="text-xl font-bold">Apply studio credit</h2>
      <p className="text-sm opacity-80">Client balance: <strong>£{(balancePence / 100).toFixed(2)}</strong>{appliedPence > 0 && <> · already applied to this booking: <strong>£{(appliedPence / 100).toFixed(2)}</strong></>}. Minimum redemption £{(minRedeemPence / 100).toFixed(2)}. Take the credited amount off what the client pays on the day.</p>
      {s?.error && <Alert tone="danger">{s.error}</Alert>}{s?.ok && <Alert tone="success">Credit applied.</Alert>}
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <div><label className="field" htmlFor="amountPounds">Amount to apply (£)</label><input id="amountPounds" name="amountPounds" type="number" step="0.01" min={minRedeemPence / 100} max={balancePence / 100} className="input" required disabled={closed || balancePence < minRedeemPence} /></div>
      <button className="btn btn-secondary" disabled={pending || closed || balancePence < minRedeemPence}>Apply credit</button>
    </form>
  );
}
