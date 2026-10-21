"use client";
import { useActionState } from "react";
import Link from "next/link";
import { ageGateAction, spinAction, restockAlertAction } from "@/app/actions/gumball";
import { Alert } from "./ui";

const gbp = (p: number) => `£${(p / 100).toFixed(0)}`;

/** The machine drawn in brand style: black body, acid-green globe, crown on top, RI shield on the coin slot, capsules inside. */
export function MachineArt({ spinning, capsules = 14 }: { spinning: boolean; capsules?: number }) {
  const dots = Array.from({ length: Math.min(capsules, 18) }, (_, i) => ({ cx: 110 + ((i * 53) % 150), cy: 150 + ((i * 37) % 95), r: 13 + (i % 3) * 2, fill: ["#8cb000", "#e9ecdc", "#a6d118", "#5f8300"][i % 4] }));
  return (
    <svg viewBox="0 0 360 520" className="w-full max-w-sm mx-auto" role="img" aria-label="Illustrated gumball machine with capsules inside">
      <defs><radialGradient id="globe" cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#1b2410" /><stop offset="1" stopColor="#070807" /></radialGradient></defs>
      {/* crown */}
      <path d="M140 62 L155 30 L172 56 L180 22 L188 56 L205 30 L220 62 Z" fill="#8cb000" stroke="#070807" strokeWidth="3" />
      <rect x="138" y="60" width="84" height="12" rx="3" fill="#8cb000" />
      {/* globe */}
      <g className="gumball-globe"><circle cx="180" cy="190" r="118" fill="url(#globe)" stroke="#8cb000" strokeWidth="5" />
        {dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} stroke="#070807" strokeWidth="2" />)}
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
      <g className={`gumball-crank ${spinning ? "spinning" : ""}`} style={{ transformOrigin: "250px 362px" }}>
        <circle cx="250" cy="362" r="22" fill="#070807" stroke="#8cb000" strokeWidth="4" />
        <rect x="246" y="340" width="8" height="22" rx="2" fill="#8cb000" />
        <rect x="250" y="358" width="22" height="8" rx="2" fill="#8cb000" />
      </g>
      {/* flap */}
      <rect x="140" y="420" width="80" height="50" rx="8" fill="#070807" stroke="#8cb000" strokeWidth="3" />
      <text x="180" y="450" textAnchor="middle" fontSize="12" fill="#8cb000" letterSpacing="2">PUSH</text>
      {/* stars */}
      {[[60, 90], [300, 110], [50, 250], [310, 260]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 8} L${x + 2} ${y - 2} L${x + 8} ${y} L${x + 2} ${y + 2} L${x} ${y + 8} L${x - 2} ${y + 2} L${x - 8} ${y} L${x - 2} ${y - 2} Z`} fill="#8cb000" opacity=".8" />)}
    </svg>
  );
}

export function AgeGate() {
  const [state, action, pending] = useActionState(ageGateAction, undefined);
  return (
    <form action={action} className="card p-5 space-y-3">
      <h2 className="text-xl font-bold">First, your age</h2>
      <p className="text-sm opacity-80">You must be 18 or over to be tattooed in the UK. We check photographic ID in the studio too.</p>
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      <div><label className="field" htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" className="input" required /></div>
      <button className="btn btn-primary" disabled={pending}>Continue</button>
    </form>
  );
}

export function SpinForm({ spinsLeft, available }: { spinsLeft: number; available: number }) {
  const [state, action, pending] = useActionState(spinAction, undefined);
  return (
    <form action={action} className="space-y-3">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      <div className="hidden" aria-hidden><MachineArt spinning={pending} capsules={available} /></div>
      <button className="btn btn-primary w-full justify-center text-lg" disabled={pending || spinsLeft === 0} aria-describedby="spin-help">{pending ? "Turning the crank…" : spinsLeft === 0 ? "That is your spin for today" : "Turn the crank (free)"}</button>
      <p id="spin-help" className="hint text-center">One free spin per person per day. The machine decides; what you get is what you get. Nothing is charged to spin.</p>
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
