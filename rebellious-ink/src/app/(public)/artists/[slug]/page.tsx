/* eslint-disable @next/next/no-img-element -- images are served through short-lived signed URLs that next/image cannot optimise */
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { signedUrl } from "@/lib/storage";
import { BackLink } from "@/components/ui";

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await db.artistProfile.findUnique({ where: { slug }, include: { portfolioItems: { where: { publishedAt: { not: null } }, include: { asset: true }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] }, supervisor: true } });
  if (!a || !a.isPublished) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <BackLink href="/artists">All artists</BackLink>
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          <h1 className="text-4xl font-bold">{a.displayName}</h1>
          <p className="hint mt-1">{a.kind === "APPRENTICE" ? `Apprentice · all procedures supervised by ${a.supervisor?.displayName}` : a.kind.replace("_", " ").toLowerCase()}{a.instagramHandle ? ` · @${a.instagramHandle}` : ""}</p>
          <p className="mt-4 text-lg opacity-85">{a.bio}</p>
          <p className="mt-3">{a.styles.map((s) => <span key={s} className="badge badge-outline mr-1">{s}</span>)}</p>
          <h2 className="text-2xl font-bold mt-10 mb-4">Portfolio</h2>
          {a.portfolioItems.length === 0 ? <p className="opacity-70">Published work will appear here once clients have given permission.</p> : (
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {a.portfolioItems.map((p) => (
                <li key={p.id} className="card overflow-hidden">
                  <img src={signedUrl(p.asset.storageKey, 3600)} alt={p.caption ?? `Tattoo by ${a.displayName}`} className="aspect-square object-cover w-full" />
                  <div className="p-2 text-sm"><span className={`badge ${p.isHealed ? "badge-acid" : "badge-muted"} mr-2`}>{p.isHealed ? "Healed" : "Fresh"}</span>{p.caption}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="card p-5 h-fit md:sticky md:top-4">
          <h2 className="text-xl font-bold">Work with {a.displayName.split(" ")[0]}</h2>
          <p className="mt-2 opacity-80 text-sm">Send your idea and references. You will get a reference number straight away and a reply in your private thread.</p>
          {a.acceptsEnquiries ? <Link href={`/enquire?artist=${a.slug}`} className="btn btn-primary mt-4 w-full justify-center">Start an enquiry</Link> : <p className="mt-4 badge badge-muted">Books currently closed</p>}
        </aside>
      </div>
    </div>
  );
}
