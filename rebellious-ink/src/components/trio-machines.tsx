"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trioPullAction, bookTrioAction } from "@/app/actions/trio";
import { Alert } from "./ui";

const gbp = (p: number) => `£${(p / 100).toFixed(0)}`;
export type MiniState = "locked" | "idle" | "spinning" | "shown";

/** One small machine in brand style with a window that shows its reel. */
export function MiniMachine({ label, value, state, glow = false, onCrank, tone = "#8cb000" }: { label: string; value?: string | null; state: MiniState; glow?: boolean; onCrank?: () => void; tone?: string }) {
  const handle = onCrank ? { role: "button" as const, tabIndex: 0, onClick: onCrank, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCrank(); } }, style: { cursor: "pointer" } } : {};
  const windowText = state === "shown" ? value ?? "" : state === "spinning" ? "…" : state === "locked" ? "LOCKED" : "READY";
  const font = (windowText.length > 12 ? 13 : windowText.length > 9 ? 15 : 18);
  return (
    <svg viewBox="0 0 220 300" className="w-full max-w-[220px] mx-auto" role="img" aria-label={`${label} machine${state === "shown" && value ? `: ${value}` : ""}`}>
      <defs><radialGradient id={`g-${label}`} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#1b2410" /><stop offset="1" stopColor="#070807" /></radialGradient></defs>
      {/* crown */}
      <path d="M85 40 L95 18 L105 36 L110 12 L115 36 L125 18 L135 40 Z" fill={tone} stroke="#070807" strokeWidth="2" />
      <rect x="84" y="38" width="52" height="8" rx="2" fill={tone} />
      {/* globe with capsules */}
      <g className={state === "spinning" ? "gumball-globe" : undefined}><circle cx="110" cy="105" r="62" fill={`url(#g-${label})`} stroke={tone} strokeWidth="4" />
        {[[88, 150], [110, 150], [132, 150], [99, 132], [121, 132]].map(([cx, cy], i) => <g key={i}><circle cx={cx} cy={cy} r="9" fill={i % 2 ? "#e9ecdc" : tone} stroke="#070807" strokeWidth="1.2" /><path d={`M${cx - 9} ${cy} A9 9 0 0 1 ${cx + 9} ${cy} Z`} fill={i % 2 ? tone : "#e9ecdc"} stroke="#070807" strokeWidth="1.2" /></g>)}
        <ellipse cx="88" cy="70" rx="18" ry="7" fill="#e9ecdc" opacity=".12" transform="rotate(-30 88 70)" />
      </g>
      {/* label plate on the globe */}
      <rect x="70" y="86" width="80" height="22" rx="5" fill="#070807" stroke={tone} strokeWidth="2" />
      <text x="110" y="101" textAnchor="middle" fontSize="11" fontWeight="700" fill={tone} letterSpacing="2">{label.toUpperCase()}</text>
      {/* body */}
      <path d="M60 165 L160 165 L170 290 L50 290 Z" fill="#131613" stroke={tone} strokeWidth="3" />
      <rect x="78" y="165" width="64" height="14" fill="#070807" stroke={tone} strokeWidth="2" />
      {/* result window */}
      <rect x="62" y="192" width="96" height="40" rx="6" fill="#070807" stroke={tone} strokeWidth="2" />
      <text x="110" y="217" textAnchor="middle" fontSize={font} fontWeight="700" fill={state === "shown" ? "#e9ecdc" : tone} className={state === "spinning" ? "reel-flicker" : undefined}>{windowText}</text>
      {/* crank */}
      <g className={`gumball-crank ${state === "spinning" ? "spinning" : ""}`} style={{ transformOrigin: "145px 258px", opacity: state === "locked" ? 0.55 : 1 }} aria-label={state === "locked" ? `${label} crank, locked until you confirm your age` : `Turn the ${label.toLowerCase()} crank`} {...handle}>
        <circle cx="145" cy="258" r="14" fill="#070807" stroke={tone} strokeWidth="3" />
        <rect x="142" y="244" width="6" height="14" rx="2" fill={tone} />
        <rect x="145" y="255" width="14" height="6" rx="2" fill={tone} />
      </g>
      {/* flap */}
      <g aria-label={state === "locked" ? `${label} flap, locked until you confirm your age` : `Push the ${label.toLowerCase()} machine`} {...handle}>
        <rect x="68" y="244" width="56" height="32" rx="6" fill={glow ? tone : "#070807"} stroke={glow ? "#e9ecdc" : tone} strokeWidth="2" className={glow ? "flap-glow" : undefined} />
        <text x="96" y="264" textAnchor="middle" fontSize="10" fontWeight="700" fill={glow ? "#070807" : tone} letterSpacing="2">{state === "locked" ? "LOCKED" : "PUSH"}</text>
      </g>
    </svg>
  );
}

