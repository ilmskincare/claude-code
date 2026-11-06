/* eslint-disable @next/next/no-img-element -- short-lived signed URLs */
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { listChannels, postableAssets, bufferConfigured } from "@/lib/social";
import { signedUrl } from "@/lib/storage";
import { PageHeader, Alert } from "@/components/ui";
import { SocialPostForm, PublishButton } from "@/components/social-forms";
import { formatStudio } from "@/lib/time";

export default async function Social() {
  await requireCapability("portfolio.publish");
  const connected = bufferConfigured();
  const [assets, channels, posts] = await Promise.all([postableAssets(), listChannels().catch(() => []), db.socialPost.findMany({ include: { asset: true }, orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }], take: 50 })]);
  return (<>
    <PageHeader title="Social posts" intro="Draft captions, pick an image the client has agreed can be shared, and schedule through Buffer. Nothing goes out without a human pressing send." />
    {!connected && <div className="mb-4"><Alert tone="warn">Buffer is not connected. Set BUFFER_ACCESS_TOKEN (from publish.buffer.com/settings/api) and BUFFER_ORGANIZATION_ID to publish from here. Until then, copy the caption and download the image to post manually.</Alert></div>}
    <div className="grid lg:grid-cols-2 gap-6">
      <SocialPostForm assets={assets.map((a) => ({ id: a.assetId, url: signedUrl(a.asset.storageKey, 900), label: `${a.artist.displayName}: ${a.caption ?? ""}` }))} channels={channels} connected={connected} />
      <section className="card p-5"><h2 className="text-xl font-bold mb-3">Content calendar</h2>
        {posts.length === 0 ? <p className="opacity-60">No posts yet.</p> : <ul className="space-y-3">{posts.map((p) => <li key={p.id} className="flex gap-3 border-b border-graphite pb-3">{p.asset && <img src={signedUrl(p.asset.storageKey, 900)} alt="" className="size-16 object-cover rounded" />}<div className="flex-1 min-w-0"><p className="text-sm whitespace-pre-wrap line-clamp-3">{p.caption}</p><p className="hint">{p.scheduledFor ? formatStudio(p.scheduledFor) : "Queue"} · <span className={`badge ${p.status === "PUBLISHED" || p.status === "SCHEDULED" ? "badge-acid" : p.status === "FAILED" ? "badge-danger" : "badge-muted"}`}>{p.status.toLowerCase()}</span>{p.error ? ` · ${p.error}` : ""}</p></div>{p.status === "DRAFT" || p.status === "FAILED" ? <PublishButton id={p.id} connected={connected && p.channels.length > 0} /> : null}</li>)}</ul>}
      </section>
    </div>
  </>);
}
