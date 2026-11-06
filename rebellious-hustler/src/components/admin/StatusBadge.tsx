export function StatusBadge({ status }: { status: string }) {
  const cls = status === "PAID" || status === "LIVE" ? "badge-accent" : status === "FULFILLED" ? "badge-ok" : status === "REFUNDED" || status === "DRAFT" ? "badge-warn" : status === "CANCELLED" ? "badge-danger" : "badge-muted";
  return <span className={`badge ${cls}`}>{status.toLowerCase()}</span>;
}
