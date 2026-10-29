import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { PageHeader, BackLink } from "@/components/ui";
import { HotspotEditor } from "@/components/design-forms";
import { signedUrl } from "@/lib/storage";
export default async function SheetPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("roster.manage");
  const { id } = await params;
  const sheet = await db.flashSheet.findUnique({ where: { id }, include: { artist: true, designs: { where: { status: { not: "RETIRED" } }, orderBy: { sortOrder: "asc" } } } });
  if (!sheet) notFound();
  return (<><BackLink href="/owner/flash">Flash catalogue</BackLink><PageHeader title={sheet.title} intro={`${sheet.artist.displayName} · ${sheet.designs.length} design${sheet.designs.length === 1 ? "" : "s"} marked`} /><HotspotEditor sheetId={sheet.id} imageUrl={signedUrl(sheet.imageKey, 3600)} existing={sheet.designs.map((d) => ({ id: d.id, title: d.title, x: d.hotspotX ?? 0, y: d.hotspotY ?? 0, w: d.hotspotW ?? 0, h: d.hotspotH ?? 0 }))} /></>);
}
