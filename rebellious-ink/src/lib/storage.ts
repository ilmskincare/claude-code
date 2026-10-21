import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "./env";

/**
 * Private object storage with short-lived signed links. The local driver is
 * for development only; production requires an S3-compatible bucket (ticket P1-12
 * wires the S3 driver behind the same interface).
 */
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]);
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function assertAllowedUpload(mime: string, size: number) {
  if (!ALLOWED_MIME.has(mime)) throw new Error("Only JPEG, PNG, WEBP, HEIC images or PDF files are accepted.");
  if (size > MAX_UPLOAD_BYTES) throw new Error("Files must be under 15 MB.");
}

function baseDir() {
  return path.resolve(process.cwd(), env().STORAGE_LOCAL_DIR);
}

export function newStorageKey(prefix: string, originalName: string) {
  const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 8);
  return `${prefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;
}

export async function putObject(key: string, bytes: Uint8Array) {
  if (env().STORAGE_DRIVER !== "local") throw new Error("S3 driver not yet configured (P1-12)");
  const full = path.join(baseDir(), key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
}

export async function getObject(key: string): Promise<Buffer> {
  if (env().STORAGE_DRIVER !== "local") throw new Error("S3 driver not yet configured (P1-12)");
  const full = path.join(baseDir(), key);
  if (!full.startsWith(baseDir())) throw new Error("Invalid key");
  return readFile(full);
}

/** HMAC-signed, expiring URL for a private object. */
export function signedUrl(key: string, ttlSeconds = 600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = sign(key, exp);
  return `${env().APP_BASE_URL}/api/files/${encodeURIComponent(key)}?exp=${exp}&sig=${sig}`;
}

function sign(key: string, exp: number) {
  return createHmac("sha256", env().STORAGE_SIGNING_SECRET).update(`${key}:${exp}`).digest("hex");
}

export function verifySignedUrl(key: string, exp: number, sig: string) {
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = sign(key, exp);
  if (expected.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
