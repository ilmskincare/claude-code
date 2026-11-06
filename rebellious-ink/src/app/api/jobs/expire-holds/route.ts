import { NextResponse, type NextRequest } from "next/server";
import { expireLapsedHolds } from "@/lib/booking";
import { env } from "@/lib/env";

/** Scheduled by Vercel Cron (vercel.json). Releases pending appointments whose deposit window lapsed. */
export async function GET(req: NextRequest) {
  const secret = env().CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const released = await expireLapsedHolds();
  return NextResponse.json({ ok: true, released });
}
