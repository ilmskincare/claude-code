import { NextResponse, type NextRequest } from "next/server";
import { readLocalObject, storageDriver } from "@/lib/storage";

const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Development only: serves product photos written to ./storage by the local storage driver. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  if (storageDriver() !== "local") return new NextResponse("Not found", { status: 404 });
  const { key } = await ctx.params;
  const joined = key.map(decodeURIComponent).join("/");
  if (joined.includes("..")) return new NextResponse("Not found", { status: 404 });
  try {
    const bytes = await readLocalObject(joined);
    const ext = joined.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": MIME[ext] ?? "application/octet-stream", "Cache-Control": "public, max-age=3600" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
