import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getPrincipal } from "@/lib/session";
import { createDepositCheckout } from "@/lib/stripe";
import { stripeConfigured } from "@/lib/env";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const p = await getPrincipal();
  if (!p) return NextResponse.redirect(new URL("/login", req.url));
  const a = await db.appointment.findUnique({ where: { id } });
  if (!a || a.clientId !== p.userId) return new NextResponse("Not found", { status: 404 });
  if (!stripeConfigured()) return NextResponse.redirect(new URL(`/my/bookings/${id}`, req.url), 303);
  const session = await createDepositCheckout(id);
  return NextResponse.redirect(session.url!, 303);
}
