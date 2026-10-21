import { ImageResponse } from "next/og";
import { playFor } from "@/lib/gumball";
import { getPrincipal } from "@/lib/session";
import { getVisitorId } from "@/lib/visitor";
import { getObject } from "@/lib/storage";

/** 1080x1920 story card: "I got <design> from the Rebellious Ink gumball machine". No price, by design. */
export async function GET(_req: Request, ctx: { params: Promise<{ playId: string }> }) {
  const { playId } = await ctx.params;
  const [p, visitorId] = await Promise.all([getPrincipal(), getVisitorId()]);
  const found = await playFor(playId, visitorId, p?.userId ?? null);
  if (!found || !found.play.design) return new Response("Not found", { status: 404 });
  const d = found.play.design;
  const bytes = await getObject(d.imageKey);
  const mime = d.imageKey.endsWith(".png") ? "image/png" : "image/jpeg";
  const image = `data:${mime};base64,${bytes.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#070807", color: "#e9ecdc", fontFamily: "sans-serif", padding: 80 }}>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 10, color: "#8cb000", textTransform: "uppercase" }}>Rebellious Ink</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, marginTop: 20, textAlign: "center" }}>Get what you get.</div>
        <div style={{ display: "flex", marginTop: 60, width: 820, height: 820, borderRadius: 48, overflow: "hidden", border: "10px solid #8cb000", background: "#131613" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori renders data URLs */}
          <img src={image} alt="" width={820} height={820} style={{ objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 60, textAlign: "center" }}>I got “{d.title.replace(" (archive)", "")}” from the gumball machine</div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 16, opacity: 0.8 }}>by {d.artist.displayName.replace(" (TEST)", "")}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 70, color: "#8cb000" }}>Spin yours at rebelliousink · 18+</div>
      </div>
    ),
    { width: 1080, height: 1920, headers: { "Cache-Control": "private, max-age=600" } },
  );
}
