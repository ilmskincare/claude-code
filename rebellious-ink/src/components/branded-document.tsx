import Image from "next/image";
import type { DocumentTemplateVersion } from "@/generated/prisma/client";
import { renderDocumentBody } from "@/lib/markup";

export function BrandedDocument({ doc, recipientName, reference }: { doc: DocumentTemplateVersion; recipientName?: string; reference?: string }) {
  return (
    <article className="paper">
      <header>
        <Image src="/brand/rebellious-ink-logo.jpg" alt="Rebellious Ink" width={72} height={72} className="rounded-full" />
        <div className="flex-1"><p className="text-xs uppercase tracking-[.25em] text-acid-deep">{doc.kind.replace(/_/g, " ").toLowerCase()}</p><h1>{doc.title}</h1></div>
        <div className="text-right text-xs text-gray-600"><p>Version {doc.version}</p><p>Issued {doc.issueDate.toLocaleDateString("en-GB")}</p>{recipientName && <p className="mt-1 font-semibold text-ink">{recipientName}</p>}{reference && <p>{reference}</p>}</div>
      </header>
      {!doc.approvedAt && <div className="callout urgent"><strong>Draft. </strong>Not yet approved by the studio&apos;s qualified practitioner. Do not issue to clients.</div>}
      {renderDocumentBody(doc.bodyMarkdown)}
      <footer>
        <span>Rebellious Ink · {doc.templateKey} v{doc.version} · Owner: {doc.ownerName}{doc.approverName ? ` · Approved by ${doc.approverName}` : ""}</span>
        <span>Review due {doc.reviewDate.toLocaleDateString("en-GB")} · Latest version: rebelliousink.example/guides/{doc.templateKey}</span>
      </footer>
    </article>
  );
}
