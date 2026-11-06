"use client";
import { useActionState } from "react";
import { saveRateCardAction, addPriceItemAction, removePriceItemAction } from "@/app/actions/profile";
import { Alert } from "./ui";

type Profile = { id: string; displayName: string; bio: string | null; instagramHandle: string | null; kind: string; styles: string[]; stylesNotOffered: string[]; hourlyRateMinPence: number | null; hourlyRateMaxPence: number | null; dayRatePence: number | null; minimumChargePence: number | null; wontDo: string | null; placementsDeclined: string[]; piercingsOffered: string[]; piercingsNotOffered: string[]; receptionNotes: string | null; acceptsEnquiries: boolean };
type Item = { id: string; name: string; category: string; pricePence: number; priceToPence: number | null; durationMinutes: number | null; includesJewellery: boolean; notes: string | null };
const gbp = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(p / 100);
const pounds = (p: number | null) => (p == null ? "" : (p / 100).toFixed(2));

export function RateCardForm({ profile, canToggleBooks }: { profile: Profile; canToggleBooks: boolean }) {
  const [state, action, pending] = useActionState(saveRateCardAction, undefined);
  const piercer = profile.kind === "PIERCER";
  return (
    <form action={action} className="card p-5 space-y-4">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Saved. The desk and your public profile are updated.</Alert>}
      <input type="hidden" name="artistId" value={profile.id} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><label className="field" htmlFor="avatar">Logo or portrait (shown on your public page and card)</label><input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="input" /></div>
        <div><label className="field" htmlFor="displayName">Display name</label><input id="displayName" name="displayName" className="input" defaultValue={profile.displayName} required /></div>
        <div><label className="field" htmlFor="instagramHandle">Instagram</label><input id="instagramHandle" name="instagramHandle" className="input" defaultValue={profile.instagramHandle ?? ""} placeholder="handle without @" /></div>
      </div>
      <div><label className="field" htmlFor="bio">Public bio</label><textarea id="bio" name="bio" className="textarea" rows={3} defaultValue={profile.bio ?? ""} /></div>
      <h3 className="font-bold text-lg pt-2">Rates</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><label className="field" htmlFor="hourlyRateMin">Hourly from (£)</label><input id="hourlyRateMin" name="hourlyRateMin" type="number" step="1" min={0} className="input" defaultValue={pounds(profile.hourlyRateMinPence)} /></div>
        <div><label className="field" htmlFor="hourlyRateMax">Hourly to (£)</label><input id="hourlyRateMax" name="hourlyRateMax" type="number" step="1" min={0} className="input" defaultValue={pounds(profile.hourlyRateMaxPence)} /></div>
        <div><label className="field" htmlFor="dayRate">Day rate (£)</label><input id="dayRate" name="dayRate" type="number" step="1" min={0} className="input" defaultValue={pounds(profile.dayRatePence)} /></div>
        <div><label className="field" htmlFor="minimumCharge">Minimum charge (£)</label><input id="minimumCharge" name="minimumCharge" type="number" step="1" min={0} className="input" defaultValue={pounds(profile.minimumChargePence)} /></div>
      </div>
      <p className="hint">Shown to the desk and, as &ldquo;from&rdquo; figures, on your public profile. Quotes are still set per job.</p>
      <h3 className="font-bold text-lg pt-2">{piercer ? "Piercings" : "Styles"}</h3>
      {piercer ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="field" htmlFor="piercingsOffered">Piercings offered (one per line)</label><textarea id="piercingsOffered" name="piercingsOffered" className="textarea" rows={5} defaultValue={profile.piercingsOffered.join("\n")} placeholder="Lobe&#10;Helix&#10;Septum&#10;Nostril" /></div>
          <div><label className="field" htmlFor="piercingsNotOffered">Not offered (one per line)</label><textarea id="piercingsNotOffered" name="piercingsNotOffered" className="textarea" rows={5} defaultValue={profile.piercingsNotOffered.join("\n")} placeholder="Surface&#10;Dermal&#10;Genital" /></div>
          <input type="hidden" name="styles" value={profile.styles.join("\n")} /><input type="hidden" name="stylesNotOffered" value={profile.stylesNotOffered.join("\n")} />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="field" htmlFor="styles">Styles I do (one per line)</label><textarea id="styles" name="styles" className="textarea" rows={5} defaultValue={profile.styles.join("\n")} /></div>
          <div><label className="field" htmlFor="stylesNotOffered">Styles I don&apos;t do (one per line)</label><textarea id="stylesNotOffered" name="stylesNotOffered" className="textarea" rows={5} defaultValue={profile.stylesNotOffered.join("\n")} placeholder="Portrait realism&#10;Watercolour" /></div>
          <input type="hidden" name="piercingsOffered" value={profile.piercingsOffered.join("\n")} /><input type="hidden" name="piercingsNotOffered" value={profile.piercingsNotOffered.join("\n")} />
        </div>
      )}
      <h3 className="font-bold text-lg pt-2">Boundaries</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="field" htmlFor="wontDo">Things I won&apos;t do (public)</label><textarea id="wontDo" name="wontDo" className="textarea" rows={4} defaultValue={profile.wontDo ?? ""} placeholder="e.g. No hate symbols, no names of partners, no copies of another artist's work" /></div>
        <div><label className="field" htmlFor="placementsDeclined">Placements I don&apos;t tattoo (one per line)</label><textarea id="placementsDeclined" name="placementsDeclined" className="textarea" rows={4} defaultValue={profile.placementsDeclined.join("\n")} placeholder="Face&#10;Hands&#10;Neck" /></div>
      </div>
      <div><label className="field" htmlFor="receptionNotes">Notes for the desk (private, never public)</label><textarea id="receptionNotes" name="receptionNotes" className="textarea" rows={3} defaultValue={profile.receptionNotes ?? ""} placeholder="e.g. Happy to do walk-ins on Saturdays if quiet; prefers consults before large pieces; no bookings before 11am" /></div>
      {canToggleBooks && <label className="flex items-center gap-2"><input type="hidden" name="acceptsEnquiriesPresent" value="1" /><input type="checkbox" name="acceptsEnquiries" defaultChecked={profile.acceptsEnquiries} className="size-5" />Books open (accepting new enquiries)</label>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

export function PriceList({ artistId, items, piercer }: { artistId: string; items: Item[]; piercer: boolean }) {
  const [state, action, pending] = useActionState(addPriceItemAction, undefined);
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-xl font-bold">{piercer ? "Piercing price list" : "Price list"}</h2>
      <p className="hint">{piercer ? "Shown publicly. Say whether basic jewellery is included; upgrades are sold from stock." : "Set prices for flash, consultations or standard pieces. Shown publicly."}</p>
      {items.length === 0 ? <p className="opacity-60">Nothing listed yet.</p> : <table className="data"><thead><tr><th>Item</th><th>Price</th><th>Time</th><th></th></tr></thead><tbody>{items.map((i) => <tr key={i.id}><td>{i.name}<span className="hint block">{i.category}{i.includesJewellery ? " · jewellery included" : ""}{i.notes ? ` · ${i.notes}` : ""}</span></td><td>{gbp(i.pricePence)}{i.priceToPence ? `–${gbp(i.priceToPence)}` : ""}</td><td>{i.durationMinutes ? `${i.durationMinutes} min` : ""}</td><td><form action={removePriceItemAction}><input type="hidden" name="itemId" value={i.id} /><input type="hidden" name="artistId" value={artistId} /><button className="underline text-sm">remove</button></form></td></tr>)}</tbody></table>}
      <form action={action} className="space-y-2 border-t border-graphite pt-3">
        {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Added.</Alert>}
        <input type="hidden" name="artistId" value={artistId} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="col-span-2"><label className="field" htmlFor="pname">Name</label><input id="pname" name="name" className="input" required placeholder={piercer ? "Helix" : "Palm-sized flash"} /></div>
          <div><label className="field" htmlFor="pcat">Category</label><select id="pcat" name="category" className="select" defaultValue={piercer ? "piercing" : "tattoo"}><option value="piercing">Piercing</option><option value="tattoo">Tattoo</option><option value="consultation">Consultation</option><option value="other">Other</option></select></div>
          <div><label className="field" htmlFor="pprice">Price (£)</label><input id="pprice" name="pricePounds" type="number" step="0.01" min={0} className="input" required /></div>
          <div><label className="field" htmlFor="pto">To (£, optional)</label><input id="pto" name="priceToPounds" type="number" step="0.01" min={0} className="input" /></div>
          <div><label className="field" htmlFor="pdur">Minutes</label><input id="pdur" name="durationMinutes" type="number" min={5} className="input" /></div>
          <div className="col-span-2"><label className="field" htmlFor="pnotes">Notes</label><input id="pnotes" name="notes" className="input" /></div>
        </div>
        {piercer && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="includesJewellery" className="size-4" />Basic titanium jewellery included</label>}
        <button className="btn btn-secondary" disabled={pending}>Add item</button>
      </form>
    </section>
  );
}
