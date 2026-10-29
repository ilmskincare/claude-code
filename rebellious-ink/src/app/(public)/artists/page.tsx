/* eslint-disable @next/next/no-img-element -- images are served through short-lived signed URLs that next/image cannot optimise */
import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { signedUrl } from "@/lib/storage";
import { livePromotions } from "@/lib/promotions";
import { PromotionRibbon } from "@/components/promotion-ribbon";

export const metadata = { title: "Artists" };

export default async function ArtistsPage() {
  const [artists, promos] = await Promise.all([db.artistProfile.findMany({ where: { isPublished: true, isHouse: false }, include: { portfolioItems: { where: { publishedAt: { not: null } }, include: { asset: true }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 3 }, supervisor: true }, orderBy: { displayName: "asc" } }), livePromotions()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="Our artists and piercers" intro="Every image here is genuine client work published with that client's separate permission. Nothing is AI-generated or retouched to change the result." />
      <ul className="grid gap-6 md:grid-cols-2">
        {artists.map((a) => (
          <li key={a.id} className={`card p-5 relative overflow-hidden ${promos.byArtist.get(a.id) ? "pt-10" : ""}`}>
            {promos.byArtist.get(a.id) && <PromotionRibbon title={promos.byArtist.get(a.id)!.title} />}
            {/* With a ribbon in the corner the status badge drops under the name so nothing sits beneath the band. */}
            <div className={promos.byArtist.get(a.id) ? "flex flex-col items-start gap-2 pr-24" : "flex items-start justify-between gap-3"}>
              <div className="flex items-center gap-3">{a.avatarKey && <img src={signedUrl(a.avatarKey, 3600)} alt="" className="w-16 h-16 rounded-full object-cover bg-bone shrink-0" />}<div><h2 className="text-2xl font-bold"><Link href={`/artists/${a.slug}`}>{a.displayName}</Link></h2><p className="hint">{a.kind === "APPRENTICE" ? `Apprentice · supervised by ${a.supervisor?.displayName ?? "a senior artist"}` : a.kind.replace("_", " ").toLowerCase()}</p></div></div>
              {a.acceptsEnquiries ? <span className="badge badge-acid">Taking enquiries</span> : <span className="badge badge-muted">Books closed</span>}
            </div>
            <p className="mt-3 opacity-85">{a.bio}</p>
            {promos.byArtist.get(a.id) && <p className="mt-2 text-sm"><span className="badge badge-acid mr-2">Offer</span>{promos.byArtist.get(a.id)!.title}{promos.byArtist.get(a.id)!.details ? ` · ${promos.byArtist.get(a.id)!.details}` : ""}</p>}
            <p className="mt-2 text-sm">{a.styles.map((s) => <span key={s} className="badge badge-outline mr-1">{s}</span>)}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {a.portfolioItems.map((p) => <img key={p.id} src={signedUrl(p.asset.storageKey, 3600)} alt={p.caption ?? ""} className="aspect-square object-cover rounded-lg" />)}
            </div>
            <div className="mt-4 flex gap-2"><Link href={`/artists/${a.slug}`} className="btn btn-secondary">Portfolio</Link>{a.acceptsEnquiries && <Link href={`/enquire?artist=${a.slug}`} className="btn btn-primary">Enquire with {a.displayName.split(" ")[0]}</Link>}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
