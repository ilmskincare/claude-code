import { db } from "./db";
import { type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";

/**
 * Staff chat. Three kinds of channel: the Studio channel (everyone on the team), the Management
 * channel (owners and studio managers) and direct messages between two staff members. Owners and
 * managers can read every channel, including direct messages, and the chat says so on screen.
 * Clients never see any of it. Messages are plain text, kept in the database, never emailed.
 */
export const isStaff = (p: Principal) => p.roles.some((r) => r !== "CLIENT");
export const isManagement = (p: Principal) => p.roles.some((r) => r === "OWNER" || r === "STUDIO_MANAGER");
const MAX = 2000;

type ChannelRow = { id: string; kind: "STUDIO" | "MANAGEMENT" | "DIRECT"; name: string; members: { userId: string; lastReadAt: Date | null; user: { name: string | null; email: string; artistProfile: { displayName: string } | null } }[] };
const memberInclude = { members: { include: { user: { select: { name: true, email: true, artistProfile: { select: { displayName: true } } } } } } } as const;
const personName = (u: { name: string | null; email: string; artistProfile: { displayName: string } | null }) => u.artistProfile?.displayName ?? u.name ?? u.email;

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
  if (!isStaff(p)) throw new ForbiddenError();
  if (c.kind === "MANAGEMENT" && !isManagement(p)) throw new ForbiddenError();
  if (c.kind === "DIRECT" && !isManagement(p) && !c.members.some((m) => m.userId === p.userId)) throw new ForbiddenError();
}

export function channelTitle(c: ChannelRow, me: string) {
  if (c.kind !== "DIRECT") return c.name;
  const others = c.members.filter((m) => m.userId !== me).map((m) => personName(m.user));
  return others.length ? others.join(", ") : c.members.map((m) => personName(m.user)).join(" and ");
}

/** The channels this person can open, with unread counts and the last line. */
export async function listChannels(p: Principal) {
  if (!isStaff(p)) return [];
  await ensureChannels();
  const mgmt = isManagement(p);
  const channels = await db.chatChannel.findMany({
    where: { OR: [{ kind: "STUDIO" }, ...(mgmt ? [{ kind: "MANAGEMENT" as const }] : []), { kind: "DIRECT", ...(mgmt ? {} : { members: { some: { userId: p.userId } } }) }] },
    include: { ...memberInclude, messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { name: true, email: true, artistProfile: { select: { displayName: true } } } } } } },
  });
  const out = [];
  for (const c of channels) {
    const me = c.members.find((m) => m.userId === p.userId);
    const unread = await db.chatMessage.count({ where: { channelId: c.id, senderId: { not: p.userId }, ...(me?.lastReadAt ? { createdAt: { gt: me.lastReadAt } } : {}) } });
    const last = c.messages[0];
    out.push({ id: c.id, kind: c.kind, title: channelTitle(c, p.userId), unread, last: last ? { body: last.body.slice(0, 80), at: last.createdAt, by: personName(last.sender) } : null, mine: c.kind !== "DIRECT" || c.members.some((m) => m.userId === p.userId) });
  }
  const order = { STUDIO: 0, MANAGEMENT: 1, DIRECT: 2 };
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

/** Messages in a channel (the latest 100, or everything after a point for polling). Reading marks the channel read for the caller. */
export async function channelMessages(p: Principal, channelId: string, after?: Date) {
  const c = await db.chatChannel.findUnique({ where: { id: channelId }, include: memberInclude });
  if (!c) throw new NotFoundError("Channel not found");
  assertAccess(p, c);
  const rows = after
    ? await db.chatMessage.findMany({ where: { channelId, createdAt: { gt: after } }, orderBy: { createdAt: "asc" }, take: 200, include: { sender: { select: { name: true, email: true, artistProfile: { select: { displayName: true } } } } } })
    : (await db.chatMessage.findMany({ where: { channelId }, orderBy: { createdAt: "desc" }, take: 100, include: { sender: { select: { name: true, email: true, artistProfile: { select: { displayName: true } } } } } })).reverse();
  await db.chatMember.upsert({ where: { channelId_userId: { channelId, userId: p.userId } }, create: { channelId, userId: p.userId, lastReadAt: new Date() }, update: { lastReadAt: new Date() } });
  return { channel: { id: c.id, kind: c.kind, title: channelTitle(c, p.userId), members: c.members.map((m) => personName(m.user)) }, messages: rows.map((m) => ({ id: m.id, body: m.body, createdAt: m.createdAt, senderId: m.senderId, senderName: personName(m.sender), mine: m.senderId === p.userId })) };
}

export async function sendMessage(p: Principal, channelId: string, body: string) {
  const text = body.trim();
  if (!text) throw new ValidationError("Write something first.");
  if (text.length > MAX) throw new ValidationError(`Keep it under ${MAX} characters.`);
  const c = await db.chatChannel.findUnique({ where: { id: channelId }, include: memberInclude });
  if (!c) throw new NotFoundError("Channel not found");
  assertAccess(p, c);
  const m = await db.chatMessage.create({ data: { channelId, senderId: p.userId, body: text } });
  await db.chatMember.upsert({ where: { channelId_userId: { channelId, userId: p.userId } }, create: { channelId, userId: p.userId, lastReadAt: m.createdAt }, update: { lastReadAt: m.createdAt } });
  return m;
}
