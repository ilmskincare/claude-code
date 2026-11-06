import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { AppointmentBadge, BackLink } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { formatStudio } from "@/lib/time";
import { BookingTools } from "./tools";
import { can } from "@/lib/rbac";
import { CompleteAppointmentForm, ApplyCreditForm } from "@/components/completion-forms";
import { ensureAccount, loyaltySettings } from "@/lib/loyalty";

export default async function OwnerBooking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await requireCapability("bookings.view_all");
  const a = await db.appointment.findUnique({ where: { id }, include: { artist: true, client: true, station: true, payments: { orderBy: { createdAt: "desc" } }, request: true, ledgerEntries: { orderBy: { createdAt: "asc" } } } });
  if (!a) notFound();
  const [loyalty, loyaltyCfg] = await Promise.all([ensureAccount(a.clientId), loyaltySettings()]);
  const auditRows = await db.auditLog.findMany({ where: { entityType: "Appointment", entityId: a.id }, orderBy: { createdAt: "desc" } });
  return (<>
    <BackLink href="/owner/calendar">Planner</BackLink>
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="card p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="hint">Appointment</p><h1 className="text-3xl font-bold">{a.reference}</h1></div><AppointmentBadge status={a.status} /></div>
        <dl className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
          <div><dt className="hint">When</dt><dd className="font-semibold">{formatStudio(a.startsAt)} – {formatStudio(a.endsAt, "HH:mm")}</dd></div>
          <div><dt className="hint">Artist / station</dt><dd>{a.artist.displayName} · {a.station?.name ?? "no station"}</dd></div>
          <div><dt className="hint">Client</dt><dd>{a.client.name} · {a.client.email}</dd></div>
          <div><dt className="hint">Enquiry</dt><dd>{a.request ? <Link href={`/owner/enquiries/${a.request.id}`} className="underline">{a.request.reference}</Link> : "—"}</dd></div>
          <div><dt className="hint">Quoted / deposit</dt><dd>{a.quotedPence ? formatPence(a.quotedPence) : "—"} / {formatPence(a.depositPence)} {a.depositPaidAt ? <span className="badge badge-acid">paid</span> : <span className="badge badge-warn">outstanding</span>}</dd></div>
          <div><dt className="hint">Final price / credit applied</dt><dd>{a.finalPricePence != null ? formatPence(a.finalPricePence) : "—"} / {formatPence(a.creditAppliedPence)}{a.completedAt && <span className="block text-xs opacity-70">completed {formatStudio(a.completedAt)}</span>}</dd></div>
          <div><dt className="hint">Hold expires</dt><dd>{a.holdExpiresAt ? formatStudio(a.holdExpiresAt) : "—"}</dd></div>
        </dl>
        <h2 className="text-lg font-bold mt-6">Payments</h2>
        <table className="data mt-1"><thead><tr><th>When</th><th>Method</th><th>Amount</th><th>Status</th><th>Verified by</th></tr></thead><tbody>{a.payments.map((x) => <tr key={x.id}><td>{formatStudio(x.createdAt)}</td><td>{x.method.replace("_", " ").toLowerCase()}{x.providerRef ? ` · ${x.providerRef.slice(0, 18)}…` : ""}</td><td>{formatPence(x.amountPence)}</td><td>{x.status.toLowerCase()}</td><td className="text-xs">{x.verifiedById ? "staff" : x.providerEventId ? "Stripe event" : "—"}</td></tr>)}{a.payments.length === 0 && <tr><td colSpan={5} className="opacity-60">None</td></tr>}</tbody></table>
        <h2 className="text-lg font-bold mt-6">Ledger</h2>
        <table className="data mt-1"><thead><tr><th>Account</th><th>Debit</th><th>Credit</th><th>Description</th></tr></thead><tbody>{a.ledgerEntries.map((l) => <tr key={l.id}><td className="text-xs">{l.account.replace(/_/g, " ").toLowerCase()}</td><td>{l.debitPence ? formatPence(l.debitPence) : ""}</td><td>{l.creditPence ? formatPence(l.creditPence) : ""}</td><td className="text-xs">{l.description}</td></tr>)}</tbody></table>
        <h2 className="text-lg font-bold mt-6">Audit trail</h2>
        <ul className="text-sm space-y-1 mt-1">{auditRows.map((r) => <li key={r.id}><span className="opacity-60">{formatStudio(r.createdAt)}</span> · {r.actorLabel} · {r.action}{r.reason ? ` · "${r.reason}"` : ""}</li>)}</ul>
      </section>
      <div className="space-y-6">
      {(can(p, "bookings.override") || a.artistId === p.artistProfileId) && <CompleteAppointmentForm appointmentId={a.id} status={a.status} suggestedPence={a.quotedPence ?? 0} />}
      {(can(p, "loyalty.redeem") || can(p, "bookings.override")) && loyaltyCfg.enabled && <ApplyCreditForm appointmentId={a.id} balancePence={loyalty.balancePence} minRedeemPence={loyaltyCfg.minRedeemPence} appliedPence={a.creditAppliedPence} closed={["CANCELLED", "COMPLETED", "NO_SHOW"].includes(a.status)} />}
      <BookingTools appointmentId={a.id} status={a.status} depositPence={a.depositPence} canOverride={can(p, "bookings.override")} canCancel={can(p, "bookings.cancel")} canVerify={can(p, "finance.verify_manual_payment")} />
      </div>
    </div>
  </>);
}
