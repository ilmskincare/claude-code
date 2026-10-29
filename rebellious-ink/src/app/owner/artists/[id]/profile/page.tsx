import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { PageHeader, BackLink } from "@/components/ui";
import { RateCardForm, PriceList } from "@/components/rate-card-form";
import { PortfolioManager } from "@/components/portfolio-manager";
import { listPortfolio } from "@/lib/portfolio";
import { signedUrl } from "@/lib/storage";

export default async function OwnerArtistProfile({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("roster.manage");
  const { id } = await params;
  const profile = await db.artistProfile.findUnique({ where: { id }, include: { priceList: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } });
  if (!profile) notFound();
  const items = await listPortfolio(profile.id);
  return (<>
    <BackLink href="/owner/artists">Artists</BackLink>
    <PageHeader title={`${profile.displayName}: profile and rates`} />
    <div className="grid lg:grid-cols-2 gap-6"><RateCardForm profile={profile} canToggleBooks /><PriceList artistId={profile.id} items={profile.priceList} piercer={profile.kind === "PIERCER"} /></div>
    <section className="mt-10"><h2 className="text-2xl font-bold mb-3">Portfolio</h2><PortfolioManager ownerView artistId={profile.id} items={items.map((i) => ({ id: i.id, url: signedUrl(i.asset.storageKey, 3600), caption: i.caption, styleTags: i.styleTags, placement: i.placement, isHealed: i.isHealed, isCover: i.isCover, published: Boolean(i.publishedAt), hasPermission: i.asset.permissions.some((x) => x.granted) }))} /></section>
  </>);
}
