"use client";
/* eslint-disable @next/next/no-img-element -- images are served through short-lived signed URLs that next/image cannot optimise */
import { useActionState } from "react";
import { addPortfolioItemAction, portfolioItemAction } from "@/app/actions/portfolio";
import { Alert, Empty } from "./ui";

export type PortfolioRow = { id: string; url: string; caption: string | null; styleTags: string[]; placement: string | null; isHealed: boolean; isCover: boolean; published: boolean; hasPermission: boolean };

export function PortfolioManager({ artistId, items, ownerView }: { artistId: string; items: PortfolioRow[]; ownerView?: boolean }) {
  const [state, action, pending] = useActionState(addPortfolioItemAction, undefined);
  return (
    <div className="space-y-6">
      <form action={action} className="card p-4 space-y-3" encType="multipart/form-data">
        <h2 className="text-xl font-bold">Add a photo</h2>
        <input type="hidden" name="artistId" value={artistId} />
        {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">{state.message}</Alert>}
        <div><label className="field" htmlFor="pf-photo">Photo (JPEG, PNG, WebP or HEIC, under 15 MB)</label><input id="pf-photo" name="photo" type="file" accept="image/*" className="input" required /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="field" htmlFor="pf-caption">Caption</label><input id="pf-caption" name="caption" className="input" maxLength={200} placeholder="e.g. Black and grey portrait, upper thigh" /></div>
          <div><label className="field" htmlFor="pf-placement">Placement</label><input id="pf-placement" name="placement" className="input" maxLength={80} placeholder="e.g. upper thigh" /></div>
          <div className="sm:col-span-2"><label className="field" htmlFor="pf-tags">Style tags (comma separated)</label><input id="pf-tags" name="styleTags" className="input" maxLength={200} placeholder="black and grey realism, illustrative" /></div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="isHealed" /> Healed (not fresh)</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="isCover" /> Use as my cover image</label>
        </div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="permission" className="mt-1" /><span><strong>Permission to publish.</strong> The client has agreed to this photo being shown on the studio website (recorded on their consent form), or it is my own design with nobody&apos;s skin in it. Untick to keep the photo on file but off the public site.</span></label>
        <button className="btn btn-primary" disabled={pending}>{pending ? "Uploading…" : "Add to portfolio"}</button>
      </form>
      {items.length === 0 ? <Empty>No portfolio items yet.</Empty> : (
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((i) => (
            <li key={i.id} className="card overflow-hidden">
              <img src={i.url} alt={i.caption ?? ""} className="aspect-square object-cover w-full" />
              <div className="p-3 text-sm space-y-1">
                <p className="font-semibold">{i.caption || <span className="opacity-60">No caption</span>}</p>
                <p className="text-xs opacity-70">{[i.placement, i.isHealed ? "healed" : "fresh", ...i.styleTags].filter(Boolean).join(" · ")}</p>
                <p className="flex flex-wrap gap-1">{i.isCover && <span className="badge badge-acid">cover</span>}{i.published ? <span className="badge badge-acid">on public site</span> : <span className="badge badge-muted">{i.hasPermission ? "not published" : "no permission: hidden"}</span>}</p>
                <form action={portfolioItemAction} className="flex flex-wrap gap-2 pt-1">
                  <input type="hidden" name="itemId" value={i.id} /><input type="hidden" name="artistId" value={artistId} />
                  {!i.isCover && <button name="op" value="cover" className="underline text-xs">Set as cover</button>}
                  {i.published ? <button name="op" value="unpublish" className="underline text-xs">Hide from site</button> : i.hasPermission && <button name="op" value="publish" className="underline text-xs">Publish</button>}
                  <button name="op" value="remove" className="underline text-xs text-danger" onClick={(e) => { if (!confirm("Remove this photo from the portfolio?")) e.preventDefault(); }}>Remove</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      {ownerView && <p className="hint">Changes here are made on the artist&apos;s behalf and are written to the audit log.</p>}
    </div>
  );
}
