import { notFound } from "next/navigation";
import { trioPlayFor } from "@/lib/trio";
import { getPrincipal } from "@/lib/session";
import { getVisitorId } from "@/lib/visitor";
import { BackLink } from "@/components/ui";
import { TrioReveal } from "@/components/trio-machines";

export default async function TrioResult({ params }: { params: Promise<{ playId: string }> }) {
  const { playId } = await params;
  const [p, visitorId] = await Promise.all([getPrincipal(), getVisitorId()]);
  const found = await trioPlayFor(playId, visitorId, p?.userId ?? null);
  if (!found) notFound();
  const { play, result, artists, maxCm, placements } = found;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <BackLink href="/play/trio">Three machines</BackLink>
      <TrioReveal playId={play.id} result={result} artists={artists} placements={placements} pricePence={result.pricePence} depositPence={result.depositPence} maxCm={maxCm} signedIn={Boolean(p)} alreadyBooked={play.status === "BOOKED"} />
    </div>
  );
}