export const MACHINES: { key: "ink" | "style" | "subject"; label: string; blurb: string }[] = [
  { key: "ink", label: "Ink", blurb: "Black and grey, or colour." },
  { key: "style", label: "Style", blurb: "Traditional, fine line, blackwork and more." },
  { key: "subject", label: "Subject", blurb: "Spider, angel, dagger: simple flash ideas." },
];

/** Landing: three machines. Any crank or flap starts the one free go; before the age check they point at the date of birth box. */
export function TrioMachines({ mode, pullsLeft }: { mode: "off" | "locked" | "ready" | "spent"; pullsLeft: number }) {
  const [state, action, pending] = useActionState(trioPullAction, undefined);
  const [note, setNote] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ready = mode === "ready" && pullsLeft > 0;
  const onCrank = () => {
    if (pending) return;
    if (ready) { formRef.current?.requestSubmit(); return; }
    if (mode === "locked") {
      setNote("Pop your date of birth in first, then the machines unlock.");
      const gate = document.getElementById("age-gate");
      gate?.scrollIntoView({ behavior: "smooth", block: "center" });
      gate?.classList.add("attention"); window.setTimeout(() => gate?.classList.remove("attention"), 2400);
      (document.getElementById("dateOfBirth") as HTMLInputElement | null)?.focus();
      return;
    }
    setNote(mode === "off" ? "The three machines are switched off at the moment." : "That is your go for today. Come back tomorrow.");
  };
  const mini: MiniState = mode === "locked" ? "locked" : pending ? "spinning" : "idle";
  const stepButton = ready
    ? <button className="btn btn-primary w-full justify-center text-lg py-4" disabled={pending} aria-describedby="trio-help">{pending ? "Pulling all three…" : "Step 2 of 2: pull all three (free)"}</button>
    : null;
  return (
    <form ref={formRef} action={action} className="space-y-3">
      {stepButton}
      {pending && <p role="status" aria-live="assertive" className="text-center font-semibold text-acid-deep">Pulling all three… the reels are landing. This takes a few seconds.</p>}
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {note && !pending && <p className="text-center text-sm font-semibold text-acid-deep" role="status">{note}</p>}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {MACHINES.map((m) => <div key={m.key} className="text-center"><MiniMachine label={m.label} state={mini} glow={ready && !pending} onCrank={onCrank} /><p className="text-xs sm:text-sm opacity-80 mt-1">{m.blurb}</p></div>)}
      </div>
      {ready ? <p id="trio-help" className="hint text-center">Tap any glowing PUSH, any crank, or the button above. One free go per person per day. The machines decide; what you get is what you get. Nothing is charged to play.</p>
        : mode === "spent" || mode === "ready" ? <p className="hint text-center">That is your go for today. Come back tomorrow for another free one.</p>
        : mode === "locked" ? <p className="hint text-center">The machines are locked until you have entered your date of birth above.</p> : null}
    </form>
  );
}

