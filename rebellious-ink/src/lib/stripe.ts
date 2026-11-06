import Stripe from "stripe";
import { env, stripeConfigured } from "./env";
import { db } from "./db";
import { confirmAppointmentWithDeposit } from "./booking";
import { sendEmail } from "./email";
import { formatPence } from "./money";
import { formatStudio } from "./time";

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!stripeConfigured()) throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.");
  if (!client) client = new Stripe(env().STRIPE_SECRET_KEY!, { apiVersion: "2026-09-30.clover" as Stripe.LatestApiVersion });
  return client;
}

/** Create a Checkout Session for a deposit. Idempotent per appointment. */
export async function createDepositCheckout(appointmentId: string) {
  const appt = await db.appointment.findUnique({ where: { id: appointmentId }, include: { client: true, artist: true } });
  if (!appt) throw new Error("Appointment not found");
  if (appt.status !== "PENDING_DEPOSIT") throw new Error("Deposit is not outstanding on this appointment.");
  const base = env().APP_BASE_URL;
  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      customer_email: appt.client.email,
      client_reference_id: appt.reference,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: appt.depositPence,
          product_data: { name: `Deposit — ${appt.reference} with ${appt.artist.displayName}`, description: `Appointment ${formatStudio(appt.startsAt)} (Europe/London)` },
        },
      }],
      metadata: { appointmentId: appt.id, reference: appt.reference },
      payment_intent_data: { metadata: { appointmentId: appt.id, reference: appt.reference } },
      success_url: `${base}/my/bookings/${appt.id}?paid=1`,
      cancel_url: `${base}/my/bookings/${appt.id}?cancelled=1`,
      expires_at: Math.floor(Math.min(appt.holdExpiresAt?.getTime() ?? Date.now() + 30 * 60000, Date.now() + 30 * 60000) / 1000),
    },
    { idempotencyKey: `deposit-${appt.id}-${appt.depositPence}` },
  );
  await db.payment.upsert({
    where: { providerRef: session.id },
    create: { appointmentId: appt.id, clientId: appt.clientId, purpose: "DEPOSIT", method: "CARD_STRIPE", status: "PENDING", amountPence: appt.depositPence, providerRef: session.id, idempotencyKey: `deposit-${appt.id}` },
    update: {},
  });
  return session;
}

/**
 * Handle a verified Stripe event. The caller has already checked the signature.
 * Duplicate events are ignored via the WebhookEvent unique index.
 */
export async function handleStripeEvent(event: Stripe.Event) {
  const inserted = await db.webhookEvent.createMany({
    data: [{ provider: "stripe", eventId: event.id, type: event.type, payload: event as unknown as object }],
    skipDuplicates: true,
  });
  if (inserted.count === 0) return { outcome: "duplicate" as const };

  let outcome = "ignored";
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const appointmentId = session.metadata?.appointmentId;
      if (appointmentId && session.payment_status === "paid") {
        const result = await db.$transaction((tx) => confirmAppointmentWithDeposit(tx, {
          appointmentId,
          amountPence: session.amount_total ?? 0,
          method: "CARD_STRIPE",
          providerRef: session.id,
          providerEventId: event.id,
          actorLabel: "System: Stripe webhook",
        }));
        outcome = result.alreadyProcessed ? "already_processed" : "confirmed";
        if (!result.alreadyProcessed) await sendConfirmationEmail(appointmentId);
      }
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await db.payment.updateMany({ where: { providerRef: session.id, status: "PENDING" }, data: { status: "FAILED", failureReason: event.type } });
      outcome = "payment_failed";
    } else if (event.type === "charge.refunded") {
      outcome = "refund_noted";
    }
    await db.webhookEvent.update({ where: { provider_eventId: { provider: "stripe", eventId: event.id } }, data: { processedAt: new Date(), outcome } });
    return { outcome };
  } catch (err) {
    await db.webhookEvent.update({ where: { provider_eventId: { provider: "stripe", eventId: event.id } }, data: { processedAt: new Date(), outcome: `error: ${(err as Error).message}` } });
    throw err;
  }
}

export async function sendConfirmationEmail(appointmentId: string) {
  const appt = await db.appointment.findUnique({ where: { id: appointmentId }, include: { client: true, artist: true } });
  if (!appt) return;
  const when = formatStudio(appt.startsAt);
  await sendEmail({
    to: appt.client.email,
    userId: appt.clientId,
    templateKey: "booking.confirmed",
    subject: `Booking confirmed — ${appt.reference}`,
    text: `Your appointment with ${appt.artist.displayName} is confirmed for ${when}.\nReference: ${appt.reference}\nDeposit received: ${formatPence(appt.depositPence)}.\n\nYour preparation guide and consent forms will be available in your portal: ${env().APP_BASE_URL}/my/bookings/${appt.id}`,
    html: `<p>Your appointment with <strong>${appt.artist.displayName}</strong> is confirmed for <strong>${when}</strong>.</p><p>Reference: <strong>${appt.reference}</strong><br/>Deposit received: ${formatPence(appt.depositPence)}</p><p><a href="${env().APP_BASE_URL}/my/bookings/${appt.id}">View your booking</a></p>`,
    payload: { appointmentId: appt.id, reference: appt.reference },
  });
}
