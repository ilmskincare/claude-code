import Link from "next/link";
import { notFound } from "next/navigation";
import { designById } from "@/lib/flash";
import { getPrincipal } from "@/lib/session";
import { BackLink } from "@/components/ui";
import { DesignImage } from "@/components/design-image";
import { BookDesignForm } from "@/components/book-design-form";
import { signedUrl } from "@/lib/storage";

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [found, p] = await Promise.all([designById(id), getPrincipal()]);
  if (!found) notFound();
  const { design: d, prices, settings } = found;
  const apprentices = d.artist.supervisees.map((a) => ({ id: a.id, displayName: a.displayName }));
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <BackLink href="/flash">All flash</BackLink>
      <div className="grid md:grid-cols-[1fr_380px] gap-8">
        <div>
          <DesignImage src={signedUrl(d.imageKey, 3600)} alt={`${d.title} by ${d.artist.displayName}`} hotspot={{ x: d.hotspotX, y: d.hotspotY, w: d.hotspotW, h: d.hotspotH }} className="w-full aspect-square rounded-xl" />
          <h1 className="text-4xl font-bold mt-4">{d.title}</h1>
          <p className="hint mt-1">By <Link href={`/artists/${d.artist.slug}`} className="underline">{d.artist.displayName}</Link>{d.theme ? ` · ${d.theme}` : ""} · {d.colourMode === "COLOUR" ? "colour" : "black"} · {d.repeatable ? "repeatable design" : "one-off: tattooed once, then retired"}{d.sheet ? ` · from the sheet "${d.sheet.title}"` : ""}</p>
          {d.status === "BOOKED" && <p className="badge badge-muted mt-3">Booked</p>}
          <p className="mt-4 opacity-85">Every flash tattoo includes a free touch-up once healed. You will get a reference number as soon as you book, then your artist confirms the exact placement and size in your private thread.</p>
        </div>
        <aside className="card p-5 h-fit md:sticky md:top-4">
          <h2 className="text-xl font-bold mb-3">Book this design</h2>
          <BookDesignForm designId={d.id} title={d.title} artistName={d.artist.displayName} palmEnabled={settings.palmEnabled} prices={prices} deposits={{ small: settings.depositSmallPence, palm: settings.depositPalmPence, apprentice: settings.apprenticeDepositPence }} sizes={{ smallMaxCm: settings.smallMaxCm, palmMaxCm: settings.palmMaxCm }} apprentices={apprentices} fixedPlacements={settings.fixedPlacements} quotePlacements={settings.quotePlacements} signedIn={Boolean(p)} isOneOff={!d.repeatable} unavailable={d.status === "BOOKED"} />
        </aside>
      </div>
    </div>
  );
}
