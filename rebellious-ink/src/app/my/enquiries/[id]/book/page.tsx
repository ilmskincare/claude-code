import { requirePrincipal } from "@/lib/session";
import { loadRequestFor } from "@/lib/enquiries";
import { upcomingSlots } from "@/lib/booking";
import { SlotPicker } from "./slot-picker";
import { BackLink, PageHeader, Alert } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { stripeConfigured } from "@/lib/env";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await requirePrincipal();
  const { request: r } = await loadRequestFor(p, id);
  const quote = r.quotes.find((q) => q.status === "ACCEPTED");
  if (r.status !== "AWAITING_DEPOSIT" || !quote || !r.artistId) return <Alert tone="warn">This enquiry is not ready to book. Check your messages.</Alert>;
  const total = quote.estimatedMinutes + (r.service?.setupMinutes ?? 15) + (r.service?.cleanMinutes ?? 15);
  const slots = await upcomingSlots(r.artistId, total);
  return (
    <>
      <BackLink href={`/my/enquiries/${r.id}`}>Back to enquiry</BackLink>
      <PageHeader title="Choose your time" intro={`Times shown are genuinely free in ${r.artist?.displayName}'s diary over the next six weeks (Europe/London). Your slot is held for 20 minutes while you pay the ${formatPence(quote.depositPence)} deposit.`} />
      {!stripeConfigured() && <Alert tone="warn">Card payments are not connected in this environment. Your booking will be created as awaiting deposit with bank-transfer instructions.</Alert>}
      <SlotPicker requestId={r.id} slots={slots.map((s) => s.startsAt.toISOString())} durationMinutes={quote.estimatedMinutes} />
    </>
  );
}
