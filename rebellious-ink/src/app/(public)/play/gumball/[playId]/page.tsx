import { notFound } from "next/navigation";
import { playFor } from "@/lib/gumball";
import { getPrincipal } from "@/lib/session";
import { getVisitorId } from "@/lib/visitor";
import { flashSettings } from "@/lib/flash";
import { signedUrl } from "@/lib/storage";
import { BackLink } from "@/components/ui";
import { GumballReveal } from "@/components/gumball-reveal";

export default async function GumballResult({ params }: { params: Promise<{ playId: string }> }) {
  const { playId } = await params;
  const [p, visitorId] = await Promise.all([getPrincipal(), getVisitorId()]);
  const found = await playFor(playId, visitorId, p?.userId ?? null);
  if (!found || !found.play.design) notFound();
  const { play, settings, maxCm } = found;
  const d = play.design!;
  const flash = await flashSettings();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <BackLink href="/play/gumball">Gumball machine</BackLink>
      <GumballReveal playId={play.id} title={d.title} artistName={d.artist.displayName} artistSlug={d.artist.slug} imageUrl={signedUrl(d.imageKey, 3600)} hotspot={{ x: d.hotspotX, y: d.hotspotY, w: d.hotspotW, h: d.hotspotH }} pricePence={settings.pricePence} depositPence={Math.min(settings.pricePence, settings.depositPence)} maxCm={maxCm} placements={flash.fixedPlacements} signedIn={Boolean(p)} alreadyBooked={play.status === "BOOKED"} shareUrl={`/api/play/gumball/${play.id}/share`} />
    </div>
  );
}
