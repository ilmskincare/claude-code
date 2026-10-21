import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { flashSettings } from "@/lib/flash";
import { PageHeader, BackLink } from "@/components/ui";
import { DesignForm } from "@/components/design-forms";
import { signedUrl } from "@/lib/storage";
export default async function EditDesign({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("roster.manage");
  const { id } = await params;
  const [d, artists, s] = await Promise.all([db.design.findUnique({ where: { id } }), db.artistProfile.findMany({ where: { kind: { not: "APPRENTICE" } }, orderBy: { displayName: "asc" }, select: { id: true, displayName: true } }), flashSettings()]);
  if (!d) notFound();
  return (<><BackLink href="/owner/flash">Flash catalogue</BackLink><PageHeader title={d.title} intro={`Status: ${d.status.toLowerCase()}`} /><DesignForm artists={artists} design={{ ...d, imageUrl: signedUrl(d.imageKey, 3600) }} defaults={{ small: s.smallPence, palm: s.palmPence, apprenticeSmall: s.apprenticeSmallPence, apprenticePalm: s.apprenticePalmPence }} /></>);
}
