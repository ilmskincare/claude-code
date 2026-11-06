"use client";
import { useActionState } from "react";
import { saveCampaignAction, sendTestAction, sendCampaignAction } from "@/app/actions/marketing";
import { Alert } from "./ui";

type C = { id?: string; name?: string; subject?: string | null; body?: string | null; audience?: { artistId?: string | null } };

export function CampaignForm({ campaign, artists }: { campaign?: C; artists: { id: string; displayName: string }[] }) {
  const [state, action, pending] = useActionState(saveCampaignAction, undefined);
  const c = campaign ?? {};
  return (
    <form action={action} className="card p-5 space-y-3">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Saved.</Alert>}
      {c.id && <input type="hidden" name="id" value={c.id} />}
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="field" htmlFor="name">Internal name</label><input id="name" name="name" className="input" defaultValue={c.name ?? ""} required /></div>
        <div><label className="field" htmlFor="artistId">Audience</label><select id="artistId" name="artistId" className="select" defaultValue={c.audience?.artistId ?? ""}><option value="">All opted-in clients</option>{artists.map((a) => <option key={a.id} value={a.id}>Clients of {a.displayName}</option>)}</select></div>
      </div>
      <div><label className="field" htmlFor="subject">Subject line</label><input id="subject" name="subject" className="input" defaultValue={c.subject ?? ""} required /></div>
      <div><label className="field" htmlFor="body">Email body</label><textarea id="body" name="body" className="textarea" rows={12} defaultValue={c.body ?? ""} required placeholder={"Hi {{name}},\n\nWe have a flash day on Saturday 8 November…"} /><p className="hint">Plain text; blank lines make paragraphs. Use {"{{name}}"} for the client&apos;s first name. An unsubscribe link is added automatically.</p></div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : c.id ? "Save changes" : "Create draft"}</button>
    </form>
  );
}

export function SendControls({ id, recipients, status }: { id: string; recipients: number; status: string }) {
  const [t, test, tp] = useActionState(sendTestAction, undefined);
  const [s, send, sp] = useActionState(sendCampaignAction, undefined);
  return (
    <div className="card p-5 space-y-4">
      <h2 className="text-xl font-bold">Send</h2>
      <p>Audience right now: <strong>{recipients}</strong> opted-in client{recipients === 1 ? "" : "s"}.</p>
      <form action={test} className="flex items-center gap-2">{t?.error && <Alert tone="danger">{t.error}</Alert>}{t?.ok && <Alert tone="success">Test sent to you.</Alert>}<input type="hidden" name="id" value={id} /><button className="btn btn-secondary" disabled={tp}>Send me a test</button></form>
      {status === "sent" ? <Alert tone="success">Sent.</Alert> : (
        <form action={send} className="space-y-2">{s?.error && <Alert tone="danger">{s.error}</Alert>}{s?.ok && <Alert tone="success">Sent.</Alert>}<input type="hidden" name="id" value={id} /><div><label className="field" htmlFor="confirm">Type SEND to send to {recipients} client{recipients === 1 ? "" : "s"}</label><input id="confirm" name="confirm" className="input max-w-xs" autoComplete="off" /></div><button className="btn btn-primary" disabled={sp || recipients === 0}>{sp ? "Sending…" : "Send campaign"}</button></form>
      )}
    </div>
  );
}
