import QRCode from "qrcode";
import { db } from "./db";
import { getObject } from "./storage";
import { env } from "./env";
import { flashSettings, effectivePrices, releaseLapsedDesignHolds } from "./flash";

/**
 * Data for a generated flash sheet: an artist's live catalogue designs with current prices,
 * images inlined as data URLs (private storage is not reachable by the renderer) and a QR
 * code per design pointing at its booking page.
 */
export async function sheetData(artistSlug: string, limit = 12) {
  await releaseLapsedDesignHolds();
  const artist = await db.artistProfile.findUnique({ where: { slug: artistSlug }, select: { id: true, displayName: true, isPublished: true } });
  if (!artist || !artist.isPublished) return null;
  const s = await flashSettings();
  const designs = await db.design.findMany({ where: { artistId: artist.id, status: { in: ["AVAILABLE", "HELD"] }, collection: "CATALOGUE", hotspotX: null }, orderBy: { sortOrder: "asc" }, take: limit });
  const base = env().APP_BASE_URL;
  const items = await Promise.all(designs.map(async (d, i) => {
    const bytes = await getObject(d.imageKey);
    const mime = d.imageKey.endsWith(".png") ? "image/png" : d.imageKey.endsWith(".webp") ? "image/webp" : "image/jpeg";
    const prices = effectivePrices(d, s);
    return { n: i + 1, id: d.id, title: d.title, repeatable: d.repeatable, image: `data:${mime};base64,${bytes.toString("base64")}`, qr: await QRCode.toDataURL(`${base}/flash/${d.id}`, { margin: 0, width: 160, color: { dark: "#070807", light: "#e9ecdc" } }), prices };
  }));
  const gbp = (p: number) => `£${(p / 100).toFixed(0)}`;
  return { artist, items, settings: s, gbp, bookUrl: `${base.replace(/^https?:\/\//, "")}/flash`, qrAll: await QRCode.toDataURL(`${base}/flash?artist=${artistSlug}`, { margin: 0, width: 200, color: { dark: "#070807", light: "#e0202a" } }) };
}
