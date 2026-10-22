// Draws six original postage-stamp-style flash designs for the gumball machine as 1600 x 1600 PNGs.
// Original vector artwork made for Rebellious Ink; no third-party images. Usage: node scripts/stamp-flash.mjs <outDir>
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const INK = "#111111";
const motifs = {
  star: `<polygon points="0,-150 44,-48 152,-46 66,22 94,128 0,66 -94,128 -66,22 -152,-46 -44,-48" fill="none" stroke="${INK}" stroke-width="18" stroke-linejoin="round"/><circle cx="0" cy="0" r="22" fill="${INK}"/>`,
  heart: `<path d="M0,120 C-150,20 -150,-110 -60,-110 C-25,-110 -5,-85 0,-60 C5,-85 25,-110 60,-110 C150,-110 150,20 0,120 Z" fill="none" stroke="${INK}" stroke-width="18" stroke-linejoin="round"/><path d="M-70,-50 C-90,-30 -95,-5 -85,20" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>`,
  bolt: `<polygon points="30,-160 -90,20 -5,20 -40,160 90,-30 5,-30" fill="${INK}" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/>`,
  moon: `<path d="M60,-140 A150,150 0 1 0 60,140 A110,110 0 1 1 60,-140 Z" fill="${INK}"/><circle cx="-115" cy="-110" r="12" fill="${INK}"/><circle cx="-150" cy="-40" r="8" fill="${INK}"/><circle cx="-130" cy="100" r="10" fill="${INK}"/>`,
  diamond: `<polygon points="-140,-50 -70,-120 70,-120 140,-50 0,140" fill="none" stroke="${INK}" stroke-width="18" stroke-linejoin="round"/><polyline points="-140,-50 140,-50" stroke="${INK}" stroke-width="12"/><polyline points="-70,-120 -40,-50 0,140 40,-50 70,-120" fill="none" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/><polyline points="-40,-50 0,-120 40,-50" fill="none" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/>`,
  sun: `<circle cx="0" cy="0" r="70" fill="none" stroke="${INK}" stroke-width="18"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; const r1 = 95, r2 = 150; return `<line x1="${(Math.cos(a) * r1).toFixed(1)}" y1="${(Math.sin(a) * r1).toFixed(1)}" x2="${(Math.cos(a) * r2).toFixed(1)}" y2="${(Math.sin(a) * r2).toFixed(1)}" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>`; }).join("")}<circle cx="-22" cy="-10" r="8" fill="${INK}"/><circle cx="22" cy="-10" r="8" fill="${INK}"/><path d="M-28,25 Q0,50 28,25" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>`,
};

function stampSvg(motif, label) {
  // Stamp body 1000 x 1200 centred on a 1600 canvas, with scalloped perforation edge and a double inner frame.
  const W = 1000, H = 1200, x0 = 300, y0 = 200, step = 50, r = 17;
  const holes = [];
  for (let x = x0; x <= x0 + W; x += step) { holes.push(`<circle cx="${x}" cy="${y0}" r="${r}"/>`); holes.push(`<circle cx="${x}" cy="${y0 + H}" r="${r}"/>`); }
  for (let y = y0 + step; y < y0 + H; y += step) { holes.push(`<circle cx="${x0}" cy="${y}" r="${r}"/>`); holes.push(`<circle cx="${x0 + W}" cy="${y}" r="${r}"/>`); }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1600" viewBox="0 0 1600 1600">
  <defs><mask id="perf"><rect width="1600" height="1600" fill="#fff"/><g fill="#000">${holes.join("")}</g></mask></defs>
  <rect width="1600" height="1600" fill="#ffffff"/>
  <g mask="url(#perf)"><rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="#ffffff" stroke="${INK}" stroke-width="26"/></g>
  <rect x="${x0 + 60}" y="${y0 + 60}" width="${W - 120}" height="${H - 120}" fill="none" stroke="${INK}" stroke-width="12"/>
  <rect x="${x0 + 84}" y="${y0 + 84}" width="${W - 168}" height="${H - 168}" fill="none" stroke="${INK}" stroke-width="5"/>
  <text x="800" y="${y0 + 175}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="74" letter-spacing="14" fill="${INK}">REBELLIOUS INK</text>
  <g transform="translate(800 ${y0 + 600}) scale(1.35)">${motifs[motif]}</g>
  <text x="${x0 + W - 130}" y="${y0 + H - 120}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="64" letter-spacing="10" fill="${INK}">${label}</text>
  <text x="${x0 + 130}" y="${y0 + H - 120}" text-anchor="start" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="58" fill="${INK}">4 CM</text>
</svg>`;
}

export const STAMPS = [
  ["star", "STAR", "Stamp: star"], ["heart", "HEART", "Stamp: heart"], ["bolt", "BOLT", "Stamp: lightning bolt"],
  ["moon", "MOON", "Stamp: crescent moon"], ["diamond", "DIAMOND", "Stamp: diamond"], ["sun", "SUN", "Stamp: sun"],
];

const out = process.argv[2];
if (out) {
  await mkdir(out, { recursive: true });
  for (const [motif, label] of STAMPS) {
    const png = await sharp(Buffer.from(stampSvg(motif, label))).png().toBuffer();
    await writeFile(path.join(out, `stamp-${motif}.png`), png);
    console.log(`stamp-${motif}.png`, png.length, "bytes");
  }
}
