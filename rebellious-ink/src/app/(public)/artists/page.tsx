/* eslint-disable @next/next/no-img-element -- images are served through short-lived signed URLs that next/image cannot optimise */
import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { signedUrl } from "@/lib/storage";

export const metadata = { title: "Artists" };

export default async function ArtistsPage() {
  const artists = await db.artistProfile.findMany({ where: { isPublished: true }, include: { portfolioItems: { where: { publishedAt: { not: null } }, include: { asset: true }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 3 }, supervisor: true }, orderBy: { displayName: "asc" } });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="Our artists and piercers" intro="Every image here is genuine client work published with that client's separate permission. Nothing is AI-generated or retouched to change the result." />
      <ul className="grid gap-6 md:grid-cols-2">
        {artists.map((a) => (
          <li key={a.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="text-2xl font-bold"><Link href={`/artists/${a.slug}`}>{a.displayName}</Link></h2><p className="hint">{a.kind === "APPRENTICE" ? `Apprentice · supervised by ${a.supervisor?.displayName ?? "a senior artist"}` : a.kind.replace("_", " ").toLowerCase()}</p></div>
              {a.acceptsEnquiries ? <span className="badge badge-acid">Taking enquiries</span> : <span className="badge badge-muted">Books closed</span>}
            </div>
            <p className="mt-3 opacity-85">{a.bio}</p>
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
