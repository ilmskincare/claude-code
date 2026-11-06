"use client";

import { useActionState } from "react";
import { fulfilOrderAction, updateOrderNoteAction, type FormState } from "@/app/admin/actions";

export function FulfilForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(fulfilOrderAction, null);
  return (
    <form action={formAction} className="mt-2 space-y-3" noValidate>
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="trackingRef" className="field">Tracking reference (optional)</label>
        <input id="trackingRef" name="trackingRef" className="input" maxLength={80} placeholder="e.g. Royal Mail tracking number" aria-invalid={Boolean(state?.errors?.trackingRef)} />
        {state?.errors?.trackingRef && <p className="error mt-1">{state.errors.trackingRef}</p>}
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>{pending ? "Saving" : "Mark as fulfilled and email customer"}</button>
      {state?.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-ok" : "error"}>{state.message}</p>}
    </form>
  );
}

export function NoteForm({ orderId, adminNote, status }: { orderId: string; adminNote: string; status: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateOrderNoteAction, null);
  return (
    <form action={formAction} className="mt-2 space-y-3" noValidate>
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="adminNote" className="field">Note</label>
        <textarea id="adminNote" name="adminNote" className="textarea" rows={4} defaultValue={adminNote} maxLength={2000} placeholder="Why it was cancelled or refunded, what was agreed with the customer" />
      </div>
      <div>
        <label htmlFor="status" className="field">Status</label>
        <select id="status" name="status" className="select" defaultValue="">
          <option value="">Keep as {status.toLowerCase()}</option>
          <option value="CANCELLED">Mark cancelled</option>
          <option value="REFUNDED">Mark refunded</option>
        </select>
        <p className="hint mt-1 text-xs">Marking refunded does not move money. Issue the refund in Stripe first.</p>
      </div>
      <button type="submit" className="btn btn-secondary w-full" disabled={pending}>{pending ? "Saving" : "Save"}</button>
      {state?.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-ok" : "error"}>{state.message}</p>}
    </form>
  );
}
