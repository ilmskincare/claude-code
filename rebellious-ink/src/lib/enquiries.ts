import { z } from "zod";
import { notFound } from "next/navigation";
import { db, type Tx } from "./db";
import { allocateReference } from "./references";
import { assertTransition, label } from "./enquiry-state";
import { audit } from "./audit";
import { sendEmail } from "./email";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { assertAllowedUpload, newStorageKey, putObject } from "./storage";
import { env } from "./env";
import type { EnquiryStatus, ServiceCategory, EnquirySource } from "@/generated/prisma/enums";

export const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  artistSlug: z.string().trim().max(80).optional().or(z.literal("")),
  category: z.enum(["TATTOO", "CONSULTATION", "PIERCING", "FLASH", "MULTI_SESSION_PROJECT"]),
  placement: z.string().trim().max(120).optional().or(z.literal("")),
  bodyMapZone: z.string().trim().max(60).optional().or(z.literal("")),
  sizeCm: z.coerce.number().int().min(1).max(200).optional(),
  style: z.string().trim().max(80).optional().or(z.literal("")),
  colour: z.enum(["colour", "black_and_grey", "undecided"]).optional(),
  isCoverUp: z.coerce.boolean().optional(),
  hasScarConcern: z.coerce.boolean().optional(),
  description: z.string().trim().min(10).max(4000),
  budgetBand: z.string().trim().max(40).optional().or(z.literal("")),
  preferredDays: z.array(z.string().max(12)).max(7).optional(),
  availabilityNote: z.string().trim().max(500).optional().or(z.literal("")),
  accessNeeds: z.string().trim().max(1000).optional().or(z.literal("")),
  declaredOver18: z.coerce.boolean(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  source: z.enum(["WEBSITE", "WALK_IN", "TELEPHONE", "INSTAGRAM", "FACEBOOK", "WHATSAPP", "REFERRAL", "OTHER"]).optional(),
  privacyAccepted: z.coerce.boolean(),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export function ageOn(dob: Date, at: Date) {
  let age = at.getUTCFullYear() - dob.getUTCFullYear();
  const m = at.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && at.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

const TATTOO_CATEGORIES: ServiceCategory[] = ["TATTOO", "FLASH", "MULTI_SESSION_PROJECT"];

/**
 * Create an enquiry from the public form or from the desk (staff-originated).
 * Statutory block: no tattoo enquiry for anyone under 18 — not overridable.
 */
export async function createEnquiry(input: EnquiryInput, files: File[], opts: { createdBy?: Principal | null; ip?: string | null } = {}) {
  if (!input.privacyAccepted) throw new ValidationError("Please confirm you have read the privacy notice.");
  const dob = input.dateOfBirth ? new Date(input.dateOfBirth + "T00:00:00Z") : null;
  if (TATTOO_CATEGORIES.includes(input.category)) {
    if (!input.declaredOver18) throw new ValidationError("Tattooing anyone under 18 is prohibited by law in the UK. We cannot accept this enquiry.");
    if (dob && ageOn(dob, new Date()) < 18) throw new ValidationError("Tattooing anyone under 18 is prohibited by law in the UK. We cannot accept this enquiry.");
  }
  if (input.category === "PIERCING" && !input.declaredOver18) {
    throw new ValidationError("Piercing enquiries are currently accepted for adults (18+) only until the studio publishes its reviewed under-18 piercing policy.");
  }
  for (const f of files) assertAllowedUpload(f.type, f.size);

  const studio = await db.studio.findFirstOrThrow();
  const artist = input.artistSlug ? await db.artistProfile.findUnique({ where: { slug: input.artistSlug } }) : null;
  if (input.artistSlug && (!artist || !artist.isPublished || !artist.acceptsEnquiries)) throw new ValidationError("That artist is not currently taking enquiries.");

  const created = await db.$transaction(async (tx) => {
    const client = await tx.user.upsert({
      where: { email: input.email.toLowerCase() },
      create: { email: input.email.toLowerCase(), name: input.name, phone: input.phone || null, clientProfile: { create: { dateOfBirth: dob, phone: input.phone || null, accessNeeds: input.accessNeeds || null } } },
      update: { name: input.name, phone: input.phone || undefined },
    });
    await tx.clientProfile.upsert({ where: { userId: client.id }, create: { userId: client.id, dateOfBirth: dob, accessNeeds: input.accessNeeds || null }, update: { dateOfBirth: dob ?? undefined, accessNeeds: input.accessNeeds || undefined } });
    const reference = await allocateReference(tx, "ENQ");
    const request = await tx.bookingRequest.create({
      data: {
        reference,
        studioId: studio.id,
        clientId: client.id,
        createdById: opts.createdBy?.userId ?? null,
        artistId: artist?.id ?? null,
        category: input.category,
        source: (input.source ?? "WEBSITE") as EnquirySource,
        placement: input.placement || null,
        bodyMapZone: input.bodyMapZone || null,
        sizeCm: input.sizeCm ?? null,
        style: input.style || null,
        colour: input.colour ?? null,
        isCoverUp: Boolean(input.isCoverUp),
        hasScarConcern: Boolean(input.hasScarConcern),
        description: input.description,
        budgetBand: input.budgetBand || null,
        preferredDays: input.preferredDays ?? [],
        availabilityNote: input.availabilityNote || null,
        accessNeeds: input.accessNeeds || null,
        declaredOver18: input.declaredOver18,
        dateOfBirth: dob,
        expiresAt: new Date(Date.now() + 60 * 86400000),
        conversation: { create: {} },
        statusEvents: { create: { toStatus: "NEW", actorLabel: opts.createdBy ? `Desk: ${opts.createdBy.name ?? opts.createdBy.email}` : "Client", note: "Enquiry submitted" } },
      },
    });
    await tx.privacyPreference.create({ data: { userId: client.id, purpose: "MARKETING_EMAIL", granted: false, source: "portal" } }).catch(() => undefined);
    for (const f of files) {
      const key = newStorageKey(`enquiries/${request.id}`, f.name);
      await putObject(key, new Uint8Array(await f.arrayBuffer()), f.type);
      await tx.imageAsset.create({ data: { uploadedById: client.id, requestId: request.id, storageKey: key, originalName: f.name.slice(0, 200), mimeType: f.type, sizeBytes: f.size, visibility: "PRIVATE_REFERENCE", scanStatus: "PENDING" } });
    }
    await audit({ actorId: opts.createdBy?.userId ?? client.id, actorLabel: opts.createdBy ? "Desk" : "Client", action: "enquiry.created", entityType: "BookingRequest", entityId: request.id, after: { reference, category: input.category, artistId: artist?.id ?? null }, ip: opts.ip }, tx);
    return { request, client };
  });

  await sendEmail({
    to: created.client.email,
    userId: created.client.id,
    templateKey: "enquiry.acknowledged",
    subject: `We've received your enquiry — ${created.request.reference}`,
    text: `Thanks ${input.name}. Your enquiry reference is ${created.request.reference}. ${artist ? artist.displayName : "The studio"} will reply through your portal. Sign in any time at ${env().APP_BASE_URL}/login using this email address.`,
    html: `<p>Thanks ${escapeHtml(input.name)}.</p><p>Your enquiry reference is <strong>${created.request.reference}</strong>.</p><p>${artist ? escapeHtml(artist.displayName) : "The studio"} will reply through your portal. <a href="${env().APP_BASE_URL}/login">Sign in</a> any time using this email address.</p>`,
    payload: { requestId: created.request.id },
  });
  return created.request;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Record-level access: owner/manager/reception see all; artists only their assigned; clients only their own. */
export function canAccessRequest(p: Principal, r: { clientId: string; artistId: string | null }) {
  if (can(p, "enquiries.view_all")) return true;
  if (can(p, "enquiries.view_assigned") && p.artistProfileId && r.artistId === p.artistProfileId) return true;
  return r.clientId === p.userId;
}

export async function loadRequestFor(p: Principal, requestId: string) {
  const r = await db.bookingRequest.findUnique({
    where: { id: requestId },
    include: {
      client: { select: { id: true, name: true, email: true, phone: true } },
      artist: true,
      service: true,
      attachments: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
      quotes: { orderBy: { version: "desc" } },
      appointments: { orderBy: { startsAt: "asc" }, include: { payments: true } },
      conversation: { include: { messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true } }, attachments: true } } } },
    },
  });
  if (!r || !canAccessRequest(p, r)) notFound(); // 404 not 403: do not leak that the record exists
  const isClient = r.clientId === p.userId && !can(p, "enquiries.view_all") && !(p.artistProfileId && r.artistId === p.artistProfileId);
  if (isClient && r.conversation) {
    r.conversation.messages = r.conversation.messages.filter((m) => m.visibility === "CLIENT_VISIBLE");
    r.quotes = r.quotes.filter((q) => q.status !== "DRAFT");
  }
  return { request: r, isClient };
}

