import { NextResponse, type NextRequest } from "next/server";
import { sendDailyDigest } from "@/lib/digest";
import { env } from "@/lib/env";

/** Scheduled by Vercel Cron (vercel.json): the owners' morning digest. */
export async function GET(req: NextRequest) {
  const secret = env().CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const r = await sendDailyDigest();
  return NextResponse.json({ ok: true, sent: r.sent, to: r.to.length, waiting: r.data.waiting.length, fresh: r.data.fresh.length, unpaid: r.data.unpaid.length, today: r.data.today.length });
}
