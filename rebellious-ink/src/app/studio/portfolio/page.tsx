import { requirePrincipal } from "@/lib/session";
import { listPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/ui";
import { signedUrl } from "@/lib/storage";
import { PortfolioManager } from "@/components/portfolio-manager";

export default async function Portfolio() {
  const p = await requirePrincipal("/studio/portfolio");
  if (!p.artistProfileId) return null;
  const items = await listPortfolio(p.artistProfileId);
  return (<>
    <PageHeader title="My portfolio" intro="Photos of your work for your public page. A photo of a client's tattoo or piercing only goes on the site once their permission to publish is recorded; private references from enquiries never appear here." />
    <PortfolioManager artistId={p.artistProfileId} items={items.map((i) => ({ id: i.id, url: signedUrl(i.asset.storageKey, 3600), caption: i.caption, styleTags: i.styleTags, placement: i.placement, isHealed: i.isHealed, isCover: i.isCover, published: Boolean(i.publishedAt), hasPermission: i.asset.permissions.some((x) => x.granted) }))} />
  </>);
}
