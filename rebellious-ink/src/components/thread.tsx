/* eslint-disable @next/next/no-img-element -- attachments are short-lived signed URLs */
"use client";
import { useActionState, useRef } from "react";
import { sendMessage } from "@/app/actions/enquiry";
import { Alert } from "./ui";

export type ThreadAttachment = { id: string; url: string; name: string; mimeType: string };
type Msg = { id: string; body: string; visibility: string; createdAt: string; sender: { id: string; name: string | null }; attachments?: ThreadAttachment[] };

export function Thread({ requestId, messages, meId, canInternal }: { requestId: string; messages: Msg[]; meId: string; canInternal: boolean }) {
  const [state, action, pending] = useActionState(sendMessage, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <section className="card p-5">
      <h2 className="text-xl font-bold mb-3">Messages</h2>
      <ol className="space-y-3 max-h-[28rem] overflow-y-auto pr-1" aria-live="polite">
        {messages.length === 0 && <li className="opacity-60">No messages yet.</li>}
        {messages.map((m) => (
          <li key={m.id} className={`max-w-[85%] rounded-xl px-4 py-3 ${m.sender.id === meId ? "ml-auto bg-acid-soft text-ink" : "bg-surface-muted text-ink"} ${m.visibility === "INTERNAL_ONLY" ? "border-2 border-dashed border-warn" : ""}`}>
            <p className="text-xs opacity-70 mb-1">{m.sender.name ?? "Studio"} · {new Date(m.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "short", timeStyle: "short" })}{m.visibility === "INTERNAL_ONLY" && " · internal note"}</p>
            <p className="whitespace-pre-wrap">{m.body}</p>
            {m.attachments && m.attachments.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {m.attachments.map((a) => (
                  <li key={a.id}>
                    <a href={a.url} target="_blank" rel="noreferrer" className="block">
                      {a.mimeType.startsWith("image/") ? <img src={a.url} alt={a.name} className="size-28 object-cover rounded-lg border border-border" /> : <span className="badge badge-outline">{a.name}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <form ref={formRef} action={async (fd) => { await action(fd); formRef.current?.reset(); }} className="mt-4 space-y-2" encType="multipart/form-data">
        {state?.error && <Alert tone="danger">{state.error}</Alert>}
        <input type="hidden" name="requestId" value={requestId} />
        <label className="field" htmlFor="body">Reply</label>
        <textarea id="body" name="body" className="textarea" rows={3} maxLength={5000} />
        <div>
          <label className="field text-sm" htmlFor="attachments">Attach images (up to 6, JPEG/PNG/WEBP/HEIC or PDF)</label>
          <input id="attachments" name="attachments" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" className="input" capture="environment" />
          <p className="hint">Private to this consultation. Links expire; nothing here is ever published.</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          {canInternal ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="internal" className="size-4" />Internal note (hidden from client)</label> : <span />}
          <button className="btn btn-primary" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
        </div>
      </form>
    </section>
  );
}