/** Result page: the three machines land one after another, then the brief and the booking card appear. */
export function TrioReveal({ playId, result, artists, placements, pricePence, depositPence, maxCm, signedIn, alreadyBooked }: { playId: string; result: { ink: string; style: string; subject: string }; artists: { id: string; slug: string; displayName: string }[]; placements: string[]; pricePence: number; depositPence: number; maxCm: number; signedIn: boolean; alreadyBooked: boolean }) {
  const [landed, setLanded] = useState(0);
  const [state, action, pending] = useActionState(bookTrioAction, undefined);
  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || alreadyBooked) { const t = setTimeout(() => setLanded(3), 0); return () => clearTimeout(t); }
    const ts = [1, 2, 3].map((n) => setTimeout(() => setLanded(n), 700 * n + 300));
    return () => ts.forEach(clearTimeout);
  }, [alreadyBooked]);
  const values = [result.ink, result.style, result.subject];
  const brief = `${result.ink} ${result.style.toLowerCase()} ${result.subject.toLowerCase()}`;
  const done = landed >= 3;
  return (
    <div className="grid md:grid-cols-[1fr_380px] gap-8">
      <div className="text-center">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {MACHINES.map((m, i) => <div key={m.key}><MiniMachine label={m.label} value={values[i]} state={landed > i ? "shown" : "spinning"} /></div>)}
        </div>
        <p role="status" aria-live="assertive" className="mt-4 text-sm opacity-80">{done ? `You got: ${brief}.` : `Machine ${landed + 1} is landing…`}</p>
        {!done && <button type="button" className="btn btn-secondary mt-2" onClick={() => setLanded(3)}>Skip to the result</button>}
        {done && (<>
          <h1 className="text-4xl font-bold mt-2 capitalize">{brief}</h1>
          <p className="hint">Your artist draws a simple flash design from this brief and tattoos it small, up to {maxCm} cm.</p>
        </>)}
      </div>
      <aside className="card p-5 h-fit md:sticky md:top-4">
        <h2 className="text-xl font-bold">Keep it and book</h2>
        <div className="mt-3 card p-4 border-2 border-acid"><p className="hint">Total price, nothing added later</p><p className="text-3xl font-bold">{gbp(pricePence)}</p><p className="text-sm">{gbp(depositPence)} deposit online now, {gbp(pricePence - depositPence)} on the day.</p></div>
        {alreadyBooked ? <Alert tone="success">Booked. Find it under My enquiries.</Alert> : (
          <form action={action} className="space-y-3 mt-4">
            {state?.error && <Alert tone="danger">{state.error}</Alert>}
            <input type="hidden" name="playId" value={playId} />
            <div><label className="field" htmlFor="artistId">Who draws and tattoos it</label><select id="artistId" name="artistId" className="select" required defaultValue={artists[0]?.id ?? ""}>{artists.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}</select>{artists.length === 0 && <p className="hint">No artists are taking enquiries right now.</p>}</div>
            <div><label className="field" htmlFor="placement">Placement</label><select id="placement" name="placement" className="select">{placements.map((x) => <option key={x} value={x}>{x}</option>)}</select><p className="hint">Flat, easy areas only at this price: outer upper arm, forearm, top of the shoulder, outer thigh or calf.</p></div>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="declaredOver18" required className="mt-1" /> I confirm I am 18 or over and will bring photographic ID.</label>
            <button className="btn btn-primary w-full justify-center" disabled={pending || !done || artists.length === 0}>{pending ? "Setting up your booking…" : signedIn ? "Keep it: choose a time" : "Sign in to keep it"}</button>
            <p className="hint">What you get is what you get: no swaps. Your artist sketches the design and confirms size and placement in your private thread before the day. Free touch-up included.</p>
          </form>
        )}
        <p className="hint mt-4">Fancy a drawn design instead? Try the <Link href="/play/gumball" className="underline">gumball machine</Link>.</p>
      </aside>
    </div>
  );
}
