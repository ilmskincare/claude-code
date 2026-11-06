import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { put as blobPut, del as blobDel } from "@vercel/blob";
import { env, blobConfigured } from "./env";

/**
 * Public object storage for product photos.
 *
 * Production: Vercel Blob (public store). On Vercel the store is connected to the project
 * (BLOB_STORE_ID is set) and the SDK obtains its own short-lived token, so no token is passed.
 * Outside Vercel a BLOB_READ_WRITE_TOKEN is passed explicitly.
 *
 * Development: files under ./storage served by /api/files/[...key].
 */
export type StoredObject = { key: string; url: string };

export function storageDriver(): "blob" | "local" {
  return blobConfigured() ? "blob" : "local";
}

function baseDir() {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), env().STORAGE_LOCAL_DIR);
}

function safeLocalPath(key: string) {
  const base = baseDir();
  const full = path.resolve(base, key);
  if (!full.startsWith(base + path.sep)) throw new Error("Invalid storage key");
  return full;
}

export async function putPublicObject(key: string, bytes: Uint8Array, contentType: string): Promise<StoredObject> {
  if (storageDriver() === "blob") {
    const token = env().BLOB_READ_WRITE_TOKEN;
    const result = await blobPut(key, Buffer.from(bytes), {
      access: "public",
      addRandomSuffix: false,
      contentType,
      ...(token ? { token } : {}),
    });
    return { key, url: result.url };
  }
  const full = safeLocalPath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  return { key, url: `/api/files/${key.split("/").map(encodeURIComponent).join("/")}` };
}

export async function deletePublicObject(keyOrUrl: { key: string; url: string }) {
  if (storageDriver() === "blob") {
    const token = env().BLOB_READ_WRITE_TOKEN;
    await blobDel(keyOrUrl.url, token ? { token } : undefined);
    return;
  }
  await rm(safeLocalPath(keyOrUrl.key), { force: true });
}

/** Local driver only: read a stored file for the /api/files route. */
export async function readLocalObject(key: string): Promise<Buffer> {
  return readFile(safeLocalPath(key));
}
