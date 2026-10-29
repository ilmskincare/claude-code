import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { flashSettings } from "@/lib/flash";
import { PageHeader, BackLink } from "@/components/ui";
import { DesignForm } from "@/components/design-forms";
export default async function NewDesign() {
  await requireCapability("roster.manage");
  const [artists, s] = await Promise.all([db.artistProfile.findMany({ where: { kind: { not: "APPRENTICE" } }, orderBy: { displayName: "asc" }, select: { id: true, displayName: true } }), flashSettings()]);
  return (<><BackLink href="/owner/flash">Flash catalogue</BackLink><PageHeader title="Add a design" /><DesignForm artists={artists} defaults={{ small: s.smallPence, palm: s.palmPence, apprenticeSmall: s.apprenticeSmallPence, apprenticePalm: s.apprenticePalmPence }} palmEnabled={s.palmEnabled} /></>);
}
