import Link from "next/link";
import { requireCapability } from "@/lib/session";
import { ownerDashboard } from "@/lib/gumball";
import { trioOwnerSummary } from "@/lib/trio";
import { eventCounts } from "@/lib/analytics";
import { PageHeader, Stat } from "@/components/ui";
import { DesignImage } from "@/components/design-image";
import { RestockAlertsButton } from "./alerts-button";
import { signedUrl } from "@/lib/storage";
import { formatStudio } from "@/lib/time";
import { formatPence } from "@/lib/money";

export default async function OwnerGumball() {
  await requireCapability("roster.manage");
  const d = await ownerDashboard();
  const ev = await eventCounts("gumball", d.since);
  const trio = await trioOwnerSummary();
  const tev = await eventCounts("trio", d.since);
  return (<>
    <PageHeader title="Gumball machine" intro={`Free to spin, ${formatPence(d.settings.pricePence)} total when they book, ${formatPence(d.settings.depositPence)} deposit. ${d.settings.spinsPerDay} spin per person per day. The machine hides itself below ${d.settings.minStock} available designs. Change any of these under Settings.`} actions={<><Link href="/owner/flash/new" className="btn btn-primary">Add a capsule design</Link><Link href="/owner/settings" className="btn btn-secondary">Settings</Link></>} />
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><Stat label="Capsules available" value={d.available} hint={d.available < d.settings.minStock ? "Below minimum: machine shows as restocking" : undefined} /><Stat label="Spins, last 7 days" value={d.playsWeek} /><Stat label="Booked, last 7 days" value={d.bookedWeek} /><Stat label="Waiting for restock" value={d.alerts} /></div>
    <section className="card p-4 mb-6"><h2 className="text-xl font-bold mb-2">Last 30 days</h2><p className="text-sm">Page views {ev.game_viewed ?? 0} · age gate passed {ev.age_gate_passed ?? 0} · spins {ev.play_started ?? 0} · results shown {ev.result_shown ?? 0} · deposits paid {ev.deposit_paid ?? 0} · restock sign-ups {ev.restock_alert_signup ?? 0}</p><p className="hint">First-party counts; nothing is sent to a third-party tracker.</p>{d.alerts > 0 && <div className="mt-3"><RestockAlertsButton /></div>}</section>
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="card p-4"><h2 className="text-xl font-bold mb-2">Capsules</h2><p className="hint mb-2">Designs in the Gumball collection, including the stamp set (theme &ldquo;stamp&rdquo;). Add more under Flash with collection set to Gumball; give stamp designs the theme &ldquo;stamp&rdquo; so they are grouped with the others.</p>
        <ul className="divide-y divide-graphite">{d.designs.map((x) => <li key={x.id} className="py-2 flex items-center gap-3"><DesignImage src={signedUrl(x.imageKey, 3600)} alt="" hotspot={{ x: x.hotspotX, y: x.hotspotY, w: x.hotspotW, h: x.hotspotH }} className="w-12 h-12 rounded-lg shrink-0" /><div className="flex-1"><Link href={`/owner/flash/${x.id}`} className="underline">{x.title}</Link><span className="block text-xs opacity-60">{x.artist.displayName} · {x.repeatable ? "repeatable" : "one-off"}</span></div><span className={`badge ${x.status === "AVAILABLE" ? "badge-acid" : "badge-muted"}`}>{x.status.toLowerCase()}</span></li>)}{d.designs.length === 0 && <li className="opacity-60 py-2">No capsule designs yet.</li>}</ul>
      </section>
      <section className="card p-4"><h2 className="text-xl font-bold mb-2">Recent spins</h2>
        <table className="data"><thead><tr><th>When</th><th>Design</th><th>Who</th><th>Status</th></tr></thead><tbody>{d.plays.map((pl) => <tr key={pl.id}><td>{formatStudio(pl.createdAt, "dd/MM HH:mm")}</td><td>{pl.design?.title ?? "—"}</td><td className="text-xs">{pl.user?.name ?? pl.user?.email ?? `visitor ${pl.visitorId.slice(0, 6)}`}</td><td><span className={`badge ${pl.status === "BOOKED" ? "badge-acid" : "badge-muted"}`}>{pl.status.replace("_", " ").toLowerCase()}</span></td></tr>)}{d.plays.length === 0 && <tr><td colSpan={4} className="opacity-60">No spins yet.</td></tr>}</tbody></table>
      </section>
    </div>
    <section className="card p-4 mt-6"><h2 className="text-xl font-bold mb-1">Three machines</h2><p className="hint mb-3">Ink, style and subject pulled at random, {formatPence(trio.settings.pricePence)} total when they book, {formatPence(trio.settings.depositPence)} deposit, {trio.settings.spinsPerDay} go per person per day. {trio.settings.inks.length} inks, {trio.settings.styles.length} styles, {trio.settings.subjects.length} subjects; edit the lists under Settings.</p>
      <div className="grid sm:grid-cols-3 gap-4 mb-4"><Stat label="Goes, last 7 days" value={trio.playsWeek} /><Stat label="Booked, last 7 days" value={trio.bookedWeek} /><Stat label="Page views, 30 days" value={tev.game_viewed ?? 0} hint={`${tev.play_started ?? 0} goes`} /></div>
      <table className="data"><thead><tr><th>When</th><th>Brief</th><th>Who</th><th>Status</th></tr></thead><tbody>{trio.plays.map((pl) => <tr key={pl.id}><td>{formatStudio(pl.createdAt, "dd/MM HH:mm")}</td><td className="capitalize">{pl.brief}</td><td className="text-xs">{pl.user?.name ?? pl.user?.email ?? `visitor ${pl.visitorId.slice(0, 6)}`}</td><td><span className={`badge ${pl.status === "BOOKED" ? "badge-acid" : "badge-muted"}`}>{pl.status.replace("_", " ").toLowerCase()}</span></td></tr>)}{trio.plays.length === 0 && <tr><td colSpan={4} className="opacity-60">No goes yet.</td></tr>}</tbody></table>
    </section>
  </>);
}
