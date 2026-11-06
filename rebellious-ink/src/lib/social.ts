import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { signedUrl } from "./storage";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";

export const socialPostSchema = z.object({
  caption: z.string().trim().min(1).max(2200),
  assetId: z.string().optional().or(z.literal("")),
  scheduledFor: z.string().optional().or(z.literal("")),
  channels: z.array(z.string()).optional(),
});

export function bufferConfigured() {
  return Boolean(process.env.BUFFER_ACCESS_TOKEN && process.env.BUFFER_ORGANIZATION_ID);
}

type GqlResult<T> = { data?: T; errors?: { message: string }[] };
async function buffer<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(process.env.BUFFER_API_URL ?? "https://api.buffer.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.BUFFER_ACCESS_TOKEN}` }, body: JSON.stringify({ query, variables }) });
  const json = (await res.json()) as GqlResult<T>;
  if (!res.ok || json.errors?.length) throw new Error(json.errors?.map((e) => e.message).join("; ") || `Buffer HTTP ${res.status}`);
  return json.data as T;
}

/** Connected channels, or [] when Buffer is not configured. Cached for the request only. */
export async function listChannels(): Promise<{ id: string; name: string; service: string }[]> {
  if (!bufferConfigured()) return [];
  const data = await buffer<{ channels: { id: string; name: string; service: string; isDisconnected: boolean }[] }>(`query($org: OrganizationId!) { channels(input: { organizationId: $org }) { id name service isDisconnected } }`, { org: process.env.BUFFER_ORGANIZATION_ID });
  return data.channels.filter((c) => !c.isDisconnected).map(({ id, name, service }) => ({ id, name, service }));
}

/** Only images that are public portfolio items with a recorded publication permission may be posted. */
export async function postableAssets() {
  return db.portfolioItem.findMany({ where: { publishedAt: { not: null }, asset: { visibility: "PORTFOLIO_PUBLIC", permissions: { some: { purpose: "SOCIAL_MEDIA", granted: true, withdrawnAt: null } } } }, include: { asset: true, artist: true }, orderBy: { publishedAt: "desc" }, take: 60 });
}

export async function savePost(p: Principal, input: z.infer<typeof socialPostSchema>, id?: string) {
  if (!can(p, "portfolio.publish")) throw new ForbiddenError();
  if (input.assetId) {
    const ok = await db.imageAsset.findFirst({ where: { id: input.assetId, visibility: "PORTFOLIO_PUBLIC", permissions: { some: { purpose: "SOCIAL_MEDIA", granted: true, withdrawnAt: null } } } });
    if (!ok) throw new ValidationError("That image does not have social media permission on record.");
  }
  const data = { caption: input.caption, assetId: input.assetId || null, scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null, channels: input.channels ?? [], createdById: p.userId };
  const post = id ? await db.socialPost.update({ where: { id }, data }) : await db.socialPost.create({ data });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: id ? "social.post_updated" : "social.post_created", entityType: "SocialPost", entityId: post.id, after: { caption: post.caption.slice(0, 80), channels: post.channels } });
  return post;
}

/** Push to Buffer (queue or scheduled time). Without Buffer the post stays a draft with an export. */
export async function publishPost(p: Principal, postId: string) {
  if (!can(p, "portfolio.publish")) throw new ForbiddenError();
  const post = await db.socialPost.findUnique({ where: { id: postId }, include: { asset: true } });
  if (!post) throw new NotFoundError();
  if (!bufferConfigured()) throw new ValidationError("Buffer is not connected. Add BUFFER_ACCESS_TOKEN and BUFFER_ORGANIZATION_ID, or use the export to post manually.");
  if (post.channels.length === 0) throw new ValidationError("Choose at least one channel.");
  const refs: string[] = [];
  try {
    for (const channelId of post.channels) {
      const assets = post.asset ? [{ image: { url: signedUrl(post.asset.storageKey, 3600), metadata: { altText: post.caption.slice(0, 100) } } }] : [];
      const data = await buffer<{ createPost: { __typename: string; post?: { id: string }; message?: string } }>(
        `mutation($input: CreatePostInput!) { createPost(input: $input) { __typename ... on PostActionSuccess { post { id } } ... on MutationError { message } } }`,
        { input: { channelId, text: post.caption, mode: post.scheduledFor ? "customScheduled" : "addToQueue", schedulingType: "automatic", dueAt: post.scheduledFor?.toISOString(), assets, source: "rebellious-ink-studio-os" } },
      );
      if (data.createPost.__typename !== "PostActionSuccess") throw new Error(data.createPost.message ?? data.createPost.__typename);
      refs.push(data.createPost.post!.id);
    }
    const updated = await db.socialPost.update({ where: { id: post.id }, data: { status: "SCHEDULED", provider: "buffer", providerRef: refs.join(","), error: null } });
    await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "social.post_sent_to_buffer", entityType: "SocialPost", entityId: post.id, after: { refs } });
    return updated;
  } catch (e) {
    await db.socialPost.update({ where: { id: post.id }, data: { status: "FAILED", error: (e as Error).message } });
    throw e;
  }
}
