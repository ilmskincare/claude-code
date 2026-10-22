import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { AppointmentBadge, BackLink, Alert } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { formatStudio } from "@/lib/time";
import { stripeConfigured } from "@/lib/env";
import { can } from "@/lib/rbac";
import { CompleteAppointmentForm } from "@/components/completion-forms";

export default async function MyBooking({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; cancelled?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const p = await requirePrincipal();
  const a = await db.appointment.findUnique({ where: { id }, include: { artist: true, payments: { orderBy: { createdAt: "desc" } }, studio: true, generatedPdfs: true } });
  if (!a || (a.clientId !== p.userId && !can(p, "bookings.view_all") && a.artistId !== p.artistProfileId)) notFound();
  // Guides for this booking: the procedure's own, every piercing site for a piercing, and the general ones (age, deposits, complaints, privacy, allergies, medical conditions, infection control).
  const docs = await db.documentTemplateVersion.findMany({ where: { isCurrent: true, kind: { in: ["PREPARATION_GUIDE", "AFTERCARE_GUIDE", "INFORMATION", "CONSENT_FORM"] }, procedureType: { in: ["all", "general", ...(a.category === "PIERCING" ? ["piercing", "piercing_ear_face", "piercing_oral", "piercing_body", "piercing_genital"] : ["tattoo"])] } }, orderBy: [{ kind: "asc" }, { title: "asc" }] });
  const paid = a.payments.find((x) => x.status === "SUCCEEDED" && x.purpose === "DEPOSIT");
  return (
    <>
      <BackLink href="/my/bookings">My bookings</BackLink>
      <div className="card p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="hint">Booking reference</p><h1 className="text-3xl font-bold">{a.reference}</h1></div><AppointmentBadge status={a.status} /></div>
        {sp.paid && a.status === "PENDING_DEPOSIT" && <div className="mt-4"><Alert tone="info">Thanks. We are waiting for Stripe to confirm your payment; this page will show &ldquo;Confirmed&rdquo; once the payment event arrives. If it has not after a few minutes, contact the studio quoting {a.reference}.</Alert></div>}
        {sp.cancelled && <div className="mt-4"><Alert tone="warn">Payment was cancelled. Your slot is held until {a.holdExpiresAt ? formatStudio(a.holdExpiresAt, "HH:mm") : "the hold expires"}.</Alert></div>}
        <dl className="grid sm:grid-cols-2 gap-4 mt-6">
          <div><dt className="hint">When</dt><dd className="font-semibold text-lg">{formatStudio(a.startsAt, "cccc d LLLL yyyy")}<br />{formatStudio(a.startsAt, "HH:mm")}–{formatStudio(a.endsAt, "HH:mm")} (Europe/London)</dd></div>
          <div><dt className="hint">With</dt><dd className="font-semibold text-lg">{a.artist.displayName}</dd></div>
          <div><dt className="hint">Quoted</dt><dd>{a.quotedPence ? formatPence(a.quotedPence) : "—"}</dd></div>
          {a.creditAppliedPence > 0 && <div><dt className="hint">Studio credit applied</dt><dd className="text-acid-deep font-semibold">{formatPence(a.creditAppliedPence)} off your balance on the day</dd></div>}
          {a.finalPricePence != null && <div><dt className="hint">Final price</dt><dd>{formatPence(a.finalPricePence)}</dd></div>}
          <div><dt className="hint">Deposit</dt><dd>{formatPence(a.depositPence)} · {paid ? <span className="text-acid-deep font-semibold">received {formatStudio(paid.verifiedAt ?? paid.createdAt)}</span> : <span className="text-danger font-semibold">outstanding</span>}</dd></div>
        </dl>
        {a.status === "PENDING_DEPOSIT" && a.clientId === p.userId && (
          <div className="mt-6 card p-4 bg-surface-muted">
            <h2 className="text-xl font-bold">Pay your deposit</h2>
            {stripeConfigured() ? <form action={`/my/bookings/${a.id}/pay`} method="post"><button className="btn btn-primary mt-3">Pay {formatPence(a.depositPence)} by card</button></form> : (
              <div className="mt-2 text-sm space-y-1">
                <p>Card payments are not connected in this environment. Bank transfer details:</p>
                <p><strong>Reference to quote:</strong> {a.reference}</p>
                <p>Your booking is confirmed only once the studio has verified the payment on its bank statement. Your slot is held until {a.holdExpiresAt ? formatStudio(a.holdExpiresAt) : "the hold expires"}; contact us if you need longer.</p>
              </div>
            )}
          </div>
        )}
        {a.artistId === p.artistProfileId && a.artistId && <div className="mt-6"><CompleteAppointmentForm appointmentId={a.id} status={a.status} suggestedPence={a.quotedPence ?? 0} /></div>}
        {a.status === "CONFIRMED" && <div className="mt-6"><Alert tone="success">Confirmed. Your consent forms will open here before your appointment (Phase 2). Please read your guides below.</Alert></div>}
        <h2 className="text-xl font-bold mt-8">Your guides</h2>
        <ul className="mt-2 grid sm:grid-cols-2 gap-2">{docs.map((d) => <li key={d.id} className="card p-3"><Link href={`/guides/${d.templateKey}`} className="font-semibold underline-offset-4 hover:underline">{d.title}</Link><p className="hint">v{d.version}</p></li>)}</ul>
        <h2 className="text-xl font-bold mt-8">Payments</h2>
        <table className="data mt-2"><thead><tr><th>Date</th><th>Purpose</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>{a.payments.map((x) => <tr key={x.id}><td>{formatStudio(x.createdAt)}</td><td>{x.purpose.toLowerCase()}</td><td>{x.method.replace("_", " ").toLowerCase()}</td><td>{formatPence(x.amountPence)}</td><td>{x.status.toLowerCase()}</td></tr>)}{a.payments.length === 0 && <tr><td colSpan={5} className="opacity-60">No payments recorded.</td></tr>}</tbody></table>
      </div>
    </>
  );
}
