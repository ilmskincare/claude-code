import { requireCapability } from "@/lib/session";
import { allReports, rangeFor, PRESETS, type Preset } from "@/lib/reports";
import { PageHeader } from "@/components/ui";
import { formatPence } from "@/lib/money";

const LABEL: Record<Preset, string> = { this_week: "This week", this_month: "This month", last_month: "Last month", last_30: "Last 30 days", this_year: "This year", custom: "Custom dates" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ preset?: string; from?: string; to?: string }> }) {
  await requireCapability("finance.view_studio");
  const sp = await searchParams;
  const preset = (PRESETS as readonly string[]).includes(sp.preset ?? "") ? (sp.preset as Preset) : "this_month";
  const range = rangeFor(preset, sp.from, sp.to);
  const reports = await allReports(range);
  const qs = `preset=${preset}${sp.from ? `&from=${encodeURIComponent(sp.from)}` : ""}${sp.to ? `&to=${encodeURIComponent(sp.to)}` : ""}`;
  return (<>
    <PageHeader title="Reports" intro={`Enquiries, response times, bookings, takings, games, marketing, stock, apprentices and clients for ${range.label}. Every table downloads as a CSV for a spreadsheet. Stock is always as of now.`} />
    <form method="get" className="card p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div><label className="field" htmlFor="preset">Period</label><select id="preset" name="preset" className="select" defaultValue={preset}>{PRESETS.map((p) => <option key={p} value={p}>{LABEL[p]}</option>)}</select></div>
      <div><label className="field" htmlFor="from">From (custom)</label><input id="from" name="from" type="date" className="input" defaultValue={sp.from ?? ""} /></div>
      <div><label className="field" htmlFor="to">To (custom)</label><input id="to" name="to" type="date" className="input" defaultValue={sp.to ?? ""} /></div>
      <button className="btn btn-primary">Run</button>
    </form>
    <div className="grid lg:grid-cols-2 gap-6">
      {reports.map((rep) => (
        <section key={rep.key} className="card p-4">
          <div className="flex items-start justify-between gap-3 mb-2"><div><h2 className="text-xl font-bold">{rep.title}</h2><p className="hint">{rep.blurb}</p></div><a className="btn btn-secondary shrink-0" href={`/owner/reports/export?report=${rep.key}&${qs}`}>Download CSV</a></div>
          {rep.rows.length === 0 ? <p className="opacity-60 text-sm">Nothing in this period.</p> : (
            <div className="overflow-x-auto"><table className="data"><thead><tr>{rep.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>
              {rep.rows.map((row, i) => <tr key={i} className={String(row[0]) === "All" ? "font-bold" : ""}>{row.map((v, j) => <td key={j}>{rep.money?.includes(j) && typeof v === "number" ? formatPence(v) : v}</td>)}</tr>)}
            </tbody></table></div>
          )}
        </section>
      ))}
    </div>
  </>);
}
