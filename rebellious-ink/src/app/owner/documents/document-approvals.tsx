"use client";
import { useActionState } from "react";
import Link from "next/link";
import { approveDocumentAction, withdrawDocumentApprovalAction } from "@/app/actions/documents";

export type DocRow = { id: string; templateKey: string; version: number; kind: string; title: string; procedureType: string | null; approvedAt: Date | null; approverName: string | null; reviewDate: Date; toConfirm: number };

function ApproveForm({ d, defaultName }: { d: DocRow; defaultName: string }) {
  const [state, action, pending] = useActionState(approveDocumentAction, undefined);
  return (
    <form action={action} className="flex flex-wrap gap-1 items-end">
      <input type="hidden" name="id" value={d.id} /><input type="hidden" name="templateKey" value={d.templateKey} />
      <div><label className="sr-only" htmlFor={`ap-${d.id}`}>Approved by</label><input id={`ap-${d.id}`} name="approverName" className="input text-sm" defaultValue={defaultName} placeholder="Approved by" required /></div>
      <button className="btn btn-primary text-sm" disabled={pending} onClick={(e) => { if (d.toConfirm > 0 && !confirm(`This document still has ${d.toConfirm} "Practitioner to confirm" note(s) in the text. Approve it anyway?`)) e.preventDefault(); }}>{pending ? "…" : "Approve"}</button>
      {state?.error && <span className="block w-full text-xs text-danger" role="alert">{state.error}</span>}{state?.ok && <span className="block w-full text-xs text-acid-bright">{state.message}</span>}
    </form>
  );
}

function WithdrawForm({ d }: { d: DocRow }) {
  const [state, action, pending] = useActionState(withdrawDocumentApprovalAction, undefined);
  return (
    <form action={action} className="text-sm">
      <input type="hidden" name="id" value={d.id} /><input type="hidden" name="templateKey" value={d.templateKey} /><input type="hidden" name="reason" value="Withdrawn from the owner documents page" />
      <span className="badge badge-acid">Approved</span> <span className="text-xs opacity-70">by {d.approverName} on {new Date(d.approvedAt!).toLocaleDateString("en-GB")}</span>
      <button className="underline text-xs ml-2" disabled={pending} onClick={(e) => { if (!confirm(`Withdraw approval of "${d.title}"? It goes back to a draft and shows the draft banner.`)) e.preventDefault(); }}>Withdraw</button>
      {state?.error && <span className="block text-xs text-danger" role="alert">{state.error}</span>}{state?.ok && <span className="block text-xs text-acid-bright">{state.message}</span>}
    </form>
  );
}

const KIND_LABEL: Record<string, string> = { PREPARATION_GUIDE: "Preparation guides", AFTERCARE_GUIDE: "Aftercare guides", INFORMATION: "Information and policies", CONSENT_FORM: "Consent forms" };

export function DocumentApprovals({ rows, defaultName }: { rows: DocRow[]; defaultName: string }) {
  const kinds = Array.from(new Set(rows.map((r) => r.kind)));
  return (
    <div className="space-y-8">
      {kinds.map((kind) => (
        <section key={kind} className="card p-4">
          <h2 className="text-xl font-bold mb-3">{KIND_LABEL[kind] ?? kind}</h2>
          <div className="overflow-x-auto"><table className="data"><thead><tr><th>Document</th><th>To confirm</th><th>Review due</th><th>Sign-off</th></tr></thead><tbody>
            {rows.filter((r) => r.kind === kind).map((d) => (
              <tr key={d.id}>
                <td><strong>{d.title}</strong><span className="block text-xs opacity-60">v{d.version} · {d.procedureType}</span><span className="block text-xs"><Link href={`/guides/${d.templateKey}`} className="underline" target="_blank">Read</Link> · <a href={`/guides/${d.templateKey}/pdf`} className="underline">PDF</a></span></td>
                <td className="text-sm">{d.toConfirm > 0 ? <span className="badge badge-warn">{d.toConfirm} note{d.toConfirm === 1 ? "" : "s"}</span> : <span className="opacity-60">none</span>}</td>
                <td className="text-sm">{new Date(d.reviewDate).toLocaleDateString("en-GB")}</td>
                <td>{d.approvedAt ? <WithdrawForm d={d} /> : <ApproveForm d={d} defaultName={defaultName} />}</td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      ))}
    </div>
  );
}
