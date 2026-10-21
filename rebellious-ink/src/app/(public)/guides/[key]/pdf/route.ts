import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { renderDocumentPdf } from "@/lib/pdf/document-pdf";

export const runtime = "nodejs";

/** Branded A4 PDF of the current version of a guide. */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  const doc = await db.documentTemplateVersion.findFirst({ where: { templateKey: key, isCurrent: true } });
  if (!doc) return new NextResponse("Not found", { status: 404 });
  const { buffer, sha256 } = await renderDocumentPdf(doc);
  return new NextResponse(new Uint8Array(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="rebellious-ink-${key}-v${doc.version}.pdf"`, "X-Document-SHA256": sha256, "Cache-Control": "private, max-age=300" } });
}
