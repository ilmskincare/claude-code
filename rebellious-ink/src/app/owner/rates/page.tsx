import Link from "next/link";
import { requireCapability } from "@/lib/session";
import { deskReference } from "@/lib/profiles";
import { PageHeader } from "@/components/ui";
import { formatPence } from "@/lib/money";

const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export default async function DeskReference() {
  await requireCapability("enquiries.view_all");
  const artists = await deskReference();
  return (<>
    <PageHeader title="Ask the desk" intro="Everything customer service needs to answer a call: rates, styles, boundaries, hours and private notes. Updated live by the practitioners themselves." />
    <div className="grid lg:grid-cols-2 gap-4">
      {artists.map((a) => (
        <section key={a.id} className="card p-5">
          <div className="flex items-start justify-between gap-2"><h2 className="text-xl font-bold">{a.displayName}</h2><span className={`badge ${a.acceptsEnquiries ? "badge-acid" : "badge-muted"}`}>{a.acceptsEnquiries ? "Books open" : "Books closed"}</span></div>
          <p className="hint">{a.kind.replace("_", " ").toLowerCase()}{a.kind === "APPRENTICE" && a.supervisor ? ` · supervised by ${a.supervisor.displayName}` : ""}{a.instagramHandle ? ` · @${a.instagramHandle}` : ""}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><dt className="hint">Hourly</dt><dd>{a.hourlyRateMinPence != null ? `${formatPence(a.hourlyRateMinPence)}${a.hourlyRateMaxPence ? `–${formatPence(a.hourlyRateMaxPence)}` : ""}` : "not set"}</dd></div>
            <div><dt className="hint">Day rate</dt><dd>{a.dayRatePence != null ? formatPence(a.dayRatePence) : "not set"}</dd></div>
            <div><dt className="hint">Minimum</dt><dd>{a.minimumChargePence != null ? formatPence(a.minimumChargePence) : "not set"}</dd></div>
            <div><dt className="hint">Hours</dt><dd>{a.availabilityRules.length ? a.availabilityRules.map((r) => `${DAY[r.weekday - 1]} ${hhmm(r.startMinute)}–${hhmm(r.endMinute)}${r.acceptsWalkIns ? " (walk-ins)" : ""}`).join(", ") : "not set"}</dd></div>
            {a.kind === "PIERCER" ? <><div><dt className="hint">Piercings offered</dt><dd>{a.piercingsOffered.join(", ") || "not set"}</dd></div><div><dt className="hint">Not offered</dt><dd>{a.piercingsNotOffered.join(", ") || "—"}</dd></div></> : <><div><dt className="hint">Styles</dt><dd>{a.styles.join(", ") || "not set"}</dd></div><div><dt className="hint">Doesn&apos;t do</dt><dd>{a.stylesNotOffered.join(", ") || "—"}</dd></div></>}
            <div><dt className="hint">Won&apos;t tattoo</dt><dd>{a.placementsDeclined.join(", ") || "—"}</dd></div>
            <div><dt className="hint">Won&apos;t do</dt><dd>{a.wontDo || "—"}</dd></div>
          </dl>
          {a.priceList.length > 0 && <ul className="mt-3 text-sm border-t border-graphite pt-2">{a.priceList.map((i) => <li key={i.id} className="flex justify-between"><span>{i.name}{i.includesJewellery ? " (jewellery incl.)" : ""}</span><span>{formatPence(i.pricePence)}{i.priceToPence ? `–${formatPence(i.priceToPence)}` : ""}</span></li>)}</ul>}
          {a.receptionNotes && <div className="mt-3 rounded-lg bg-steel p-3 text-sm"><p className="text-warn font-semibold text-xs uppercase tracking-wide">Desk notes (private)</p><p className="whitespace-pre-wrap">{a.receptionNotes}</p></div>}
          <p className="mt-3 text-sm"><Link href={`/owner/artists/${a.id}/profile`} className="underline">Edit</Link> · <Link href={`/artists/${a.slug}`} className="underline">Public page</Link></p>
        </section>
      ))}
    </div>
  </>);
}
