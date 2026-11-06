import "dotenv/config";
import sharp from "sharp";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Replaces the plain-colour placeholder flash images with crops from six public-domain
 * (CC0) early twentieth-century flash sheets held by the Smithsonian American Art Museum
 * (records saam_1998.84.50A to F). Crops are written to prisma/seed-assets/flash so a
 * fresh seed uses them too; the local database rows are updated by title; and an
 * idempotent SQL file is emitted for staging. Usage:
 *   npx tsx scripts/import-archive-flash.ts <dir with A.jpg..F.jpg> <sql out path>
 */
const SRC = path.resolve(process.argv[2] ?? "./saam");
const SQL_OUT = process.argv[3] ?? "./archive-flash.sql";
const ASSETS = path.resolve("prisma/seed-assets/flash");
const STORAGE = path.resolve(process.env.STORAGE_LOCAL_DIR ?? "./storage");

// [old title, new title, sheet letter, x%, y%, w%, h%, colourMode]
const CROPS: [string, string, string, number, number, number, number, "BLACK" | "COLOUR"][] = [
  ["Moth (TEST)", "Moth (archive)", "C", 7, 7, 30, 31, "COLOUR"],
  ["Dagger and rose (TEST)", "Dagger and crescent (archive)", "A", 35, 5, 18, 32, "BLACK"],
  ["Crescent moon (TEST)", "Clipper ship (archive)", "A", 36, 40, 24, 53, "BLACK"],
  ["Snake and key (TEST)", "Sailor's grave (archive)", "E", 7, 44, 30, 50, "BLACK"],
  ["Fern sprig (TEST)", "Heart and shield (archive)", "E", 5, 11, 23, 32, "BLACK"],
  ["Crown and wings (TEST)", "Winged propeller (archive)", "F", 56, 8, 37, 42, "BLACK"],
  ["Swallow (TEST)", "Bluebird (archive)", "C", 65, 57, 28, 30, "COLOUR"],
  ["Peony (TEST)", "Rose (archive)", "C", 37, 43, 29, 50, "COLOUR"],
  ["Eye and sparkles (TEST)", "Lucky cards (archive)", "B", 63, 9, 33, 34, "COLOUR"],
  ["Skull and dice (TEST)", "Skull and cap (archive)", "B", 66, 49, 29, 40, "COLOUR"],
];
const SHEET = { oldTitle: "Autumn sheet 1 (TEST)", newTitle: "Archive sheet C (public domain)", letter: "C", key: "flash/archive/sheet-c.jpg" };
const HOTSPOTS: [string, string, number, number, number, number][] = [
  ["Sheet: anchor (TEST)", "Butterfly (archive)", 65, 7, 30, 44],
  ["Sheet: lantern (TEST)", "Swallow and banner (archive)", 7, 42, 30, 48],
];
const slug = (t: string) => t.toLowerCase().replace(/\s*\(archive\)/, "").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const q = (v: string) => "'" + v.replace(/'/g, "''") + "'";

async function main() {
  await mkdir(ASSETS, { recursive: true });
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  let sql = "";
  for (const [oldTitle, newTitle, letter, x, y, w, h, colourMode] of CROPS) {
    const src = path.join(SRC, `${letter}.jpg`);
    const meta = await sharp(src).metadata();
    const W = meta.width!, H = meta.height!;
    const key = `flash/archive/${slug(newTitle)}.jpg`;
    const out = path.join(ASSETS, path.basename(key));
    await sharp(src).extract({ left: Math.round((x / 100) * W), top: Math.round((y / 100) * H), width: Math.round((w / 100) * W), height: Math.round((h / 100) * H) }).resize({ width: 1200, height: 1200, fit: "inside" }).jpeg({ quality: 85 }).toFile(out);
    await mkdir(path.dirname(path.join(STORAGE, key)), { recursive: true });
    await copyFile(out, path.join(STORAGE, key));
    const n = await db.design.updateMany({ where: { title: { in: [oldTitle, newTitle] } }, data: { title: newTitle, imageKey: key, colourMode } });
    console.log(newTitle, "->", key, `(${n.count} row)`);
    sql += `UPDATE "Design" SET title = ${q(newTitle)}, "imageKey" = ${q(key)}, "colourMode" = '${colourMode}' WHERE title IN (${q(oldTitle)}, ${q(newTitle)});\n`;
  }
  // The whole sheet, plus its two hotspot designs.
  const sheetSrc = path.join(SRC, `${SHEET.letter}.jpg`);
  const sheetOut = path.join(ASSETS, path.basename(SHEET.key));
  await sharp(sheetSrc).resize({ width: 2000 }).jpeg({ quality: 85 }).toFile(sheetOut);
  await copyFile(sheetOut, path.join(STORAGE, SHEET.key));
  const s = await db.flashSheet.updateMany({ where: { title: { in: [SHEET.oldTitle, SHEET.newTitle] } }, data: { title: SHEET.newTitle, imageKey: SHEET.key } });
  console.log(SHEET.newTitle, "->", SHEET.key, `(${s.count} row)`);
  sql += `UPDATE "FlashSheet" SET title = ${q(SHEET.newTitle)}, "imageKey" = ${q(SHEET.key)} WHERE title IN (${q(SHEET.oldTitle)}, ${q(SHEET.newTitle)});\n`;
  for (const [oldTitle, newTitle, x, y, w, h] of HOTSPOTS) {
    const n = await db.design.updateMany({ where: { title: { in: [oldTitle, newTitle] } }, data: { title: newTitle, imageKey: SHEET.key, hotspotX: x, hotspotY: y, hotspotW: w, hotspotH: h, colourMode: "COLOUR" } });
    console.log(newTitle, "(hotspot)", `(${n.count} row)`);
    sql += `UPDATE "Design" SET title = ${q(newTitle)}, "imageKey" = ${q(SHEET.key)}, "hotspotX" = ${x}, "hotspotY" = ${y}, "hotspotW" = ${w}, "hotspotH" = ${h}, "colourMode" = 'COLOUR' WHERE title IN (${q(oldTitle)}, ${q(newTitle)});\n`;
  }
  await writeFile(SQL_OUT, sql);
  await db.$disconnect();
  console.log("wrote", SQL_OUT);
}
main().catch((e) => { console.error(e); process.exit(1); });
