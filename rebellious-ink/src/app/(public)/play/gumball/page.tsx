import Link from "next/link";
import { machineState } from "@/lib/gumball";
import { getPrincipal } from "@/lib/session";
import { getVisitorId, hasPassedAgeGate } from "@/lib/visitor";
import { track } from "@/lib/analytics";
import { GumballMachine, AgeGate, RestockAlert, PricePanel, type MachineMode } from "@/components/gumball-machine";

export const metadata = { title: "Gumball machine: get what you get" };

export default async function GumballPage() {
  const [p, visitorId, adult] = await Promise.all([getPrincipal(), getVisitorId(), hasPassedAgeGate()]);
  const m = await machineState(visitorId, p?.userId ?? null);
  await track("game_viewed", { game: "gumball", visitorId, userId: p?.userId ?? null });
  const mode: MachineMode = !m.settings.enabled ? "off" : m.restocking ? "restocking" : !adult ? "locked" : m.spinsLeft > 0 ? "ready" : "spent";
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid md:grid-cols-[1fr_400px] gap-10 items-start">
        <div>
          <p className="text-acid-deep uppercase tracking-[.3em] text-sm mb-2">The tattoo studio for the people</p>
          <h1 className="text-5xl font-bold">Get what you get.</h1>
          <p className="mt-3 text-lg opacity-85 max-w-xl">Turn the crank and the machine picks one design from the capsules inside. No choosing, no swaps, one fixed price. Just like the machine on the studio counter, only you can do it from the sofa.</p>
          {mode === "locked" && <p className="mt-3 text-lg font-bold text-acid-deep" role="note">To play, fill in your date of birth first. The machine stays locked until you do.</p>}
          {mode === "locked" && <div className="mt-6"><AgeGate /></div>}
          <div className="mt-6"><GumballMachine key={mode} mode={mode} capsules={m.available} spinsLeft={m.spinsLeft} /></div>
        </div>
        <aside className="space-y-4 md:sticky md:top-4">
          <PricePanel pricePence={m.settings.pricePence} depositPence={m.settings.depositPence} maxCm={m.maxCm} available={m.available} />
          {!m.settings.enabled ? <div className="card p-5"><p className="font-bold">The machine is switched off at the moment.</p><p className="text-sm opacity-80 mt-1">Have a look at the <Link href="/flash" className="underline">flash catalogue</Link> instead.</p></div>
            : m.restocking ? <RestockAlert />
            : !adult ? <div className="card p-5"><p className="font-bold">Two steps.</p><p className="text-sm opacity-80 mt-1">1. Enter your date of birth (the box under the heading). 2. Turn the crank. Spinning is free.</p></div>
            : <div className="card p-5"><p className="font-bold">Age check done.</p><p className="text-sm opacity-80 mt-1">{m.spinsLeft > 0 ? "Turn the crank on the machine, or press PUSH." : "That is your spin for today. Come back tomorrow for another free go."}</p></div>}
          <p className="hint">Every capsule is a real design by one of our artists, drawn to be tattooed small. Nothing is won or lost and nothing is charged to spin. 18+ only. Hands, fingers, neck and face are not available for gumball tattoos.</p>
          <p className="hint">Prefer a brief to a drawing? Try the <Link href="/play/trio" className="underline">three machines</Link>: ink, style and subject.</p>
        </aside>
      </div>
      <ol className="mt-8 grid sm:grid-cols-3 gap-3 text-sm">
        {[["1. Confirm you are 18+", "Date of birth check now, photographic ID in the studio."], ["2. Turn the crank", "Free. The machine decides, not you."], ["3. Keep it and book", `Pay the deposit, pick a time, get it tattooed for £${(m.settings.pricePence / 100).toFixed(0)} total.`]].map(([t, d]) => <li key={t} className="card p-3"><p className="font-bold">{t}</p><p className="opacity-80">{d}</p></li>)}
      </ol>
    </div>
  );
}
