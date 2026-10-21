/* eslint-disable @next/next/no-img-element -- images are served through short-lived signed URLs that next/image cannot optimise */
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { PageHeader, Alert, Empty } from "@/components/ui";
import { signedUrl } from "@/lib/storage";

export default async function Portfolio() {
  const p = await requirePrincipal("/studio/portfolio");
  if (!p.artistProfileId) return null;
  const items = await db.portfolioItem.findMany({ where: { artistId: p.artistProfileId }, include: { asset: { include: { permissions: true } } }, orderBy: { sortOrder: "asc" } });
  return (<>
    <PageHeader title="My portfolio" intro="Public items need the client's separate publication permission on the image. Private references never appear here." />
    <Alert tone="info">Uploading and publishing new portfolio items with permission capture is ticket P1-16; this page currently shows what is on record.</Alert>
    {items.length === 0 ? <Empty>No portfolio items yet.</Empty> : <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">{items.map((i) => <li key={i.id} className="card overflow-hidden"><img src={signedUrl(i.asset.storageKey)} alt={i.caption ?? ""} className="aspect-square object-cover w-full" /><div className="p-2 text-xs">{i.publishedAt ? <span className="badge badge-acid">Public</span> : <span className="badge badge-muted">Private</span>} {i.asset.permissions.some((x) => x.purpose === "PORTFOLIO_PUBLICATION" && x.granted && !x.withdrawnAt) ? "· permission granted" : "· no publication permission"}</div></li>)}</ul>}
  </>);
}
