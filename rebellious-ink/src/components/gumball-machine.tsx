"use client";
import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { ageGateAction, spinAction, restockAlertAction } from "@/app/actions/gumball";
import { Alert } from "./ui";

const gbp = (p: number) => `£${(p / 100).toFixed(0)}`;

/** Capsules piled in the bottom of the globe, bottom row first, part rows centred. */
function capsulePile(count: number) {
  const rows = [{ cy: 282, n: 4 }, { cy: 256, n: 5 }, { cy: 230, n: 6 }, { cy: 204, n: 6 }, { cy: 178, n: 5 }];
  const out: { cx: number; cy: number; a: string; b: string }[] = [];
  const colours = [["#8cb000", "#e9ecdc"], ["#e9ecdc", "#5f8300"], ["#a6d118", "#131613"], ["#5f8300", "#e9ecdc"]];
  let left = Math.min(count, 26);
  for (const row of rows) {
    if (left <= 0) break;
    const n = Math.min(row.n, left);
    const startX = 180 - ((n - 1) * 30) / 2;
    for (let i = 0; i < n; i++) { const k = out.length; out.push({ cx: startX + i * 30, cy: row.cy, a: colours[k % 4][0], b: colours[k % 4][1] }); }
    left -= n;
  }
  return out;
}

