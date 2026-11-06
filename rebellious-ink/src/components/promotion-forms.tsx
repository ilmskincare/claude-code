"use client";
import { useActionState } from "react";
import { savePromotionAction, endPromotionAction } from "@/app/actions/promotions";
import { Alert } from "./ui";

type Artist = { id: string; displayName: string };
type Promo = { id?: string; scope?: "STUDIO" | "ARTIST"; artistId?: string | null; title?: string; details?: string | null; code?: string | null; startsAt?: string; endsAt?: string | null; showOnPublic?: boolean };

/** Owner: studio-wide or any artist. Artist: their own only (artists list is empty and scope is fixed). */
export function PromotionForm({ artists, fixedArtistId, promo }: { artists: Artist[]; fixedArtistId?: string; promo?: Promo }) {
  const [state, action, pending] = useActionState(savePromotionAction, undefined);
  const v = promo ?? {};
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="card p-5 space-y-3">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Promotion saved. It shows as soon as its start date arrives.</Alert>}
      {v.id && <input type="hidden" name="id" value={v.id} />}
      {fixedArtistId ? <><input type="hidden" name="scope" value="ARTIST" /><input type="hidden" name="artistId" value={fixedArtistId} /></> : (
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="field" htmlFor="scope">Who is it for</label><select id="scope" name="scope" className="select" defaultValue={v.scope ?? "STUDIO"}><option value="STUDIO">Whole studio (banner on every public page)</option><option value="ARTIST">One artist (ribbon on their card and page)</option></select></div>
          <div><label className="field" htmlFor="artistId">Artist (for artist promotions)</label><select id="artistId" name="artistId" className="select" defaultValue={v.artistId ?? ""}><option value="">—</option>{artists.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}</select></div>
        </div>
      )}
      <div><label className="field" htmlFor="title">Ribbon text (short, max 40 characters)</label><input id="title" name="title" className="input" maxLength={40} defaultValue={v.title ?? ""} placeholder="e.g. 20% off flash this month" required /></div>
      <div><label className="field" htmlFor="details">Details and terms (public)</label><textarea id="details" name="details" className="input min-h-20" maxLength={600} defaultValue={v.details ?? ""} placeholder="What the offer is, what it excludes, how to claim it." /></div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div><label className="field" htmlFor="code">Code to quote (optional)</label><input id="code" name="code" className="input uppercase" maxLength={20} defaultValue={v.code ?? ""} /></div>
        <div><label className="field" htmlFor="startsAt">Starts</label><input id="startsAt" name="startsAt" type="date" className="input" defaultValue={v.startsAt ?? today} required /></div>
        <div><label className="field" htmlFor="endsAt">Ends (optional)</label><input id="endsAt" name="endsAt" type="date" className="input" defaultValue={v.endsAt ?? ""} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="showOnPublic" defaultChecked={v.showOnPublic ?? true} /> Show on the public website (untick for a desk-only offer)</label>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : v.id ? "Save changes" : "Create promotion"}</button>
    </form>
  );
}

export function EndPromotionButton({ id }: { id: string }) {
  return <form action={endPromotionAction}><input type="hidden" name="id" value={id} /><button className="underline text-sm text-danger">End now</button></form>;
}
