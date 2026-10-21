/* eslint-disable @next/next/no-img-element -- images are served through short-lived signed URLs that next/image cannot optimise */
import { EnquiryBadge } from "./ui";
import { signedUrl } from "@/lib/storage";
import { formatStudio } from "@/lib/time";
import type { BookingRequest, ImageAsset, EnquiryStatusEvent, ArtistProfile, Design } from "@/generated/prisma/client";
import { DesignImage } from "./design-image";

export function EnquirySummary({ request, showClient }: { request: BookingRequest & { attachments: ImageAsset[]; statusEvents: EnquiryStatusEvent[]; artist: ArtistProfile | null; design?: Design | null; client: { name: string | null; email: string; phone: string | null } }; showClient: boolean }) {
  const r = request;
  const rows: [string, string | null | undefined][] = [
    ["Service", r.category.replace(/_/g, " ").toLowerCase()],
    ["Artist", r.artist?.displayName ?? "Match me with an artist"],
    ["Placement", [r.bodyMapZone, r.placement].filter(Boolean).join(" — ")],
    ["Size", r.sizeCm ? `${r.sizeCm} cm` : null],
    ["Style / colour", [r.style, r.colour?.replace(/_/g, " ")].filter(Boolean).join(" · ")],
    ["Cover-up / scar", [r.isCoverUp ? "Cover-up" : null, r.hasScarConcern ? "Scar concern disclosed" : null].filter(Boolean).join(", ")],
    ["Budget", r.budgetBand],
    ["Availability", [r.preferredDays.join(", "), r.availabilityNote].filter(Boolean).join(" · ")],
    ["Access needs", r.accessNeeds],
    ["Source", r.source.toLowerCase()],
  ];
  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="hint">Enquiry</p><h2 className="text-2xl font-bold">{r.reference}</h2></div><EnquiryBadge status={r.status} /></div>
      {showClient && <p className="mt-2"><strong>{r.client.name}</strong> · {r.client.email}{r.client.phone ? ` · ${r.client.phone}` : ""} · {r.declaredOver18 ? "Declared 18+" : <span className="text-danger font-semibold">Age not confirmed</span>}</p>}
      <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="hint">{k}</dt><dd>{v}</dd></div>)}
      </dl>
      {r.design && <div className="mt-4 card p-3 bg-surface-muted flex gap-3 items-center"><DesignImage src={signedUrl(r.design.imageKey, 3600)} alt={r.design.title} hotspot={{ x: r.design.hotspotX, y: r.design.hotspotY, w: r.design.hotspotW, h: r.design.hotspotH }} className="w-20 h-20 rounded-lg shrink-0" /><div className="text-sm"><p className="hint">Flash design</p><p className="font-bold">{r.design.title}</p><p>{r.designSize === "palm" ? "Palm" : "Small"} · {r.designTier === "apprentice" ? "apprentice (supervised)" : "artist"} tier · {r.design.repeatable ? "repeatable" : "one-off"}</p></div></div>}
      <p className="mt-4 whitespace-pre-wrap">{r.description}</p>
      {r.attachments.filter((a) => !a.messageId).length > 0 && <div className="mt-4"><p className="hint mb-2">Reference images from the enquiry (private)</p><div className="flex flex-wrap gap-2">{r.attachments.filter((a) => !a.messageId).map((a) => <a key={a.id} href={signedUrl(a.storageKey)} target="_blank" rel="noreferrer"><img src={signedUrl(a.storageKey)} alt={a.originalName} className="size-24 object-cover rounded-lg border border-border" /></a>)}</div></div>}
      <details className="mt-4"><summary className="cursor-pointer font-semibold">Status history</summary>
        <ol className="mt-2 text-sm space-y-1">{r.statusEvents.map((e) => <li key={e.id}><span className="opacity-60">{formatStudio(e.createdAt)}</span> · {e.actorLabel} · {e.note}</li>)}</ol>
      </details>
    </section>
  );
}
