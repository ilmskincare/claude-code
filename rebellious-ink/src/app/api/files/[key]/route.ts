import { NextResponse, type NextRequest } from "next/server";
import { getObject, verifySignedUrl } from "@/lib/storage";
import { db } from "@/lib/db";

const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", pdf: "application/pdf", svg: "image/svg+xml" };
/** Content type from the asset record, otherwise from the key's extension (product photos, flash). */
function mimeFor(key: string, recorded?: string | null) {
  return recorded ?? MIME[key.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}

/** Serves a private object only with a valid, unexpired HMAC signature. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  const exp = Number(req.nextUrl.searchParams.get("exp"));
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!verifySignedUrl(key, exp, sig)) return new NextResponse("Link expired or invalid", { status: 403 });
  const asset = await db.imageAsset.findUnique({ where: { storageKey: key } });
  if (asset?.scanStatus === "FLAGGED") return new NextResponse("File quarantined", { status: 403 });
  try {
    const bytes = await getObject(key);
    return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": mimeFor(key, asset?.mimeType), "Cache-Control": "private, max-age=60", "Content-Disposition": `inline; filename="${(asset?.originalName ?? "file").replace(/"/g, "")}"` } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
