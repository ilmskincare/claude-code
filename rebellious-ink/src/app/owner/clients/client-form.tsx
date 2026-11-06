"use client";
import { useActionState } from "react";
import { deskClientAction } from "@/app/actions/clients";
import { Alert } from "@/components/ui";

export function DeskClientForm({ consentScript }: { consentScript: string }) {
  const [state, action, pending] = useActionState(deskClientAction, undefined);
  return (
    <form action={action} className="card p-5 space-y-3">
      <h2 className="text-xl font-bold">Add or update a client</h2>
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Saved. Their marketing answer is recorded against your name.</Alert>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="field" htmlFor="name">Full name</label><input id="name" name="name" className="input" required /></div>
        <div><label className="field" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" required /></div>
        <div><label className="field" htmlFor="phone">Phone</label><input id="phone" name="phone" className="input" /></div>
        <div><label className="field" htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" className="input" /><p className="hint">Needed for tattooing: 18+, ID checked.</p></div>
        <div><label className="field" htmlFor="howFound">How they found us</label><input id="howFound" name="howFound" className="input" list="howFound-options" /><datalist id="howFound-options"><option value="Walk-in" /><option value="Instagram" /><option value="Facebook" /><option value="Word of mouth" /><option value="Google" /><option value="Gumball machine" /></datalist></div>
        <div><label className="field" htmlFor="accessNeeds">Access needs (optional, voluntary)</label><input id="accessNeeds" name="accessNeeds" className="input" /></div>
      </div>
      <fieldset className="card p-4 bg-surface-muted">
        <legend className="font-bold px-1">Marketing permission</legend>
        <p className="text-sm">Read this to the client, word for word:</p>
        <blockquote className="mt-1 border-l-4 border-acid pl-3 italic">{consentScript}</blockquote>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="marketing" value="yes" /> Yes, they agreed</label>
          <label className="flex items-center gap-2"><input type="radio" name="marketing" value="no" /> No</label>
          <label className="flex items-center gap-2"><input type="radio" name="marketing" value="not_asked" defaultChecked /> Not asked</label>
        </div>
        <div className="mt-2"><label className="field" htmlFor="consentNote">Note (optional, e.g. &ldquo;asked at the desk, 21 Oct&rdquo;)</label><input id="consentNote" name="consentNote" className="input" maxLength={200} /></div>
        <p className="hint mt-2">Recorded with your name, the date and this wording. The client can change it in their portal or with the unsubscribe link in any email. We never share or sell details with third parties.</p>
      </fieldset>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save client"}</button>
    </form>
  );
}
