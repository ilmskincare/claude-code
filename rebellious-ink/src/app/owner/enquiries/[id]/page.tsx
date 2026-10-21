import Link from "next/link";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { loadRequestFor } from "@/lib/enquiries";
import { EnquirySummary } from "@/components/enquiry-summary";
import { Thread } from "@/components/thread";
import { QuoteForm } from "@/components/quote-form";
import { BackLink } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { OwnerEnquiryTools } from "./tools";

export default async function OwnerEnquiry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await requirePrincipal();
  const { request: r } = await loadRequestFor(p, id);
  const artists = await db.artistProfile.findMany({ select: { id: true, displayName: true, kind: true }, orderBy: { displayName: "asc" } });
  return (<>
    <BackLink href="/owner/enquiries">Enquiries</BackLink>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <EnquirySummary request={r} showClient />
        <OwnerEnquiryTools requestId={r.id} currentArtistId={r.artistId} artists={artists} draftQuotes={r.quotes.filter((q) => q.status === "DRAFT").map((q) => ({ id: q.id, version: q.version, amountPence: q.amountPence }))} />
        <section className="card p-5"><h2 className="text-xl font-bold mb-2">Quotes</h2>
          {r.quotes.length === 0 ? <p className="opacity-60 mb-3">No quote yet.</p> : <ul className="space-y-1 mb-3 text-sm">{r.quotes.map((q) => <li key={q.id}>v{q.version} · {formatPence(q.amountPence)} (deposit {formatPence(q.depositPence)}) · <span className="badge badge-outline">{q.status.toLowerCase()}</span></li>)}</ul>}
          {r.artistId && ["NEW", "NEEDS_INFORMATION", "IN_DISCUSSION", "QUOTED", "AWAITING_ACCEPTANCE"].includes(r.status) && <QuoteForm requestId={r.id} />}
          {r.appointments.map((a) => <p key={a.id} className="mt-2">Appointment <Link href={`/owner/bookings/${a.id}`} className="underline">{a.reference}</Link> · {a.status.replace(/_/g, " ").toLowerCase()}</p>)}
        </section>
      </div>
      <Thread requestId={r.id} meId={p.userId} canInternal messages={(r.conversation?.messages ?? []).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
    </div>
  </>);
}
