import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

/**
 * Uploads the seed's placeholder portfolio and product PNGs (written to local storage by prisma/seed.ts)
 * into the staging Blob store under the same keys the seeded ImageAsset rows reference.
 * Usage: BLOB_READ_WRITE_TOKEN=... npx tsx scripts/upload-seed-assets.ts ./storage-test
 */
async function main() {
  const root = path.resolve(process.argv[2] ?? "./storage");
  for (const prefix of ["portfolio/seed", "products/seed"]) {
    const dir = path.join(root, prefix);
    const files = await readdir(dir).catch(() => [] as string[]);
    for (const f of files) {
      const key = `${prefix}/${f}`;
      await put(key, await readFile(path.join(dir, f)), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "image/png", token: process.env.BLOB_READ_WRITE_TOKEN });
      console.log("uploaded", key);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
