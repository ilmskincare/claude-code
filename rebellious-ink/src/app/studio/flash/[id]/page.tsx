import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { flashSettings } from "@/lib/flash";
import { PageHeader, BackLink } from "@/components/ui";
import { DesignForm } from "@/components/design-forms";
import { signedUrl } from "@/lib/storage";
export default async function EditMyDesign({ params }: { params: Promise<{ id: string }> }) {
  const p = await requirePrincipal(); const { id } = await params;
  const [d, s] = await Promise.all([db.design.findUnique({ where: { id } }), flashSettings()]);
  if (!d || d.artistId !== p.artistProfileId) notFound();
  return (<><BackLink href="/studio/flash">My flash</BackLink><PageHeader title={d.title} intro={`Status: ${d.status.toLowerCase()}`} /><DesignForm artists={[]} fixedArtistId={p.artistProfileId!} design={{ ...d, imageUrl: signedUrl(d.imageKey, 3600) }} defaults={{ small: s.smallPence, palm: s.palmPence, apprenticeSmall: s.apprenticeSmallPence, apprenticePalm: s.apprenticePalmPence }} /></>);
}
