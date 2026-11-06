import { NextResponse, type NextRequest } from "next/server";
import { env, stripeWebhookConfigured } from "@/lib/env";
import { handleStripeEvent, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/** Verifies the Stripe signature against STRIPE_WEBHOOK_SECRET before anything is trusted. Raw body required. */
export async function POST(req: NextRequest) {
  if (!stripeWebhookConfigured()) return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const raw = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, env().STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }
  try {
    const result = await handleStripeEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    console.error("stripe webhook failed", err);
    return NextResponse.json({ error: "Processing failed; Stripe will retry" }, { status: 500 });
  }
}
