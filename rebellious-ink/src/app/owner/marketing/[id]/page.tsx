import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { marketingAudience } from "@/lib/marketing";
import { PageHeader, BackLink } from "@/components/ui";
import { CampaignForm, SendControls } from "@/components/marketing-forms";

export default async function Campaign({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("studio.manage");
  const { id } = await params;
  const c = await db.marketingCampaign.findUnique({ where: { id } });
  if (!c) notFound();
  const audience = c.audience as { artistId?: string | null };
  const [artists, recipients] = await Promise.all([db.artistProfile.findMany({ select: { id: true, displayName: true }, orderBy: { displayName: "asc" } }), marketingAudience({ artistId: audience?.artistId ?? null })]);
  return (<>
    <BackLink href="/owner/marketing">Marketing</BackLink>
    <PageHeader title={c.name} />
    <div className="grid lg:grid-cols-[1fr_20rem] gap-6">{c.status === "sent" ? <section className="card p-5"><h2 className="text-xl font-bold">{c.subject}</h2><pre className="whitespace-pre-wrap mt-3 text-sm">{c.body}</pre></section> : <CampaignForm campaign={{ ...c, audience }} artists={artists} />}<SendControls id={c.id} recipients={recipients.length} status={c.status} /></div>
  </>);
}
