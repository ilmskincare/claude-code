import Link from "next/link";
import { trioState } from "@/lib/trio";
import { getPrincipal } from "@/lib/session";
import { getVisitorId, hasPassedAgeGate } from "@/lib/visitor";
import { track } from "@/lib/analytics";
import { AgeGate } from "@/components/gumball-machine";
import { TrioMachines } from "@/components/trio-machines";

export const metadata = { title: "Three machines: ink, style, subject" };
const gbp = (p: number) => `£${(p / 100).toFixed(0)}`;

export default async function TrioPage() {
  const [p, visitorId, adult] = await Promise.all([getPrincipal(), getVisitorId(), hasPassedAgeGate()]);
  const t = await trioState(visitorId, p?.userId ?? null);
  await track("game_viewed", { game: "trio", visitorId, userId: p?.userId ?? null });
  const mode = !t.settings.enabled ? "off" : !adult ? "locked" : t.pullsLeft > 0 ? "ready" : "spent";
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid md:grid-cols-[1fr_400px] gap-10 items-start">
        <div>
          <p className="text-acid-deep uppercase tracking-[.3em] text-sm mb-2">Three machines, one tattoo</p>
          <h1 className="text-5xl font-bold">Ink. Style. Subject.</h1>
          <p className="mt-3 text-lg opacity-85 max-w-xl">The first machine decides black and grey or colour, the second the style, the third what it is: a spider, an angel, a dagger. Together they make your brief. Your artist draws it up and tattoos it small at one fixed price.</p>
          {mode === "locked" && <p className="mt-3 text-lg font-bold text-acid-deep" role="note">To play, fill in your date of birth first. The machines stay locked until you do.</p>}
          {mode === "locked" && <div className="mt-6"><AgeGate /></div>}
          <div className="mt-6"><TrioMachines key={mode} mode={mode} pullsLeft={t.pullsLeft} /></div>
        </div>
        <aside className="space-y-4 md:sticky md:top-4">
          <div className="card p-5 border-2 border-acid">
            <p className="hint">Total price, nothing added later</p>
            <p className="text-4xl font-bold">{gbp(t.settings.pricePence)}</p>
            <p className="mt-1">for a small tattoo drawn from your brief, up to {t.maxCm} cm. {gbp(t.settings.depositPence)} deposit when you book, {gbp(t.settings.pricePence - t.settings.depositPence)} on the day. Playing is free.</p>
            <p className="hint mt-2">{t.settings.inks.length} inks · {t.settings.styles.length} styles · {t.settings.subjects.length} subjects</p>
          </div>
          {!t.settings.enabled ? <div className="card p-5"><p className="font-bold">The three machines are switched off at the moment.</p><p className="text-sm opacity-80 mt-1">Try the <Link href="/play/gumball" className="underline">gumball machine</Link> or the <Link href="/flash" className="underline">flash catalogue</Link>.</p></div>
            : !adult ? <div className="card p-5"><p className="font-bold">Two steps.</p><p className="text-sm opacity-80 mt-1">1. Enter your date of birth (the box under the heading). 2. Pull all three. Playing is free.</p></div>
            : <div className="card p-5"><p className="font-bold">Age check done.</p><p className="text-sm opacity-80 mt-1">{t.pullsLeft > 0 ? "Turn any crank, press any PUSH, or pull all three with the button." : "That is your go for today. Come back tomorrow for another free one."}</p></div>}
          <p className="hint">Nothing is won or lost and nothing is charged to play. 18+ only. The brief is tattooed on flat, easy areas only; anywhere else, or bigger, is a custom price from the desk.</p>
        </aside>
      </div>
      <ol className="mt-8 grid sm:grid-cols-3 gap-3 text-sm">
        {[["1. Confirm you are 18+", "Date of birth check now, photographic ID in the studio."], ["2. Pull all three", "Free. Ink, style and subject are decided for you."], ["3. Keep it and book", `Pick your artist, pay the deposit, choose a time, get it tattooed for ${gbp(t.settings.pricePence)} total.`]].map(([h, d]) => <li key={h} className="card p-3"><p className="font-bold">{h}</p><p className="opacity-80">{d}</p></li>)}
      </ol>
    </div>
  );
}
