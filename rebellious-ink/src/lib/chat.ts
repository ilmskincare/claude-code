import { db } from "./db";
import { type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";
import { assertAllowedUpload, newStorageKey, putObject, signedUrl } from "./storage";
import { sendEmail } from "./email";
import { env } from "./env";
import { isPlaceholderEmail } from "./staff-auth";

/**
 * Chat. Four kinds of channel: the Studio channel (everyone on the team), the Management channel
 * (owners and studio managers), direct messages between two staff members, and client channels: a
 * client talking to one artist, started from the artist's "Message" button on the public site.
 * Owners and managers can read every channel, including direct and client ones, and the screen says
 * so. Clients only ever see their own client channels. Messages may carry image attachments.
 */
export const isStaff = (p: Principal) => p.roles.some((r) => r !== "CLIENT");
export const isManagement = (p: Principal) => p.roles.some((r) => r === "OWNER" || r === "STUDIO_MANAGER");
const MAX = 2000, MAX_FILES = 6;

export type ChannelKind = "STUDIO" | "MANAGEMENT" | "DIRECT" | "CLIENT";
type Person = { name: string | null; email: string; artistProfile: { displayName: string } | null };
type ChannelRow = { id: string; kind: ChannelKind; name: string; artistProfileId: string | null; members: { userId: string; lastReadAt: Date | null; user: Person }[] };
const memberInclude = { members: { include: { user: { select: { name: true, email: true, artistProfile: { select: { displayName: true } } } } } } } as const;
const senderSelect = { select: { name: true, email: true, artistProfile: { select: { displayName: true } } } } as const;
const personName = (u: Person) => u.artistProfile?.displayName ?? u.name ?? u.email;

export async function ensureChannels() {
  for (const [kind, name] of [["STUDIO", "Studio"], ["MANAGEMENT", "Management"]] as const) {
    if (!(await db.chatChannel.findFirst({ where: { kind } }))) await db.chatChannel.create({ data: { kind, name } });
  }
}

/** Everyone with an active staff membership, for starting a direct message. */
export async function staffDirectory() {
  const rows = await db.membership.findMany({ where: { status: "ACTIVE" }, include: { user: { select: { id: true, name: true, email: true, artistProfile: { select: { displayName: true, kind: true } } } } }, orderBy: { createdAt: "asc" } });
  return rows.filter((m) => m.roles.some((r) => r !== "CLIENT")).map((m) => ({ userId: m.user.id, name: personName(m.user), roles: m.roles, kind: m.user.artistProfile?.kind ?? null })).sort((a, b) => a.name.localeCompare(b.name));
}

function assertAccess(p: Principal, c: ChannelRow) {
  const member = c.members.some((m) => m.userId === p.userId);
  if (c.kind === "CLIENT") { if (!member && !isManagement(p)) throw new ForbiddenError(); return; }
  if (!isStaff(p)) throw new ForbiddenError();
  if (c.kind === "MANAGEMENT" && !isManagement(p)) throw new ForbiddenError();
  if (c.kind === "DIRECT" && !isManagement(p) && !member) throw new ForbiddenError();
}

export function channelTitle(c: ChannelRow, me: string) {
  if (c.kind === "STUDIO" || c.kind === "MANAGEMENT") return c.name;
  const others = c.members.filter((m) => m.userId !== me).map((m) => personName(m.user));
  return others.length ? others.join(", ") : c.members.map((m) => personName(m.user)).join(" and ");
}

/** The channels this person can open, with unread counts and the last line. Clients get only their own client channels. */
export async function listChannels(p: Principal) {
  const staff = isStaff(p), mgmt = isManagement(p);
  if (staff) await ensureChannels();
  const channels = await db.chatChannel.findMany({
    where: staff
      ? { OR: [{ kind: "STUDIO" }, ...(mgmt ? [{ kind: "MANAGEMENT" as const }] : []), { kind: "DIRECT", ...(mgmt ? {} : { members: { some: { userId: p.userId } } }) }, { kind: "CLIENT", ...(mgmt ? {} : { members: { some: { userId: p.userId } } }) }] }
      : { kind: "CLIENT", members: { some: { userId: p.userId } } },
    include: { ...memberInclude, messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: senderSelect } } },
  });
  const out = [];
  for (const c of channels) {
    const me = c.members.find((m) => m.userId === p.userId);
    const unread = await db.chatMessage.count({ where: { channelId: c.id, senderId: { not: p.userId }, ...(me?.lastReadAt ? { createdAt: { gt: me.lastReadAt } } : {}) } });
    const last = c.messages[0];
    out.push({ id: c.id, kind: c.kind as ChannelKind, title: channelTitle(c, p.userId), unread, last: last ? { body: (last.body || (last.attachments.length ? "Photo" : "")).slice(0, 80), at: last.createdAt, by: personName(last.sender) } : null, mine: c.kind === "STUDIO" || c.kind === "MANAGEMENT" || c.members.some((m) => m.userId === p.userId) });
  }
  const order: Record<ChannelKind, number> = { STUDIO: 0, MANAGEMENT: 1, DIRECT: 2, CLIENT: 3 };
  return out.sort((a, b) => order[a.kind] - order[b.kind] || (b.last?.at.getTime() ?? 0) - (a.last?.at.getTime() ?? 0));
}

export async function unreadTotal(p: Principal) {
  return (await listChannels(p)).reduce((n, c) => n + c.unread, 0);
}

