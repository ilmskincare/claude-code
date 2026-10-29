import { NextResponse, type NextRequest } from "next/server";
import { getPrincipal } from "@/lib/session";
import { can } from "@/lib/rbac";
import { allReports, rangeFor, toCsv, PRESETS, type Preset } from "@/lib/reports";
import { audit } from "@/lib/audit";

/** CSV download of one report for the chosen period. Owners and managers only; every export is audited. */
export async function GET(req: NextRequest) {
  const p = await getPrincipal();
  if (!p || !can(p, "finance.view_studio")) return new NextResponse("Forbidden", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const preset = (PRESETS as readonly string[]).includes(sp.get("preset") ?? "") ? (sp.get("preset") as Preset) : "this_month";
  const range = rangeFor(preset, sp.get("from") ?? undefined, sp.get("to") ?? undefined);
  const key = sp.get("report") ?? "";
  const rep = (await allReports(range)).find((r) => r.key === key);
  if (!rep) return new NextResponse("Unknown report", { status: 404 });
  await audit({ actorId: p.userId, actorLabel: `Owner: ${p.name ?? p.email}`, action: "reports.exported", entityType: "Report", entityId: key, after: { range: range.label } });
  const name = `${key}-${range.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
  return new NextResponse(toCsv(rep), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" } });
}
