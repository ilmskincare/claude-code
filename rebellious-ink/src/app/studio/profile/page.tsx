import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { PageHeader, Empty } from "@/components/ui";
import { RateCardForm, PriceList } from "@/components/rate-card-form";

export default async function StudioProfile() {
  const p = await requirePrincipal("/studio/profile");
  if (!p.artistProfileId) return <Empty>No practitioner profile on this account.</Empty>;
  const profile = await db.artistProfile.findUniqueOrThrow({ where: { id: p.artistProfileId }, include: { priceList: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } });
  return (<>
    <PageHeader title="My profile and rates" intro="What you charge, what you do and don't do, and anything the desk should know when a client calls. Public fields appear on your artist page." />
    <div className="grid lg:grid-cols-2 gap-6"><RateCardForm profile={profile} canToggleBooks /><PriceList artistId={profile.id} items={profile.priceList} piercer={profile.kind === "PIERCER"} /></div>
  </>);
}
