import Link from "next/link";
import { ownerDashboard } from "@/lib/metrics";
import { PageHeader, Stat, AppointmentBadge } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { formatStudio } from "@/lib/time";
import { emailProviderConfigured, stripeConfigured } from "@/lib/env";

export default async function OwnerHome() {
  const d = await ownerDashboard();
  return (<>
    <PageHeader title="Studio overview" intro={`${formatStudio(d.today, "cccc d LLLL yyyy")}. Figures are computed from recorded, verified transactions only.`} />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Stat label="Deposits verified today" value={formatPence(d.depositsTodayPence)} hint="Cash basis" />
      <Stat label="Takings this week" value={formatPence(d.takingsWeekPence)} hint="All verified payments" />
      <Stat label="Client deposits held" value={formatPence(d.depositsHeldPence)} hint="Liability until applied" />
      <Stat label="Open enquiries" value={d.openEnquiries} hint={`${d.awaitingDeposit} awaiting deposit`} />
      <Stat label="Confirmed this week" value={d.confirmedWeek} />
      <Stat label="Cancelled / no-show" value={`${d.cancelledWeek} / ${d.noShowWeek}`} />
      <Stat label="Pending manual deposits" value={d.pendingManual} hint="Appointments awaiting verification" />
      <Stat label="Chair rent overdue" value={d.rentOverdue} />
    </div>
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="card p-5"><h2 className="text-xl font-bold mb-3">Today&apos;s appointments</h2>{d.todaysAppointments.length === 0 ? <p className="opacity-60">Nothing in the diary today.</p> : <ul className="space-y-2">{d.todaysAppointments.map((a) => <li key={a.id} className="flex justify-between gap-2 items-center"><Link href={`/owner/bookings/${a.id}`} className="underline-offset-4 hover:underline"><strong>{formatStudio(a.startsAt, "HH:mm")}</strong> {a.client.name} · {a.artist.displayName} · {a.reference}</Link><AppointmentBadge status={a.status} /></li>)}</ul>}</section>
      <section className="card p-5"><h2 className="text-xl font-bold mb-3">Artists this week</h2><table className="data"><thead><tr><th>Artist</th><th>Booked</th><th>Booked value</th><th>Arrangement</th></tr></thead><tbody>{d.artists.map((a) => <tr key={a.id}><td>{a.displayName}</td><td>{a.bookedHoursWeek} h</td><td>{formatPence(a.bookedValueWeekPence)}</td><td className="text-xs">{a.model ? (a.model.type === "CHAIR_RENT_WEEKLY" ? `Rent ${formatPence(a.model.weeklyRentPence ?? 0)}/wk` : `${a.model.studioPercent}% studio`) : "not set"}</td></tr>)}</tbody></table><p className="hint mt-2">Booked value is gross client sales, not studio revenue. See Artists &amp; models for the split.</p></section>
      <section className="card p-5"><h2 className="text-xl font-bold mb-3">Enquiry sources</h2><ul className="space-y-1">{d.sources.map((s) => <li key={s.source} className="flex justify-between"><span>{s.source.toLowerCase()}</span><strong>{s.count}</strong></li>)}</ul></section>
      <section className="card p-5"><h2 className="text-xl font-bold mb-3">Integrations</h2><ul className="space-y-1 text-sm"><li>Email: {emailProviderConfigured() ? <span className="badge badge-acid">Resend</span> : <span className="badge badge-warn">Dev outbox</span>}</li><li>Card payments: {stripeConfigured() ? <span className="badge badge-acid">Stripe</span> : <span className="badge badge-warn">Not connected</span>}</li><li>WhatsApp: <span className="badge badge-muted">Phase 4</span></li><li>Accounting export: <span className="badge badge-muted">Phase 3</span></li></ul></section>
      <section className="card p-5 lg:col-span-2"><h2 className="text-xl font-bold mb-3">Recent audit entries</h2><ul className="text-sm space-y-1">{d.recentAudit.map((a) => <li key={a.id}><span className="opacity-60">{formatStudio(a.createdAt)}</span> · {a.actorLabel} · {a.action} · {a.entityType}{a.reason ? ` · "${a.reason}"` : ""}</li>)}</ul><Link href="/owner/audit" className="underline text-sm inline-block mt-2">Full audit log</Link></section>
    </div>
  </>);
}
