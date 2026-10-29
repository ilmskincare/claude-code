import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { type Principal, NotFoundError, ValidationError } from "./rbac";
import { assertAllowedUpload, newStorageKey, putObject } from "./storage";
import { assertCanEditProfile } from "./profiles";

/**
 * Portfolio: an artist (or anyone who manages the roster) uploads photos of their work. A photo of a
 * client's tattoo or piercing only goes on the public site once the client's publication permission is
 * recorded against the image; without it the item is kept on file but never published.
 */
export const portfolioItemSchema = z.object({
  caption: z.string().trim().max(200).optional().default(""),
  styleTags: z.string().trim().max(200).optional().default(""),
  placement: z.string().trim().max(80).optional().default(""),
  isHealed: z.boolean().default(false),
  isCover: z.boolean().default(false),
  /** The client gave permission for this photo to be published (recorded on their consent form), or it is the artist's own design with nobody's skin in it. */
  permission: z.boolean().default(false),
});
export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>;

const tags = (s: string) => s.split(/[,\n]/).map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10);

export async function listPortfolio(artistId: string) {
  return db.portfolioItem.findMany({ where: { artistId }, include: { asset: { include: { permissions: { where: { purpose: "PORTFOLIO_PUBLICATION", withdrawnAt: null } } } } }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] });
}

export async function addPortfolioItem(p: Principal, artistId: string, file: File, input: PortfolioItemInput) {
  assertCanEditProfile(p, artistId);
  const artist = await db.artistProfile.findUnique({ where: { id: artistId } });
  if (!artist) throw new NotFoundError("Artist not found");
  if (!file || file.size === 0) throw new ValidationError("Choose a photo to upload.");
  assertAllowedUpload(file.type, file.size);
  if (!file.type.startsWith("image/")) throw new ValidationError("Portfolio items must be images (JPEG, PNG, WebP or HEIC).");
  const key = newStorageKey(`portfolio/${artist.slug}`, file.name);
  await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type);
  const count = await db.portfolioItem.count({ where: { artistId } });
  const item = await db.$transaction(async (tx) => {
    const asset = await tx.imageAsset.create({ data: { uploadedById: p.userId, storageKey: key, originalName: file.name, mimeType: file.type, sizeBytes: file.size, visibility: input.permission ? "PORTFOLIO_PUBLIC" : "PORTFOLIO_PENDING", scanStatus: "SKIPPED", photographer: artist.displayName, rightsHolder: artist.displayName, permissions: input.permission ? { create: { purpose: "PORTFOLIO_PUBLICATION", granted: true, grantedById: p.userId } } : undefined } });
    if (input.isCover) await tx.portfolioItem.updateMany({ where: { artistId }, data: { isCover: false } });
    return tx.portfolioItem.create({ data: { artistId, assetId: asset.id, caption: input.caption || null, styleTags: tags(input.styleTags), placement: input.placement || null, isHealed: input.isHealed, isCover: input.isCover || count === 0, sortOrder: count, publishedAt: input.permission ? new Date() : null } });
  });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "portfolio.item_added", entityType: "PortfolioItem", entityId: item.id, after: { artistId, key, published: Boolean(item.publishedAt), isCover: item.isCover } });
  return item;
}

async function ownedItem(p: Principal, itemId: string) {
  const item = await db.portfolioItem.findUnique({ where: { id: itemId }, include: { asset: { include: { permissions: true } } } });
  if (!item) throw new NotFoundError("Portfolio item not found");
  assertCanEditProfile(p, item.artistId);
  return item;
}

/** Publish needs a recorded permission; unpublish is always allowed. */
export async function setPortfolioPublished(p: Principal, itemId: string, published: boolean) {
  const item = await ownedItem(p, itemId);
  if (published && !item.asset.permissions.some((x) => x.purpose === "PORTFOLIO_PUBLICATION" && x.granted && !x.withdrawnAt)) throw new ValidationError("This photo has no publication permission on record. Re-upload it and tick the permission box once the client has agreed.");
  await db.portfolioItem.update({ where: { id: itemId }, data: { publishedAt: published ? new Date() : null } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: published ? "portfolio.item_published" : "portfolio.item_unpublished", entityType: "PortfolioItem", entityId: itemId });
}

export async function setPortfolioCover(p: Principal, itemId: string) {
  const item = await ownedItem(p, itemId);
  await db.$transaction([db.portfolioItem.updateMany({ where: { artistId: item.artistId }, data: { isCover: false } }), db.portfolioItem.update({ where: { id: itemId }, data: { isCover: true } })]);
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "portfolio.cover_set", entityType: "PortfolioItem", entityId: itemId });
}

/** Removes the item from the portfolio. The image file stays in storage for the audit trail. */
export async function removePortfolioItem(p: Principal, itemId: string) {
  const item = await ownedItem(p, itemId);
  await db.portfolioItem.delete({ where: { id: itemId } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "portfolio.item_removed", entityType: "PortfolioItem", entityId: itemId, before: { artistId: item.artistId, key: item.asset.storageKey, caption: item.caption } });
}
