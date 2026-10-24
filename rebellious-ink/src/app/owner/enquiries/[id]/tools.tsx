"use client";
import { useActionState } from "react";
import { assignArtistAction, approveQuoteAction } from "@/app/actions/studio";
import { Alert } from "@/components/ui";

export function OwnerEnquiryTools({ requestId, currentArtistId, artists, draftQuotes }: { requestId: string; currentArtistId: string | null; artists: { id: string; displayName: string; kind: string }[]; draftQuotes: { id: string; version: number; amountPence: number }[] }) {
  const [a, assign, p1] = useActionState(assignArtistAction, undefined);
  const [b, approve, p2] = useActionState(approveQuoteAction, undefined);
  return (
    <section className="card p-5 space-y-4">
      <h2 className="text-xl font-bold">Owner tools</h2>
      <form action={assign} className="space-y-2">
        {a?.error && <Alert tone="danger">{a.error}</Alert>}{a?.ok && <Alert tone="success">Artist assigned and logged.</Alert>}
        <input type="hidden" name="requestId" value={requestId} />
        <label className="field" htmlFor="artistId">Assign artist</label>
        <div className="flex gap-2 flex-wrap"><select id="artistId" name="artistId" className="select flex-1" defaultValue={currentArtistId ?? ""}><option value="" disabled>Choose…</option>{artists.map((x) => <option key={x.id} value={x.id}>{x.displayName}{x.kind === "APPRENTICE" ? " (apprentice)" : ""}</option>)}</select><input name="reason" className="input flex-1" placeholder="Reason (logged)" required /><button className="btn btn-primary" disabled={p1}>Assign</button></div>
      </form>
      {draftQuotes.map((q) => (
        <form key={q.id} action={approve} className="flex items-center gap-3 border-t border-graphite pt-3">
          {b?.error && <Alert tone="danger">{b.error}</Alert>}
          <input type="hidden" name="requestId" value={requestId} /><input type="hidden" name="quoteId" value={q.id} />
          <span>Draft quote v{q.version} awaits your approval.</span><button className="btn btn-primary" disabled={p2}>Approve and send</button>
        </form>
      ))}
    </section>
  );
}
