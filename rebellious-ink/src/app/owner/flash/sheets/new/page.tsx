import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { PageHeader, BackLink } from "@/components/ui";
import { SheetUploadForm } from "@/components/design-forms";
export default async function NewSheet() {
  await requireCapability("roster.manage");
  const artists = await db.artistProfile.findMany({ where: { kind: { not: "APPRENTICE" } }, orderBy: { displayName: "asc" }, select: { id: true, displayName: true } });
  return (<><BackLink href="/owner/flash">Flash catalogue</BackLink><PageHeader title="Upload a flash sheet" intro="Upload the whole sheet, then drag a box over each design to make it bookable." /><SheetUploadForm artists={artists} /></>);
}
