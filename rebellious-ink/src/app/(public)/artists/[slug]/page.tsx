/* eslint-disable @next/next/no-img-element -- images are served through short-lived signed URLs that next/image cannot optimise */
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { signedUrl } from "@/lib/storage";
import { BackLink } from "@/components/ui";
import { livePromotions } from "@/lib/promotions";
import { PromotionRibbon } from "@/components/promotion-ribbon";

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await db.artistProfile.findUnique({ where: { slug }, include: { portfolioItems: { where: { publishedAt: { not: null } }, include: { asset: true }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] }, supervisor: true, availabilityRules: { where: { validFrom: null }, orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] }, priceList: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } });
  if (!a || !a.isPublished) notFound();
  const promo = (await livePromotions()).byArtist.get(a.id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <BackLink href="/artists">All artists</BackLink>
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center gap-4">{a.avatarKey && <img src={signedUrl(a.avatarKey, 3600)} alt={`${a.displayName} logo`} className="w-24 h-24 rounded-full object-cover bg-bone shrink-0" />}<h1 className="text-4xl font-bold">{a.displayName}</h1></div>
          <p className="hint mt-1">{a.kind === "APPRENTICE" ? `Apprentice · all procedures supervised by ${a.supervisor?.displayName}` : a.kind.replace("_", " ").toLowerCase()}{a.instagramHandle ? ` · @${a.instagramHandle}` : ""}</p>
          <p className="mt-4 text-lg opacity-85">{a.bio}</p>
          <p className="mt-3">{a.styles.map((s) => <span key={s} className="badge badge-outline mr-1">{s}</span>)}</p>
          <RateCard a={a} />
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
        <aside className={`card p-5 h-fit md:sticky md:top-4 relative overflow-hidden ${promo ? "pt-14" : ""}`}>
          {promo && <PromotionRibbon title={promo.title} />}
          <h2 className="text-xl font-bold">Work with {a.displayName.split(" ")[0]}</h2>
          {promo && <div className="mt-3 rounded-lg bg-acid/15 border border-acid p-3 text-sm"><p className="font-bold uppercase tracking-wide text-xs">Current offer</p><p className="font-semibold">{promo.title}</p>{promo.details && <p className="mt-1 opacity-90">{promo.details}</p>}{promo.code && <p className="mt-1">Quote <strong>{promo.code}</strong></p>}{promo.endsAt && <p className="hint mt-1">Until {promo.endsAt.toLocaleDateString("en-GB")}</p>}</div>}
          <p className="mt-2 opacity-80 text-sm">Send your idea and references. You will get a reference number straight away and a reply in your private thread.</p>
          {a.acceptsEnquiries ? <div className="mt-4 flex flex-col gap-2"><Link href={`/messages/start?artist=${a.slug}`} className="btn btn-primary w-full justify-center">Message {a.displayName.split(" ")[0]}</Link><Link href={`/enquire?artist=${a.slug}`} className="btn btn-secondary w-full justify-center">Start an enquiry</Link></div> : <p className="mt-4 badge badge-muted">Books currently closed</p>}
          <Hours rules={a.availabilityRules} />
        </aside>
      </div>
    </div>
  );
}

const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
function Hours({ rules }: { rules: { weekday: number; startMinute: number; endMinute: number; acceptsWalkIns: boolean; acceptsBookings: boolean }[] }) {
  if (rules.length === 0) return null;
  const walkIns = rules.filter((r) => r.acceptsWalkIns);
  return (
    <div className="mt-5 text-sm">
      <h3 className="font-bold">In the studio</h3>
      <ul className="mt-1 space-y-0.5">{rules.map((r, i) => <li key={i}>{DAY[r.weekday - 1]} {hhmm(r.startMinute)}–{hhmm(r.endMinute)}{r.acceptsWalkIns ? <span className="badge badge-acid ml-2">walk-ins</span> : null}</li>)}</ul>
      {walkIns.length > 0 && <p className="hint mt-2">Walk-ins are first come, first served and depend on the day. Booked work always takes priority.</p>}
    </div>
  );
}

function RateCard({ a }: { a: { kind: string; hourlyRateMinPence: number | null; hourlyRateMaxPence: number | null; dayRatePence: number | null; minimumChargePence: number | null; stylesNotOffered: string[]; wontDo: string | null; placementsDeclined: string[]; piercingsOffered: string[]; piercingsNotOffered: string[]; priceList: { id: string; name: string; pricePence: number; priceToPence: number | null; includesJewellery: boolean; durationMinutes: number | null }[] } }) {
  const gbp = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);
  const rates = [a.hourlyRateMinPence != null ? `Hourly from ${gbp(a.hourlyRateMinPence)}${a.hourlyRateMaxPence ? ` to ${gbp(a.hourlyRateMaxPence)}` : ""}` : null, a.dayRatePence != null ? `Day rate ${gbp(a.dayRatePence)}` : null, a.minimumChargePence != null ? `Minimum ${gbp(a.minimumChargePence)}` : null].filter(Boolean);
  const piercer = a.kind === "PIERCER";
  if (!rates.length && !a.wontDo && !a.placementsDeclined.length && !a.stylesNotOffered.length && !a.priceList.length && !a.piercingsOffered.length) return null;
  return (
    <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
      {rates.length > 0 && <div className="card p-4"><h3 className="font-bold">Rates</h3><ul className="mt-1">{rates.map((r) => <li key={r}>{r}</li>)}</ul><p className="hint mt-1">Guide only; every piece is quoted individually.</p></div>}
      {piercer && a.piercingsOffered.length > 0 && <div className="card p-4"><h3 className="font-bold">Piercings offered</h3><p className="mt-1">{a.piercingsOffered.join(", ")}</p>{a.piercingsNotOffered.length > 0 && <p className="hint mt-1">Not offered: {a.piercingsNotOffered.join(", ")}</p>}</div>}
      {!piercer && a.stylesNotOffered.length > 0 && <div className="card p-4"><h3 className="font-bold">Not my thing</h3><p className="mt-1">{a.stylesNotOffered.join(", ")}</p></div>}
      {(a.wontDo || a.placementsDeclined.length > 0) && <div className="card p-4"><h3 className="font-bold">Please note</h3>{a.wontDo && <p className="mt-1 whitespace-pre-wrap">{a.wontDo}</p>}{a.placementsDeclined.length > 0 && <p className="mt-1">Placements not offered: {a.placementsDeclined.join(", ")}</p>}</div>}
      {a.priceList.length > 0 && <div className="card p-4 sm:col-span-2"><h3 className="font-bold">Price list</h3><ul className="mt-1 divide-y divide-border">{a.priceList.map((i) => <li key={i.id} className="flex justify-between py-1"><span>{i.name}{i.includesJewellery ? <span className="hint"> · basic jewellery included</span> : null}{i.durationMinutes ? <span className="hint"> · {i.durationMinutes} min</span> : null}</span><span>{gbp(i.pricePence)}{i.priceToPence ? `–${gbp(i.priceToPence)}` : ""}</span></li>)}</ul></div>}
    </div>
  );
}
