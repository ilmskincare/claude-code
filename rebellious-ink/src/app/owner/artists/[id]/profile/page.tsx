import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { PageHeader, BackLink } from "@/components/ui";
import { RateCardForm, PriceList } from "@/components/rate-card-form";

export default async function OwnerArtistProfile({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("roster.manage");
  const { id } = await params;
  const profile = await db.artistProfile.findUnique({ where: { id }, include: { priceList: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } });
  if (!profile) notFound();
  return (<>
    <BackLink href="/owner/artists">Artists</BackLink>
    <PageHeader title={`${profile.displayName}: profile and rates`} />
    <div className="grid lg:grid-cols-2 gap-6"><RateCardForm profile={profile} canToggleBooks /><PriceList artistId={profile.id} items={profile.priceList} piercer={profile.kind === "PIERCER"} /></div>
  </>);
}
