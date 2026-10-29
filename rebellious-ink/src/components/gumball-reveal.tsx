"use client";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { bookPlayAction } from "@/app/actions/gumball";
import { Alert } from "./ui";
import { DesignImage } from "./design-image";

type Phase = "drop" | "pop" | "shown";
const gbp = (p: number) => `£${(p / 100).toFixed(0)}`;

/** Animates the capsule for the design the server chose. Reduced motion skips straight to the result. */
export function GumballReveal({ playId, title, artistName, artistSlug, imageUrl, hotspot, pricePence, depositPence, maxCm, placements, signedIn, alreadyBooked, shareUrl }: { playId: string; title: string; artistName: string; artistSlug: string; imageUrl: string; hotspot: { x: number | null; y: number | null; w: number | null; h: number | null }; pricePence: number; depositPence: number; maxCm: number; placements: string[]; signedIn: boolean; alreadyBooked: boolean; shareUrl: string }) {
  const [phase, setPhase] = useState<Phase>("drop");
  const [state, action, pending] = useActionState(bookPlayAction, undefined);
  useEffect(() => {
    // Reduced motion (or an already-booked play) skips straight to the result; timers keep state updates asynchronous.
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const skip = reduced || alreadyBooked;
    const t1 = setTimeout(() => setPhase(skip ? "shown" : "pop"), skip ? 0 : 900);
    const t2 = setTimeout(() => setPhase("shown"), skip ? 0 : 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [alreadyBooked]);
  return (
    <div className="grid md:grid-cols-[1fr_380px] gap-8">
      <div className="text-center">
        <div className="relative mx-auto w-full max-w-sm aspect-square">
          {phase !== "shown" && (
            <div className={`absolute inset-0 grid place-items-center ${phase === "drop" ? "capsule-drop" : "capsule-pop"}`} aria-hidden>
              <svg viewBox="0 0 200 200" className="w-48 h-48"><circle cx="100" cy="100" r="90" fill="#e0202a" /><path d="M10 100 A90 90 0 0 1 190 100 Z" fill="#e9ecdc" /><circle cx="100" cy="100" r="90" fill="none" stroke="#070807" strokeWidth="6" /><ellipse cx="70" cy="60" rx="18" ry="8" fill="#fff" opacity=".5" transform="rotate(-30 70 60)" /></svg>
            </div>
          )}
          {phase === "shown" && <div className="reveal-in absolute inset-0"><DesignImage src={imageUrl} alt={`${title} by ${artistName}`} hotspot={hotspot} className="w-full h-full rounded-2xl border-4 border-acid" /></div>}
        </div>
        <p role="status" aria-live="assertive" className="mt-4 text-sm opacity-80">{phase === "shown" ? `You got ${title} by ${artistName}.` : "The capsule is dropping…"}</p>
        {phase !== "shown" && <button type="button" className="btn btn-secondary mt-2" onClick={() => setPhase("shown")}>Skip to the result</button>}
        {phase === "shown" && (<>
          <h1 className="text-4xl font-bold mt-2">{title}</h1>
          <p className="hint">by {artistName} · small, up to {maxCm} cm</p>
          <p className="mt-3"><a href={shareUrl} target="_blank" rel="noreferrer" className="underline text-sm">Share card for your story (no price shown)</a></p>
        </>)}
      </div>
      <aside className="card p-5 h-fit md:sticky md:top-4">
        <h2 className="text-xl font-bold">Keep it and book</h2>
        <div className="mt-3 card p-4 border-2 border-acid"><p className="hint">Total price, nothing added later</p><p className="text-3xl font-bold">{gbp(pricePence)}</p><p className="text-sm">{gbp(depositPence)} deposit online now, {gbp(pricePence - depositPence)} on the day.</p></div>
        {alreadyBooked ? <Alert tone="success">Booked. Find it under My enquiries.</Alert> : (
          <form action={action} className="space-y-3 mt-4">
            {state?.error && <Alert tone="danger">{state.error}</Alert>}
            <input type="hidden" name="playId" value={playId} />
            <div><label className="field" htmlFor="placement">Placement</label><select id="placement" name="placement" className="select">{placements.map((x) => <option key={x} value={x}>{x}</option>)}</select><p className="hint">Gumball tattoos go on flat, easy areas only: outer upper arm, forearm, top of the shoulder, outer thigh or calf.</p></div>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="declaredOver18" required className="mt-1" /> I confirm I am 18 or over and will bring photographic ID.</label>
            <button className="btn btn-primary w-full justify-center" disabled={pending || phase !== "shown"}>{pending ? "Setting up your booking…" : signedIn ? "Keep it: choose a time" : "Sign in to keep it"}</button>
            <p className="hint">What you get is what you get: there are no swaps. Your artist confirms the exact size and placement in your private thread. Free touch-up included.</p>
          </form>
        )}
        <p className="hint mt-4">Artist page: <a href={`/artists/${artistSlug}`} className="underline">{artistName}</a></p>
      </aside>
    </div>
  );
}
