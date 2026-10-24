"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { bookDesignAction } from "@/app/actions/flash";
import { Alert } from "./ui";
import { SizeGuide } from "./size-guide";

type Prices = { small: number; palm: number; apprenticeSmall: number | null; apprenticePalm: number | null };
type Props = { designId: string; title: string; artistName: string; prices: Prices; deposits: { small: number; apprentice: number }; sizeOptionsCm: number[]; apprentices: { id: string; displayName: string }[]; fixedPlacements: string[]; signedIn: boolean; isOneOff: boolean; unavailable: boolean };

const gbp = (p: number) => `£${(p / 100).toFixed(2)}`;
const ELSEWHERE = "__custom__";

/** Flash is one fixed price for small sizes on flat, easy areas. Anything else goes to the desk for a custom price. */
export function BookDesignForm(props: Props) {
  const [state, action, pending] = useActionState(bookDesignAction, undefined);
  const [tier, setTier] = useState<"artist" | "apprentice">("artist");
  const [sizeCm, setSizeCm] = useState(props.sizeOptionsCm[Math.min(1, props.sizeOptionsCm.length - 1)] ?? props.sizeOptionsCm[0]);
  const [placement, setPlacement] = useState(props.fixedPlacements[0] ?? "");
  const total = tier === "apprentice" ? props.prices.apprenticeSmall : props.prices.small;
  const deposit = total == null ? null : Math.min(total, tier === "apprentice" ? props.deposits.apprentice : props.deposits.small);
  const canApprentice = props.apprentices.length > 0 && props.prices.apprenticeSmall != null;
  const maxCm = props.sizeOptionsCm[props.sizeOptionsCm.length - 1];
  if (props.unavailable) return <Alert tone="warn">This one-off design has been booked. Browse the rest of the catalogue.</Alert>;
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      <input type="hidden" name="designId" value={props.designId} />
      <input type="hidden" name="size" value="small" />
      <fieldset><legend className="field">Size (longest edge, same price)</legend>
        <div className="flex flex-wrap gap-2">
          {props.sizeOptionsCm.map((cm) => <label key={cm} className={`card px-3 py-2 cursor-pointer ${sizeCm === cm ? "border-acid border-2" : ""}`}><input type="radio" name="sizeCm" value={cm} checked={sizeCm === cm} onChange={() => setSizeCm(cm)} className="mr-2" />{cm} cm</label>)}
        </div>
        <p className="hint mt-1">Up to {maxCm} cm at the flash price. Want it bigger? <Link href={`/enquire?design=${props.designId}`} className="underline">Ask the desk for a custom price</Link>.</p>
      </fieldset>
      <SizeGuide smallCm={sizeCm} palmCm={null} chosen="small" />
      <fieldset><legend className="field">Who tattoos it</legend>
        <div className="grid gap-2">
          <label className={`card p-3 cursor-pointer ${tier === "artist" ? "border-acid border-2" : ""}`}><input type="radio" name="tier" value="artist" checked={tier === "artist"} onChange={() => setTier("artist")} className="mr-2" />{props.artistName}<span className="block text-sm opacity-80">{gbp(props.prices.small)}</span></label>
          {canApprentice && <label className={`card p-3 cursor-pointer ${tier === "apprentice" ? "border-acid border-2" : ""}`}><input type="radio" name="tier" value="apprentice" checked={tier === "apprentice"} onChange={() => setTier("apprentice")} className="mr-2" />Apprentice, supervised by {props.artistName}<span className="block text-sm opacity-80">{gbp(props.prices.apprenticeSmall ?? 0)} · lower price, same hygiene standards, same aftercare and free touch-up. Only bookable while {props.artistName.split(" ")[0]} is in the studio.</span></label>}
        </div>
        {tier === "apprentice" && props.apprentices.length > 1 && <div className="mt-2"><label className="field" htmlFor="apprenticeId">Which apprentice</label><select id="apprenticeId" name="apprenticeId" className="select">{props.apprentices.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}</select></div>}
        {tier === "apprentice" && props.apprentices.length === 1 && <input type="hidden" name="apprenticeId" value={props.apprentices[0].id} />}
      </fieldset>
      <div><label className="field" htmlFor="placement">Placement (flat, easy areas only at the flash price)</label>
        <select id="placement" name="placement" className="select" value={placement} onChange={(e) => setPlacement(e.target.value)}>
          {props.fixedPlacements.map((x) => <option key={x} value={x}>{x}</option>)}
          <option value={ELSEWHERE}>Somewhere else (custom price)</option>
        </select>
      </div>
      {placement === ELSEWHERE ? (
        <div className="card p-4 bg-surface-muted"><p className="font-semibold">Somewhere else, or a different size? That is a custom price.</p><p className="text-sm opacity-80 mt-1">Flash prices only cover flat, easy areas at the sizes above. Send the desk a message with this design and where you would like it, and you will get a price in your private thread.</p><Link href={`/enquire?design=${props.designId}`} className="btn btn-primary mt-3">Ask the desk for a custom price</Link></div>
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
