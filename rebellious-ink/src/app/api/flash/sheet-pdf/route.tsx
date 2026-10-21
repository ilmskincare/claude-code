/* eslint-disable jsx-a11y/alt-text -- @react-pdf Image has no alt attribute; the PDF carries text labels */
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { sheetData } from "@/lib/flash-sheet";

const st = StyleSheet.create({
  page: { backgroundColor: "#070807", color: "#e9ecdc", padding: 28, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1.5, borderBottomColor: "#8cb000", paddingBottom: 8 },
  brand: { fontSize: 9, color: "#8cb000", letterSpacing: 3 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 14 },
  tile: { width: "31.3%", marginRight: "2%", marginBottom: 12, backgroundColor: "#131613", borderRadius: 8, overflow: "hidden" },
  img: { width: "100%", height: 150, objectFit: "cover" },
  meta: { padding: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  n: { position: "absolute", top: 6, left: 6, backgroundColor: "#8cb000", color: "#070807", fontSize: 9, fontFamily: "Helvetica-Bold", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  footer: { position: "absolute", bottom: 20, left: 28, right: 28, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#8cb000", paddingTop: 8, fontSize: 8 },
});

/** A4 flash sheet for the studio wall: same data as the share images. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("artist") ?? "";
  const data = await sheetData(slug, 12);
  if (!data) return new Response("Not found", { status: 404 });
  const { gbp, settings: s } = data;
  const buf = await renderToBuffer(
    <Document title={`Flash: ${data.artist.displayName}`}>
      <Page size="A4" style={st.page}>
        <View style={st.header}>
          <View><Text style={st.brand}>REBELLIOUS INK · FLASH</Text><Text style={st.title}>{data.artist.displayName.replace(" (TEST)", "")}</Text></View>
          <View style={{ alignItems: "flex-end" }}><Text style={{ fontSize: 10 }}>{s.palmEnabled ? `Small up to ${s.smallMaxCm} cm ${gbp(s.smallPence)} · Palm up to ${s.palmMaxCm} cm ${gbp(s.palmPence)}` : `Up to ${s.smallMaxCm} cm ${gbp(s.smallPence)}`}</Text><Text style={{ fontSize: 8, opacity: 0.8 }}>Apprentice from {gbp(s.apprenticeSmallPence)} · deposit from {gbp(s.apprenticeDepositPence)}</Text></View>
        </View>
        <View style={st.grid}>
          {data.items.map((d) => (
            <View key={d.id} style={st.tile}>
              <Image src={d.image} style={st.img} />
              <Text style={st.n}>{d.n}</Text>
              <View style={st.meta}>
                <View><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>{d.title}{d.repeatable ? "" : " (one-off)"}</Text><Text style={{ fontSize: 8, color: "#8cb000" }}>{s.palmEnabled ? `Small ${gbp(d.prices.small)} / Palm ${gbp(d.prices.palm)}` : gbp(d.prices.small)}</Text>{d.prices.apprenticeSmall != null && <Text style={{ fontSize: 7, opacity: 0.85 }}>Apprentice {gbp(d.prices.apprenticeSmall)}{s.palmEnabled ? ` / ${gbp(d.prices.apprenticePalm ?? 0)}` : ""}</Text>}</View>
                <Image src={d.qr} style={{ width: 28, height: 28 }} />
              </View>
            </View>
          ))}
        </View>
        <View style={st.footer} fixed>
          <View><Text>Book at {data.bookUrl}. Total price shown; the deposit comes off it.</Text><Text style={{ opacity: 0.8 }}>18+ for tattooing, photographic ID checked. Every flash tattoo includes one free touch-up.</Text></View>
          <Image src={data.qrAll} style={{ width: 40, height: 40 }} />
        </View>
      </Page>
    </Document>,
  );
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="flash-${slug}.pdf"`, "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
}
