import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { PageHeader, BackLink } from "@/components/ui";
import { HotspotEditor } from "@/components/design-forms";
import { signedUrl } from "@/lib/storage";
export default async function MySheetPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await requirePrincipal(); const { id } = await params;
  const sheet = await db.flashSheet.findUnique({ where: { id }, include: { designs: { where: { status: { not: "RETIRED" } }, orderBy: { sortOrder: "asc" } } } });
  if (!sheet || sheet.artistId !== p.artistProfileId) notFound();
  return (<><BackLink href="/studio/flash">My flash</BackLink><PageHeader title={sheet.title} intro={`${sheet.designs.length} design${sheet.designs.length === 1 ? "" : "s"} marked`} /><HotspotEditor sheetId={sheet.id} imageUrl={signedUrl(sheet.imageKey, 3600)} existing={sheet.designs.map((d) => ({ id: d.id, title: d.title, x: d.hotspotX ?? 0, y: d.hotspotY ?? 0, w: d.hotspotW ?? 0, h: d.hotspotH ?? 0 }))} /></>);
}