/** Opens (or creates) the direct channel between the caller and another staff member. */
export async function openDirect(p: Principal, otherUserId: string) {
  if (!isStaff(p)) throw new ForbiddenError();
  if (otherUserId === p.userId) throw new ValidationError("Pick someone other than yourself.");
  const dir = await staffDirectory();
  if (!dir.some((d) => d.userId === otherUserId)) throw new ValidationError("That person is not on the team.");
  const existing = (await db.chatChannel.findMany({ where: { kind: "DIRECT", AND: [{ members: { some: { userId: p.userId } } }, { members: { some: { userId: otherUserId } } }] }, include: { members: true } })).find((c) => c.members.length === 2);
  if (existing) return existing;
  return db.chatChannel.create({ data: { kind: "DIRECT", name: "Direct message", members: { create: [{ userId: p.userId }, { userId: otherUserId }] } } });
}

/**
 * Opens (or creates) a client's channel with a published artist, from the "Message" button on the
 * public site. Any signed-in person may start one; the artist must be published and taking enquiries.
 */
export async function openClientChat(p: Principal, artistSlug: string) {
  const artist = await db.artistProfile.findUnique({ where: { slug: artistSlug }, select: { id: true, userId: true, displayName: true, isPublished: true, isHouse: true, acceptsEnquiries: true } });
  if (!artist || !artist.isPublished || artist.isHouse) throw new NotFoundError("Artist not found");
  if (artist.userId === p.userId) throw new ValidationError("That is your own profile.");
  const existing = await db.chatChannel.findFirst({ where: { kind: "CLIENT", artistProfileId: artist.id, members: { some: { userId: p.userId } } } });
  if (existing) return existing;
  if (!artist.acceptsEnquiries) throw new ValidationError(`${artist.displayName} is not taking new messages at the moment.`);
  return db.chatChannel.create({ data: { kind: "CLIENT", name: `Client chat: ${artist.displayName}`, artistProfileId: artist.id, members: { create: [{ userId: p.userId }, { userId: artist.userId }] } } });
}

const shape = (m: { id: string; body: string; attachments: string[]; createdAt: Date; senderId: string; sender: Person }, me: string) => ({ id: m.id, body: m.body, attachments: m.attachments.map((k) => signedUrl(k, 3600)), createdAt: m.createdAt, senderId: m.senderId, senderName: personName(m.sender), mine: m.senderId === me });

/** Messages in a channel (the latest 100, or everything after a point for polling). Reading marks the channel read for the caller. */
export async function channelMessages(p: Principal, channelId: string, after?: Date) {
  const c = await db.chatChannel.findUnique({ where: { id: channelId }, include: memberInclude });
  if (!c) throw new NotFoundError("Channel not found");
  assertAccess(p, c);
  const rows = after
    ? await db.chatMessage.findMany({ where: { channelId, createdAt: { gt: after } }, orderBy: { createdAt: "asc" }, take: 200, include: { sender: senderSelect } })
    : (await db.chatMessage.findMany({ where: { channelId }, orderBy: { createdAt: "desc" }, take: 100, include: { sender: senderSelect } })).reverse();
  await db.chatMember.upsert({ where: { channelId_userId: { channelId, userId: p.userId } }, create: { channelId, userId: p.userId, lastReadAt: new Date() }, update: { lastReadAt: new Date() } });
  return { channel: { id: c.id, kind: c.kind as ChannelKind, title: channelTitle(c, p.userId), members: c.members.map((m) => personName(m.user)) }, messages: rows.map((m) => shape(m, p.userId)) };
}

/** Sends a message with optional image attachments. In a client channel, a reply from staff emails the client a nudge (never the message text). */
export async function sendMessage(p: Principal, channelId: string, body: string, files: File[] = []) {
  const text = body.trim();
  const images = files.filter((f) => f && f.size > 0);
  if (!text && images.length === 0) throw new ValidationError("Write something or attach a photo.");
  if (text.length > MAX) throw new ValidationError(`Keep it under ${MAX} characters.`);
  if (images.length > MAX_FILES) throw new ValidationError(`Attach up to ${MAX_FILES} photos per message.`);
  const c = await db.chatChannel.findUnique({ where: { id: channelId }, include: memberInclude });
  if (!c) throw new NotFoundError("Channel not found");
  assertAccess(p, c);
  const keys: string[] = [];
  for (const f of images) {
    assertAllowedUpload(f.type, f.size);
    if (!f.type.startsWith("image/")) throw new ValidationError("Only photos can be attached here.");
    const key = newStorageKey(`chat/${channelId}`, f.name);
    await putObject(key, new Uint8Array(await f.arrayBuffer()), f.type);
    keys.push(key);
  }
  const m = await db.chatMessage.create({ data: { channelId, senderId: p.userId, body: text, attachments: keys } });
  await db.chatMember.upsert({ where: { channelId_userId: { channelId, userId: p.userId } }, create: { channelId, userId: p.userId, lastReadAt: m.createdAt }, update: { lastReadAt: m.createdAt } });
  if (c.kind === "CLIENT" && isStaff(p)) {
    const client = c.members.find((x) => x.userId !== p.userId);
    if (client && !isPlaceholderEmail(client.user.email)) {
      const link = `${env().APP_BASE_URL}/my/messages/${c.id}`;
      await sendEmail({ to: client.user.email, userId: client.userId, templateKey: "chat.reply", subject: `${p.name ?? "Your artist"} replied on Rebellious Ink`, text: `You have a new message from ${p.name ?? "your artist"} at Rebellious Ink. Read and reply here: ${link}`, html: `<p>You have a new message from ${p.name ?? "your artist"} at Rebellious Ink.</p><p><a href="${link}">Read and reply</a></p>`, payload: { channelId: c.id } }).catch(() => undefined);
    }
  }
  return m;
}
