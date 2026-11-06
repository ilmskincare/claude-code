import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Placeholder product art drawn with sharp: black canvas, the product name and the
 * brand name as an SVG overlay, 1200 x 1500 px. Keeps the store looking finished
 * until real photos are uploaded through the admin.
 */
const WIDTH = 1200;
const HEIGHT = 1500;
const DIR = path.resolve(process.cwd(), "public/placeholders");

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrap(name: string, maxChars = 14): string[] {
  const words = name.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars && line) {
      lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function svg(name: string, subtitle: string) {
  const lines = wrap(name);
  const startY = HEIGHT / 2 - ((lines.length - 1) * 110) / 2;
  const text = lines.map((l, i) => `<text x="600" y="${startY + i * 110}" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-weight="bold" font-size="104" fill="#f3f5f6">${esc(l.toUpperCase())}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0a0a0a"/>
  <rect x="60" y="60" width="${WIDTH - 120}" height="${HEIGHT - 120}" fill="none" stroke="#2a2e32" stroke-width="4"/>
  <rect x="60" y="60" width="${WIDTH - 120}" height="18" fill="#19c8ff"/>
  <text x="600" y="260" text-anchor="middle" font-family="DejaVu Serif, Liberation Serif, Georgia, serif" font-style="italic" font-size="92" fill="#f3f5f6">Rebellious Hustler</text>
  <text x="600" y="330" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="30" letter-spacing="8" fill="#5fe0ff">BIRMINGHAM</text>
  ${text}
  <text x="600" y="${HEIGHT - 260}" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="34" letter-spacing="4" fill="#8f8a86">${esc(subtitle.toUpperCase())}</text>
  <text x="600" y="${HEIGHT - 170}" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-weight="bold" font-size="30" letter-spacing="6" fill="#19c8ff">ONE BRAND - ONE VOICE - ONE COMMUNITY</text>
</svg>`;
}

async function exists(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** Writes `<slug>.jpg` and `<slug>-thumb.jpg` under public/placeholders and returns their public URLs. */
export async function ensurePlaceholder(slug: string, name: string, subtitle: string, force = false) {
  await mkdir(DIR, { recursive: true });
  const full = path.join(DIR, `${slug}.jpg`);
  const thumb = path.join(DIR, `${slug}-thumb.jpg`);
  if (force || !(await exists(full)) || !(await exists(thumb))) {
    const image = sharp(Buffer.from(svg(name, subtitle)));
    await image.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(full);
    await image.clone().resize({ width: 600, height: 600, fit: "inside" }).jpeg({ quality: 80, mozjpeg: true }).toFile(thumb);
  }
  return { url: `/placeholders/${slug}.jpg`, thumbUrl: `/placeholders/${slug}-thumb.jpg`, storageKey: `placeholders/${slug}.jpg`, thumbKey: `placeholders/${slug}-thumb.jpg` };
}

/** 1200 x 630 Open Graph card with the crest. */
export async function ensureOgImage(force = false) {
  const out = path.resolve(process.cwd(), "public/brand/og.png");
  if (!force && (await exists(out))) return out;
  const logo = await sharp(path.resolve(process.cwd(), "public/brand/rebellious-hustler-crest-transparent.png")).resize({ height: 460 }).png().toBuffer();
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect x="0" y="0" width="1200" height="14" fill="#19c8ff"/>
  <text x="560" y="250" font-family="DejaVu Serif, Liberation Serif, Georgia, serif" font-style="italic" font-size="62" fill="#f3f5f6">Rebellious Hustler</text>
  <text x="560" y="305" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="24" letter-spacing="5" fill="#5fe0ff">BIRMINGHAM STREETWEAR</text>
  <text x="560" y="380" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-weight="bold" font-size="24" fill="#f3f5f6">ONE BRAND - ONE VOICE - ONE COMMUNITY</text>
  <text x="560" y="425" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="21" fill="#8f9499">Mens, womens, boys and girls.</text>
  <text x="560" y="458" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="21" fill="#8f9499">Tracksuits, hoodies, tees and more.</text>
</svg>`;
  await sharp(Buffer.from(overlay))
    .composite([{ input: logo, left: 80, top: 95 }])
    .png()
    .toFile(out);
  return out;
}
