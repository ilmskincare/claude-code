import Link from "next/link";
import { requirePrincipal } from "@/lib/session";
import { loadRequestFor } from "@/lib/enquiries";
import { EnquirySummary } from "@/components/enquiry-summary";
import { Thread } from "@/components/thread";
import { QuoteCard } from "./quote-card";
import { BackLink, Alert } from "@/components/ui";

export default async function MyEnquiry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await requirePrincipal();
  const { request: r } = await loadRequestFor(p, id);
  const openQuote = r.quotes.find((q) => q.status === "SENT");
  const accepted = r.quotes.find((q) => q.status === "ACCEPTED");
  return (
    <>
      <BackLink href="/my">My enquiries</BackLink>
      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <div className="space-y-6">
          <EnquirySummary request={r} showClient={false} />
          {openQuote && <QuoteCard quote={openQuote} artistName={r.artist?.displayName ?? ""} />}
          {r.status === "AWAITING_DEPOSIT" && accepted && <Alert tone="warn">You accepted quote v{accepted.version}. <Link href={`/my/enquiries/${r.id}/book`} className="underline font-semibold">Choose your appointment time and pay the deposit</Link> to confirm.</Alert>}
          {r.appointments.map((a) => <Alert key={a.id} tone={a.status === "CONFIRMED" ? "success" : "info"}>Appointment {a.reference}: <Link href={`/my/bookings/${a.id}`} className="underline">view booking</Link></Alert>)}
        </div>
        <Thread requestId={r.id} meId={p.userId} canInternal={false} messages={(r.conversation?.messages ?? []).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
      </div>
    </>
  );
}
