import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { PageHeader, Stat, Alert } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { formatStudio } from "@/lib/time";

export default async function Earnings() {
  const p = await requirePrincipal("/studio/earnings");
  if (!p.artistProfileId) return null;
  const [payments, model] = await Promise.all([
    db.payment.findMany({ where: { status: "SUCCEEDED", appointment: { artistId: p.artistProfileId } }, include: { appointment: { select: { reference: true } } }, orderBy: { verifiedAt: "desc" }, take: 50 }),
    p.membershipId ? db.compensationModel.findFirst({ where: { membershipId: p.membershipId, effectiveFrom: { lte: new Date() }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }] }, orderBy: { effectiveFrom: "desc" } }) : null,
  ]);
  const total = payments.reduce((s, x) => s + x.amountPence, 0);
  return (<>
    <PageHeader title="My earnings" intro="Only your own statements. Other artists' figures and contracts are never shown here." />
    <div className="grid sm:grid-cols-3 gap-4 mb-6">
      <Stat label="Verified payments on my bookings" value={formatPence(total)} />
      <Stat label="My arrangement" value={model ? model.type.replace(/_/g, " ").toLowerCase() : "not set"} hint={model ? (model.type === "CHAIR_RENT_WEEKLY" ? `${formatPence(model.weeklyRentPence ?? 0)} per week` : `${model.artistPercent}% artist / ${model.studioPercent}% studio`) : "Ask the owner"} />
      <Stat label="Effective from" value={model ? model.effectiveFrom.toLocaleDateString("en-GB") : "—"} />
    </div>
    <Alert tone="info">Weekly statements, rent invoices and commission breakdowns arrive in Phase 3. Deposits shown here are client payments held by the studio, not yet your settled income.</Alert>
    <table className="data mt-6"><thead><tr><th>Date</th><th>Booking</th><th>Purpose</th><th>Method</th><th>Amount</th></tr></thead><tbody>{payments.map((x) => <tr key={x.id}><td>{formatStudio(x.verifiedAt ?? x.createdAt)}</td><td>{x.appointment?.reference}</td><td>{x.purpose.toLowerCase()}</td><td>{x.method.replace("_", " ").toLowerCase()}</td><td>{formatPence(x.amountPence)}</td></tr>)}</tbody></table>
  </>);
}
