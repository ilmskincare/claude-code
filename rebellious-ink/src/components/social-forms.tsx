/* eslint-disable @next/next/no-img-element -- short-lived signed URLs */
"use client";
import { useActionState } from "react";
import { savePostAction, publishPostAction } from "@/app/actions/social";
import { Alert } from "./ui";

export function SocialPostForm({ assets, channels, connected }: { assets: { id: string; url: string; label: string }[]; channels: { id: string; name: string; service: string }[]; connected: boolean }) {
  const [state, action, pending] = useActionState(savePostAction, undefined);
  return (
    <form action={action} className="card p-5 space-y-3">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Draft saved.</Alert>}
      <div><label className="field" htmlFor="caption">Caption</label><textarea id="caption" name="caption" className="textarea" rows={5} required maxLength={2200} placeholder="Healed fine-line fern by Mo. Books open for November — link in bio." /></div>
      <div><span className="field">Image (only work with social media permission on record)</span>
        {assets.length === 0 ? <p className="hint">No permitted images yet. Permission is recorded per image when the client agrees.</p> : (
          <div className="flex flex-wrap gap-2">{assets.map((a) => <label key={a.id} className="cursor-pointer"><input type="radio" name="assetId" value={a.id} className="sr-only peer" /><img src={a.url} alt={a.label} className="size-24 object-cover rounded-lg border-2 border-transparent peer-checked:border-acid" /></label>)}<label className="cursor-pointer text-sm flex items-center"><input type="radio" name="assetId" value="" defaultChecked className="mr-1" />No image</label></div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><span className="field">Channels</span>{connected ? channels.map((c) => <label key={c.id} className="flex items-center gap-2"><input type="checkbox" name="channels" value={c.id} className="size-4" />{c.name} <span className="hint">({c.service})</span></label>) : <p className="hint">Buffer is not connected. Drafts can still be saved and exported.</p>}</div>
        <div><label className="field" htmlFor="scheduledFor">Schedule (optional)</label><input id="scheduledFor" name="scheduledFor" type="datetime-local" className="input" /><p className="hint">Leave blank to add to the channel queue.</p></div>
      </div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save draft"}</button>
    </form>
  );
}

export function PublishButton({ id, connected }: { id: string; connected: boolean }) {
  const [state, action, pending] = useActionState(publishPostAction, undefined);
  return (
    <form action={action} className="inline-flex flex-col gap-1">
      {state?.error && <span className="text-danger text-xs">{state.error}</span>}
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-primary !min-h-9 !py-1 text-sm" disabled={pending || !connected}>{pending ? "Sending…" : "Send to Buffer"}</button>
    </form>
  );
}
