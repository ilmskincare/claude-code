import { ImageResponse } from "next/og";
import { sheetData } from "@/lib/flash-sheet";

/**
 * Shareable flash sheet with prices, rendered from the live catalogue.
 * ?artist=<slug>&format=feed (1080x1350) | story (1080x1920). Cached at the edge for 10 minutes.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("artist") ?? "";
  const format = url.searchParams.get("format") === "story" ? "story" : "feed";
  const data = await sheetData(slug, format === "story" ? 9 : 12);
  if (!data) return new Response("Not found", { status: 404 });
  const width = 1080, height = format === "story" ? 1920 : 1350;
  const cols = 3, gap = 24, pad = 56;
  const tile = Math.floor((width - pad * 2 - gap * (cols - 1)) / cols);
  const { gbp, settings: s } = data;
  return new ImageResponse(
    (
      <div style={{ width, height, display: "flex", flexDirection: "column", background: "#070807", color: "#e9ecdc", padding: pad, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#e0202a", textTransform: "uppercase" }}>Rebellious Ink · Flash</div>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 700, marginTop: 6 }}>{data.artist.displayName.replace(" (TEST)", "")}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 24 }}>
            <div style={{ display: "flex" }}>{s.palmEnabled ? "Small " : ""}up to {s.smallMaxCm} cm <span style={{ color: "#e0202a", marginLeft: 8 }}>{gbp(s.smallPence)}</span></div>
            {s.palmEnabled && <div style={{ display: "flex" }}>Palm up to {s.palmMaxCm} cm <span style={{ color: "#e0202a", marginLeft: 8 }}>{gbp(s.palmPence)}</span></div>}
            <div style={{ display: "flex", fontSize: 20, opacity: 0.8 }}>Apprentice from {gbp(s.apprenticeSmallPence)} · deposit {gbp(s.depositSmallPence)}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap, marginTop: 36 }}>
          {data.items.map((d) => (
            <div key={d.id} style={{ display: "flex", flexDirection: "column", width: tile, background: "#131613", borderRadius: 18, overflow: "hidden" }}>
              <div style={{ display: "flex", position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- satori renders data URLs */}
                <img src={d.image} alt="" width={tile} height={tile} style={{ objectFit: "cover" }} />
                <div style={{ position: "absolute", top: 10, left: 10, display: "flex", background: "#e0202a", color: "#070807", fontWeight: 700, fontSize: 22, padding: "2px 12px", borderRadius: 999 }}>{d.n}</div>
                {!d.repeatable && <div style={{ position: "absolute", top: 10, right: 10, display: "flex", background: "#070807", color: "#e0202a", fontSize: 18, padding: "2px 10px", borderRadius: 999 }}>one-off</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 22, fontWeight: 700 }}>{d.title.slice(0, 22)}</div>
                  <div style={{ display: "flex", fontSize: 19, color: "#e0202a" }}>{s.palmEnabled ? `Small ${gbp(d.prices.small)} / Palm ${gbp(d.prices.palm)}` : gbp(d.prices.small)}</div>
                  {d.prices.apprenticeSmall != null && <div style={{ display: "flex", fontSize: 16, opacity: 0.85 }}>Apprentice {gbp(d.prices.apprenticeSmall)}{s.palmEnabled ? ` / ${gbp(d.prices.apprenticePalm ?? 0)}` : ""}</div>}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element -- QR code */}
                <img src={d.qr} alt="" width={64} height={64} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: "auto", alignItems: "center", justifyContent: "space-between", fontSize: 24, borderTop: "2px solid #e0202a", paddingTop: 20 }}>
          <div style={{ display: "flex", flexDirection: "column" }}><div style={{ display: "flex" }}>Book at <span style={{ color: "#e0202a", marginLeft: 8 }}>{data.bookUrl}</span></div><div style={{ display: "flex", fontSize: 18, opacity: 0.8 }}>Total price shown. Deposit comes off it. 18+, photographic ID checked. Free touch-up included.</div></div>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR code */}
          <img src={data.qrAll} alt="" width={100} height={100} />
        </div>
      </div>
    ),
    { width, height, headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } },
  );
}
