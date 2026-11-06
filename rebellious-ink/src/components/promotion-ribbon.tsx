import Link from "next/link";

/** Corner ribbon for an artist card or page. Wrap the host in `relative overflow-hidden`. */
export function PromotionRibbon({ title }: { title: string }) {
  return <span className="ribbon" title={title}>{title}</span>;
}

export function StudioPromotionBanner({ promotions }: { promotions: { id: string; title: string; details: string | null; code: string | null; endsAt: Date | null }[] }) {
  if (promotions.length === 0) return null;
  return (
    <div className="promo-banner" role="region" aria-label="Current offers">
      <div className="mx-auto max-w-6xl px-4 py-2 text-sm flex flex-wrap gap-x-6 gap-y-1 items-center">
        {promotions.map((p) => <span key={p.id}><strong className="uppercase tracking-wide">{p.title}</strong>{p.details ? <span className="opacity-90"> · {p.details}</span> : null}{p.code ? <span> · quote <strong>{p.code}</strong></span> : null}{p.endsAt ? <span className="opacity-75"> · until {p.endsAt.toLocaleDateString("en-GB")}</span> : null}</span>)}
        <Link href="/enquire" className="underline ml-auto">Start an enquiry</Link>
      </div>
    </div>
  );
}