export async function transitionRequest(tx: Tx, requestId: string, to: EnquiryStatus, actor: { userId?: string | null; label: string }, note?: string) {
  const r = await tx.bookingRequest.findUniqueOrThrow({ where: { id: requestId } });
  assertTransition(r.status, to);
  await tx.bookingRequest.update({ where: { id: requestId }, data: { status: to } });
  await tx.enquiryStatusEvent.create({ data: { requestId, fromStatus: r.status, toStatus: to, actorId: actor.userId ?? null, actorLabel: actor.label, note: note ?? `${label(r.status)} → ${label(to)}` } });
  await audit({ actorId: actor.userId ?? null, actorLabel: actor.label, action: "enquiry.status_changed", entityType: "BookingRequest", entityId: requestId, before: { status: r.status }, after: { status: to }, reason: note }, tx);
  return r;
}

export async function assignArtist(p: Principal, requestId: string, artistId: string, reason: string) {
  if (!can(p, "enquiries.assign")) throw new ForbiddenError();
  await db.$transaction(async (tx) => {
    const r = await tx.bookingRequest.findUniqueOrThrow({ where: { id: requestId } });
    await tx.bookingRequest.update({ where: { id: requestId }, data: { artistId } });
    await audit({ actorId: p.userId, actorLabel: `Staff: ${p.name ?? p.email}`, action: "enquiry.assigned", entityType: "BookingRequest", entityId: requestId, before: { artistId: r.artistId }, after: { artistId }, reason }, tx);
  });
}

