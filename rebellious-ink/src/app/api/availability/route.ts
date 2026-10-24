import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { availableSlots } from "@/lib/booking";
import { getPrincipal } from "@/lib/session";
import { canAccessRequest } from "@/lib/enquiries";

const q = z.object({ requestId: z.string(), from: z.string(), to: z.string() });

/** Genuinely available slots for an accepted quote. Scoped to the enquiry's client/staff. */
export async function GET(req: NextRequest) {
  const p = await getPrincipal();
  if (!p) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = q.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const r = await db.bookingRequest.findUnique({ where: { id: parsed.data.requestId }, include: { quotes: { where: { status: "ACCEPTED" }, take: 1 }, service: true } });
  if (!r || !canAccessRequest(p, r) || !r.artistId || !r.quotes[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const total = r.quotes[0].estimatedMinutes + (r.service?.setupMinutes ?? 15) + (r.service?.cleanMinutes ?? 15);
  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (to.getTime() - from.getTime() > 45 * 86400000) return NextResponse.json({ error: "Range too large" }, { status: 400 });
  const slots = await availableSlots(r.artistId, from, to, total);
  return NextResponse.json({ durationMinutes: total, slots: slots.map((s) => ({ startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString() })) });
}
