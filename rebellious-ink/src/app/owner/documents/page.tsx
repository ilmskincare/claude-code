import { requireCapability } from "@/lib/session";
import { listDocumentTemplates } from "@/lib/documents";
import { PageHeader, Alert } from "@/components/ui";
import { DocumentApprovals } from "./document-approvals";

export const metadata = { title: "Documents" };

export default async function OwnerDocumentsPage() {
  const p = await requireCapability("documents.manage", "/owner/documents");
  const rows = await listDocumentTemplates();
  const drafts = rows.filter((r) => !r.approvedAt).length;
  return (
    <div>
      <PageHeader title="Client documents" intro="Every guide, policy and consent form on the public site, with its sign-off. A document stays marked as a draft, on the website and on the PDF, until a qualified practitioner approves it here. Read each one first; the highlighted boxes that start with 'Practitioner to confirm' are questions for you and should be settled before approval." />
      {drafts > 0 ? <div className="mb-6"><Alert tone="warn">{drafts} document{drafts === 1 ? " is" : "s are"} still in draft and must not be issued to clients.</Alert></div> : <div className="mb-6"><Alert tone="success">Every document is approved.</Alert></div>}
      <DocumentApprovals rows={rows.map((r) => ({ id: r.id, templateKey: r.templateKey, version: r.version, kind: r.kind, title: r.title, procedureType: r.procedureType, approvedAt: r.approvedAt, approverName: r.approverName, reviewDate: r.reviewDate, toConfirm: r.toConfirm }))} defaultName={p.name ?? ""} />
      <p className="hint mt-6">To change the wording, the desk updates the content file and issues a new version; the old version stays on record. Approval and withdrawal are written to the audit log.</p>
    </div>
  );
}