export async function postMessage(p: Principal, requestId: string, body: string, visibility: "CLIENT_VISIBLE" | "INTERNAL_ONLY" = "CLIENT_VISIBLE", files: File[] = []) {
  const text = body.trim();
  if (text.length > 5000) throw new ValidationError("Message must be under 5000 characters.");
  if (text.length < 1 && files.length === 0) throw new ValidationError("Write a message or attach an image.");
  if (files.length > 6) throw new ValidationError("Attach up to six files per message.");
  for (const f of files) assertAllowedUpload(f.type, f.size);
  const r = await db.bookingRequest.findUnique({ where: { id: requestId }, include: { conversation: true, client: true, artist: { include: { user: true } } } });
  if (!r || !canAccessRequest(p, r) || !r.conversation) throw new NotFoundError("Enquiry not found");
  const isClient = r.clientId === p.userId && !can(p, "enquiries.view_all") && r.artistId !== p.artistProfileId;
  if (isClient && visibility === "INTERNAL_ONLY") throw new ForbiddenError();
  const message = await db.$transaction(async (tx) => {
    const m = await tx.message.create({ data: { conversationId: r.conversation!.id, senderId: p.userId, body: text || (files.length ? `${files.length} image${files.length === 1 ? "" : "s"} attached` : ""), visibility } });
    for (const f of files) {
      const key = newStorageKey(`enquiries/${r.id}/messages`, f.name);
      await putObject(key, new Uint8Array(await f.arrayBuffer()), f.type);
      await tx.imageAsset.create({ data: { uploadedById: p.userId, requestId: r.id, messageId: m.id, storageKey: key, originalName: f.name.slice(0, 200), mimeType: f.type, sizeBytes: f.size, visibility: "PRIVATE_REFERENCE", scanStatus: "PENDING" } });
    }
    if (!isClient && r.status === "NEW") await transitionRequest(tx, r.id, "IN_DISCUSSION", { userId: p.userId, label: `Staff: ${p.name ?? p.email}` }, "First reply sent");
    return m;
  });
  // Notify the other party (never includes the message body in the subject line).
  const recipient = isClient ? r.artist?.user : r.client;
  if (recipient && visibility === "CLIENT_VISIBLE") {
    await sendEmail({
      to: recipient.email, userId: recipient.id, templateKey: "enquiry.new_message",
      subject: `New message on ${r.reference}`,
      text: `There is a new message on enquiry ${r.reference}. Sign in to reply: ${env().APP_BASE_URL}/login`,
      html: `<p>There is a new message on enquiry <strong>${r.reference}</strong>.</p><p><a href="${env().APP_BASE_URL}/login">Sign in to reply</a></p>`,
      payload: { requestId: r.id },
    }).catch((e) => console.error("notify failed", e));
  }
  return message;
}