/** The machine drawn in brand style: black body, acid-green globe, crown on top, RI shield on the coin slot, capsules piled inside. The crank and flap are real controls. */
export function MachineArt({ spinning, capsules = 14, locked = false, onCrank }: { spinning: boolean; capsules?: number; locked?: boolean; onCrank?: () => void }) {
  const pile = capsulePile(capsules);
  const handle = onCrank ? { role: "button" as const, tabIndex: 0, onClick: onCrank, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCrank(); } }, style: { cursor: "pointer" } } : {};
  return (
    <svg viewBox="0 0 360 520" className="w-full max-w-sm mx-auto" role="img" aria-label={`Illustrated gumball machine with ${capsules} capsule${capsules === 1 ? "" : "s"} inside`}>
      <defs><radialGradient id="globe" cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#1b2410" /><stop offset="1" stopColor="#070807" /></radialGradient></defs>
      {/* crown */}
      <path d="M140 62 L155 30 L172 56 L180 22 L188 56 L205 30 L220 62 Z" fill="#8cb000" stroke="#070807" strokeWidth="3" />
      <rect x="138" y="60" width="84" height="12" rx="3" fill="#8cb000" />
      {/* globe */}
      <g className="gumball-globe"><circle cx="180" cy="190" r="118" fill="url(#globe)" stroke="#8cb000" strokeWidth="5" />
        {pile.map((c, i) => <g key={i}>
          <circle cx={c.cx} cy={c.cy} r="13" fill={c.a} stroke="#070807" strokeWidth="1.5" />
          <path d={`M${c.cx - 13} ${c.cy} A13 13 0 0 1 ${c.cx + 13} ${c.cy} Z`} fill={c.b} stroke="#070807" strokeWidth="1.5" />
          <circle cx={c.cx - 4} cy={c.cy - 6} r="2.5" fill="#ffffff" opacity=".55" />
        </g>)}
        <ellipse cx="135" cy="120" rx="34" ry="14" fill="#e9ecdc" opacity=".12" transform="rotate(-30 135 120)" />
      </g>
      {/* body */}
      <path d="M90 300 L270 300 L285 500 L75 500 Z" fill="#131613" stroke="#8cb000" strokeWidth="4" />
      <rect x="120" y="300" width="120" height="24" fill="#070807" stroke="#8cb000" strokeWidth="3" />
      {/* coin slot with RI shield */}
      <path d="M180 340 L202 348 L202 372 L180 390 L158 372 L158 348 Z" fill="#070807" stroke="#8cb000" strokeWidth="3" />
      <text x="180" y="372" textAnchor="middle" fontSize="16" fontWeight="700" fill="#8cb000" fontFamily="serif">RI</text>
      <rect x="174" y="332" width="12" height="4" fill="#8cb000" />
      {/* crank */}
      <g className={`gumball-crank ${spinning ? "spinning" : ""}`} style={{ transformOrigin: "250px 362px", opacity: locked ? 0.55 : 1 }} aria-label={locked ? "Crank, locked until you confirm your age" : "Turn the crank"} {...handle}>
        <circle cx="250" cy="362" r="22" fill="#070807" stroke="#8cb000" strokeWidth="4" />
        <rect x="246" y="340" width="8" height="22" rx="2" fill="#8cb000" />
        <rect x="250" y="358" width="22" height="8" rx="2" fill="#8cb000" />
      </g>
      {/* flap */}
      <g aria-label={locked ? "Push, locked until you confirm your age" : "Push to turn the crank"} {...handle}>
        <rect x="140" y="420" width="80" height="50" rx="8" fill="#070807" stroke="#8cb000" strokeWidth="3" />
        <text x="180" y="450" textAnchor="middle" fontSize="12" fill="#8cb000" letterSpacing="2">{locked ? "LOCKED" : "PUSH"}</text>
      </g>
      {/* stars */}
      {[[60, 90], [300, 90], [60, 290], [300, 290]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 8} L${x + 2} ${y - 2} L${x + 8} ${y} L${x + 2} ${y + 2} L${x} ${y + 8} L${x - 2} ${y + 2} L${x - 8} ${y} L${x - 2} ${y - 2} Z`} fill="#8cb000" opacity=".8" />)}
    </svg>
  );
}

export type MachineMode = "off" | "restocking" | "locked" | "ready" | "spent";

/** The machine with its controls: the crank and flap spin when the age check is done, otherwise they take you to the date of birth box. */
export function GumballMachine({ mode, capsules, spinsLeft }: { mode: MachineMode; capsules: number; spinsLeft: number }) {
  const [state, action, pending] = useActionState(spinAction, undefined);
  const [note, setNote] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ready = mode === "ready" && spinsLeft > 0;
  const onCrank = () => {
    if (pending) return;
    if (ready) { formRef.current?.requestSubmit(); return; }
    if (mode === "locked") {
      setNote("Pop your date of birth in first, then the crank unlocks.");
      const gate = document.getElementById("age-gate");
      const dob = document.getElementById("dateOfBirth") as HTMLInputElement | null;
      gate?.scrollIntoView({ behavior: "smooth", block: "center" });
      gate?.classList.add("attention"); window.setTimeout(() => gate?.classList.remove("attention"), 2400);
      dob?.focus();
      return;
    }
    setNote(mode === "spent" || mode === "ready" ? "That is your spin for today. Come back tomorrow." : mode === "restocking" ? "The machine is being restocked. Leave your email and we will tell you when it is full." : "The machine is switched off at the moment.");
  };
  return (
    <form ref={formRef} action={action} className="space-y-3">
      <MachineArt spinning={pending} capsules={capsules} locked={mode === "locked"} onCrank={onCrank} />
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {note && <p className="text-center text-sm font-semibold text-acid-deep" role="status">{note}</p>}
      {ready ? <>
        <button className="btn btn-primary w-full justify-center text-lg" disabled={pending} aria-describedby="spin-help">{pending ? "Turning the crank…" : "Turn the crank (free)"}</button>
        <p id="spin-help" className="hint text-center">One free spin per person per day. The machine decides; what you get is what you get. Nothing is charged to spin.</p>
      </> : mode === "ready" || mode === "spent" ? <p className="hint text-center">That is your spin for today. Come back tomorrow for another free go.</p>
        : mode === "locked" ? <p className="hint text-center">The crank unlocks once you have entered your date of birth.</p> : null}
    </form>
  );
}

export function AgeGate() {
  const [state, action, pending] = useActionState(ageGateAction, undefined);
  const [localError, setLocalError] = useState<string | null>(null);
  return (
    <form id="age-gate" action={action} noValidate className="card p-5 space-y-3 scroll-mt-24" onSubmit={(e) => {
      const dob = (e.currentTarget.elements.namedItem("dateOfBirth") as HTMLInputElement | null)?.value ?? "";
      if (!dob) { e.preventDefault(); setLocalError("Tap the date box and pick your date of birth, then press Continue."); } else setLocalError(null);
    }}>
      <h2 className="text-xl font-bold">First, your age</h2>
      <p className="text-sm opacity-80">You must be 18 or over to be tattooed in the UK. We check photographic ID in the studio too.</p>
      {(localError || state?.error) && <Alert tone="danger">{localError ?? state?.error}</Alert>}
      <div><label className="field" htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" className="input" required aria-describedby="dob-help" max={new Date().toISOString().slice(0, 10)} /><p id="dob-help" className="hint">Tap the box to pick the day, month and year.</p></div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Checking…" : "Continue"}</button>
    </form>
  );
}

export function RestockAlert() {
  const [state, action, pending] = useActionState(restockAlertAction, undefined);
  return (
    <form action={action} className="card p-5 space-y-3">
      <h2 className="text-xl font-bold">Machine being restocked, back soon</h2>
      <p className="text-sm opacity-80">Leave your email and we will tell you when it is full again. One email, nothing else.</p>
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Thanks, we will let you know.</Alert>}
      <div className="flex gap-2"><label className="sr-only" htmlFor="alertEmail">Email</label><input id="alertEmail" name="email" type="email" className="input" placeholder="you@example.com" required /><button className="btn btn-secondary" disabled={pending}>Tell me</button></div>
      <p className="hint">Meanwhile, the <Link href="/flash" className="underline">flash catalogue</Link> is open.</p>
    </form>
  );
}

export function PricePanel({ pricePence, depositPence, maxCm, available }: { pricePence: number; depositPence: number; maxCm: number; available: number }) {
  return (
    <div className="card p-5 border-2 border-acid">
      <p className="hint">Total price, nothing added later</p>
      <p className="text-4xl font-bold">{gbp(pricePence)}</p>
      <p className="mt-1">for a small tattoo, up to {maxCm} cm. {gbp(depositPence)} deposit when you book, {gbp(pricePence - depositPence)} on the day. Spinning is free.</p>
      <p className="hint mt-2" aria-live="polite">{available} capsule{available === 1 ? "" : "s"} in the machine right now</p>
    </div>
  );
}
