import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { putPublicObject, type StoredObject } from "./storage";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"]);
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_EDGE = 1600;
export const THUMB_EDGE = 600;

export function assertAllowedImage(mime: string, size: number) {
  if (!ALLOWED.has(mime)) throw new Error("Only JPEG, PNG, WEBP, HEIC or AVIF images are accepted.");
  if (size > MAX_UPLOAD_BYTES) throw new Error("Images must be under 20 MB.");
}

/** Resize to at most 1600 px on the longest edge and store a 600 px thumbnail beside it. Output is JPEG. */
export async function processAndStoreProductImage(productId: string, bytes: Uint8Array): Promise<{ full: StoredObject; thumb: StoredObject; width: number; height: number }> {
  const id = randomUUID();
  const base = sharp(bytes, { failOn: "none" }).rotate();
  const full = await base.clone().resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 86, mozjpeg: true }).toBuffer({ resolveWithObject: true });
  const thumb = await base.clone().resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const [storedFull, storedThumb] = await Promise.all([
    putPublicObject(`products/${productId}/${id}.jpg`, full.data, "image/jpeg"),
    putPublicObject(`products/${productId}/${id}-thumb.jpg`, thumb, "image/jpeg"),
  ]);
  return { full: storedFull, thumb: storedThumb, width: full.info.width, height: full.info.height };
}
