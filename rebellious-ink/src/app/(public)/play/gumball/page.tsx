import Link from "next/link";
import { machineState } from "@/lib/gumball";
import { getPrincipal } from "@/lib/session";
import { getVisitorId, hasPassedAgeGate } from "@/lib/visitor";
import { track } from "@/lib/analytics";
import { MachineArt, AgeGate, SpinForm, RestockAlert, PricePanel } from "@/components/gumball-machine";

export const metadata = { title: "Gumball machine: get what you get" };

export default async function GumballPage() {
  const [p, visitorId, adult] = await Promise.all([getPrincipal(), getVisitorId(), hasPassedAgeGate()]);
  const m = await machineState(visitorId, p?.userId ?? null);
  await track("game_viewed", { game: "gumball", visitorId, userId: p?.userId ?? null });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid md:grid-cols-[1fr_400px] gap-10 items-start">
        <div>
          <p className="text-acid-deep uppercase tracking-[.3em] text-sm mb-2">The tattoo studio for the people</p>
          <h1 className="text-5xl font-bold">Get what you get.</h1>
          <p className="mt-3 text-lg opacity-85 max-w-xl">Turn the crank and the machine picks one design from the capsules inside. No choosing, no swaps, one fixed price. Just like the machine on the studio counter, only you can do it from the sofa.</p>
          <div className="mt-6"><MachineArt spinning={false} capsules={m.available} /></div>
          <ol className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
            {[["1. Confirm you are 18+", "Date of birth check now, photographic ID in the studio."], ["2. Turn the crank", "Free. The machine decides, not you."], ["3. Keep it and book", `Pay the deposit, pick a time, get it tattooed for ${`£${(m.settings.pricePence / 100).toFixed(0)}`} total.`]].map(([t, d]) => <li key={t} className="card p-3"><p className="font-bold">{t}</p><p className="opacity-80">{d}</p></li>)}
          </ol>
        </div>
        <aside className="space-y-4 md:sticky md:top-4">
          <PricePanel pricePence={m.settings.pricePence} depositPence={m.settings.depositPence} maxCm={m.maxCm} available={m.available} />
          {!m.settings.enabled ? <div className="card p-5"><p className="font-bold">The machine is switched off at the moment.</p><p className="text-sm opacity-80 mt-1">Have a look at the <Link href="/flash" className="underline">flash catalogue</Link> instead.</p></div>
            : m.restocking ? <RestockAlert />
            : !adult ? <AgeGate />
            : <div className="card p-5"><SpinForm spinsLeft={m.spinsLeft} available={m.available} /></div>}
          <p className="hint">Every capsule is a real design by one of our artists, drawn to be tattooed small. Nothing is won or lost and nothing is charged to spin. 18+ only. Hands, fingers, neck and face are not available for gumball tattoos.</p>
        </aside>
      </div>
    </div>
  );
}
