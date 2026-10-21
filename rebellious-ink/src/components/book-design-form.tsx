"use client";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { bookDesignAction } from "@/app/actions/flash";
import { Alert } from "./ui";
import { SizeGuide } from "./size-guide";

type Prices = { small: number; palm: number; apprenticeSmall: number | null; apprenticePalm: number | null };
type Props = { designId: string; title: string; artistName: string; palmEnabled: boolean; prices: Prices; deposits: { small: number; palm: number; apprentice: number }; sizes: { smallMaxCm: number; palmMaxCm: number }; apprentices: { id: string; displayName: string }[]; fixedPlacements: string[]; quotePlacements: string[]; signedIn: boolean; isOneOff: boolean; unavailable: boolean };

const gbp = (p: number) => `£${(p / 100).toFixed(2)}`;

export function BookDesignForm(props: Props) {
  const [state, action, pending] = useActionState(bookDesignAction, undefined);
  const [size, setSize] = useState<"small" | "palm">("small");
  const [tier, setTier] = useState<"artist" | "apprentice">("artist");
  const [placement, setPlacement] = useState(props.fixedPlacements[0] ?? "");
  const total = useMemo(() => (tier === "apprentice" ? (size === "small" ? props.prices.apprenticeSmall : props.prices.apprenticePalm) : size === "small" ? props.prices.small : props.prices.palm), [size, tier, props.prices]);
  const deposit = total == null ? null : Math.min(total, tier === "apprentice" ? props.deposits.apprentice : size === "small" ? props.deposits.small : props.deposits.palm);
  const canApprentice = props.apprentices.length > 0 && props.prices.apprenticeSmall != null;
  if (props.unavailable) return <Alert tone="warn">This one-off design has been booked. Browse the rest of the catalogue.</Alert>;
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      <input type="hidden" name="designId" value={props.designId} />
      <fieldset><legend className="field">Size</legend>
        <div className={`grid ${props.palmEnabled ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
          {(props.palmEnabled ? (["small", "palm"] as const) : (["small"] as const)).map((s) => <label key={s} className={`card p-3 cursor-pointer ${size === s ? "border-acid border-2" : ""}`}><input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} className="mr-2" />{s === "small" ? `${props.palmEnabled ? "Small, " : ""}up to ${props.sizes.smallMaxCm} cm` : `Palm, up to ${props.sizes.palmMaxCm} cm`}<span className="block text-sm opacity-80">{gbp(tier === "apprentice" ? (s === "small" ? props.prices.apprenticeSmall ?? 0 : props.prices.apprenticePalm ?? 0) : s === "small" ? props.prices.small : props.prices.palm)}</span></label>)}
        </div>
      </fieldset>
      <SizeGuide smallCm={props.sizes.smallMaxCm} palmCm={props.palmEnabled ? props.sizes.palmMaxCm : null} chosen={size} />
      <fieldset><legend className="field">Who tattoos it</legend>
        <div className="grid gap-2">
          <label className={`card p-3 cursor-pointer ${tier === "artist" ? "border-acid border-2" : ""}`}><input type="radio" name="tier" value="artist" checked={tier === "artist"} onChange={() => setTier("artist")} className="mr-2" />{props.artistName}</label>
          {canApprentice && <label className={`card p-3 cursor-pointer ${tier === "apprentice" ? "border-acid border-2" : ""}`}><input type="radio" name="tier" value="apprentice" checked={tier === "apprentice"} onChange={() => setTier("apprentice")} className="mr-2" />Apprentice, supervised by {props.artistName}<span className="block text-sm opacity-80">Lower price, same hygiene standards, same aftercare and free touch-up. Only bookable while {props.artistName.split(" ")[0]} is in the studio.</span></label>}
        </div>
        {tier === "apprentice" && props.apprentices.length > 1 && <div className="mt-2"><label className="field" htmlFor="apprenticeId">Which apprentice</label><select id="apprenticeId" name="apprenticeId" className="select">{props.apprentices.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}</select></div>}
        {tier === "apprentice" && props.apprentices.length === 1 && <input type="hidden" name="apprenticeId" value={props.apprentices[0].id} />}
      </fieldset>
      <div><label className="field" htmlFor="placement">Placement</label>
        <select id="placement" name="placement" className="select" value={placement} onChange={(e) => setPlacement(e.target.value)}>
          {props.fixedPlacements.map((x) => <option key={x} value={x}>{x}</option>)}
          <optgroup label="Quoted individually">{props.quotePlacements.map((x) => <option key={x} value={x}>{x}</option>)}</optgroup>
        </select>
      </div>
      {props.quotePlacements.includes(placement) ? (
        <div className="card p-4 bg-surface-muted"><p className="font-semibold">{placement} is quoted individually.</p><p className="text-sm opacity-80 mt-1">Those areas need the artist to look first. Send an enquiry with this design and you will get a quote in your private thread.</p><Link href={`/enquire?design=${props.designId}`} className="btn btn-primary mt-3">Request a quote</Link></div>
      ) : (
        <>
          <div className="card p-4 border-2 border-acid">
            <p className="hint">Total price, nothing added later</p>
            <p className="text-3xl font-bold">{total != null ? gbp(total) : "—"}</p>
            <p className="text-sm">{deposit != null ? `${gbp(deposit)} deposit online today, ${gbp((total ?? 0) - deposit)} on the day.` : ""} {props.isOneOff ? "One-off design: held for you while you pay." : ""}</p>
          </div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="declaredOver18" required className="mt-1" /> I confirm I am 18 or over and will bring photographic ID.</label>
          <button className="btn btn-primary w-full justify-center" disabled={pending || total == null}>{pending ? "Setting up your booking…" : props.signedIn ? "Book this: choose a time" : "Sign in to book this"}</button>
        </>
      )}
    </form>
  );
}
