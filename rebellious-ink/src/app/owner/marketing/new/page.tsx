import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { PageHeader, BackLink } from "@/components/ui";
import { CampaignForm } from "@/components/marketing-forms";

export default async function NewCampaign() {
  await requireCapability("studio.manage");
  const artists = await db.artistProfile.findMany({ select: { id: true, displayName: true }, orderBy: { displayName: "asc" } });
  return (<><BackLink href="/owner/marketing">Marketing</BackLink><PageHeader title="New campaign" /><CampaignForm artists={artists} /></>);
}
