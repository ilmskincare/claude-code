import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import path from "node:path";
import { createHash } from "node:crypto";
import type { DocumentTemplateVersion } from "@/generated/prisma/client";

const ACID = "#e0202a", ACID_DEEP = "#a3121a", INK = "#070807", RED = "#e0533f";
const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 60, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 10.5, lineHeight: 1.5, color: "#111" },
  header: { flexDirection: "row", alignItems: "center", borderBottomWidth: 3, borderBottomColor: ACID, paddingBottom: 10, marginBottom: 14 },
  logo: { width: 52, height: 52, marginRight: 12, borderRadius: 26 },
  kind: { fontSize: 7.5, color: ACID_DEEP, letterSpacing: 2, textTransform: "uppercase" },
  title: { fontSize: 20, fontFamily: "Times-Bold", color: INK },
  meta: { marginLeft: "auto", textAlign: "right", fontSize: 8, color: "#555" },
  h2: { fontSize: 13, fontFamily: "Times-Bold", color: ACID_DEEP, marginTop: 12, marginBottom: 4 },
  p: { marginBottom: 6 },
  li: { flexDirection: "row", marginBottom: 3, paddingLeft: 6 },
  bullet: { width: 10 },
  callout: { borderLeftWidth: 4, borderLeftColor: ACID, backgroundColor: "#f8f4f3", padding: 8, marginVertical: 6, borderRadius: 3 },
  urgent: { borderLeftColor: RED },
  draft: { borderLeftWidth: 4, borderLeftColor: RED, backgroundColor: "#fdecea", padding: 8, marginBottom: 8 },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, borderTopWidth: 1, borderTopColor: "#ddd6d3", paddingTop: 6, fontSize: 7.5, color: "#555", flexDirection: "row", justifyContent: "space-between" },
});

function Body({ body }: { body: string }) {
  const nodes: React.ReactNode[] = [];
  let para: string[] = [], list: string[] = [], k = 0;
  const flush = () => {
    if (para.length) { nodes.push(<Text key={k++} style={s.p}>{para.join(" ")}</Text>); para = []; }
    if (list.length) { nodes.push(<View key={k++}>{list.map((l, i) => <View key={i} style={s.li}><Text style={s.bullet}>•</Text><Text style={{ flex: 1 }}>{l}</Text></View>)}</View>); list = []; }
  };
  for (const raw of body.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("# ")) { flush(); nodes.push(<Text key={k++} style={s.h2}>{line.slice(2)}</Text>); }
    else if (line.startsWith("- ")) { if (para.length) flush(); list.push(line.slice(2)); }
    else if (line.startsWith("! ")) { flush(); nodes.push(<View key={k++} style={[s.callout, s.urgent]}><Text><Text style={{ fontFamily: "Helvetica-Bold" }}>Important: </Text>{line.slice(2)}</Text></View>); }
    else if (line.startsWith("> ")) { flush(); nodes.push(<View key={k++} style={s.callout}><Text>{line.slice(2)}</Text></View>); }
    else if (line === "") flush();
    else { if (list.length) flush(); para.push(line); }
  }
  flush();
  return <>{nodes}</>;
}

export function DocumentPdf({ doc, recipientName, reference }: { doc: DocumentTemplateVersion; recipientName?: string; reference?: string }) {
  const logo = path.join(process.cwd(), "public/brand/rebellious-ink-logo.jpg");
  return (
    <Document title={`${doc.title} — Rebellious Ink v${doc.version}`} author="Rebellious Ink" language="en-GB">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
          <Image src={logo} style={s.logo} />
          <View><Text style={s.kind}>{doc.kind.replace(/_/g, " ")}</Text><Text style={s.title}>{doc.title}</Text></View>
          <View style={s.meta}><Text>Version {doc.version}</Text><Text>Issued {doc.issueDate.toLocaleDateString("en-GB")}</Text>{recipientName ? <Text>{recipientName}</Text> : null}{reference ? <Text>{reference}</Text> : null}</View>
        </View>
        {!doc.approvedAt && <View style={s.draft}><Text><Text style={{ fontFamily: "Helvetica-Bold" }}>Draft. </Text>Not yet approved by the studio&apos;s qualified practitioner. Do not issue to clients.</Text></View>}
        <Body body={doc.bodyMarkdown} />
        <View style={s.footer} fixed>
          <Text>Rebellious Ink · {doc.templateKey} v{doc.version} · Owner: {doc.ownerName}{doc.approverName ? ` · Approved by ${doc.approverName}` : ""}</Text>
          <Text render={({ pageNumber, totalPages }) => `Review due ${doc.reviewDate.toLocaleDateString("en-GB")} · Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderDocumentPdf(doc: DocumentTemplateVersion, opts: { recipientName?: string; reference?: string } = {}) {
  const buffer = await renderToBuffer(<DocumentPdf doc={doc} {...opts} />);
  return { buffer, sha256: createHash("sha256").update(buffer).digest("hex") };
}
