import { db } from "./db";
import { audit } from "./audit";
import { can, type Principal, ForbiddenError, NotFoundError, ValidationError } from "./rbac";

/**
 * Document library sign-off. Every template version starts as a draft (approvedAt null) and the
 * public page, the PDF and booking emails all carry a "Draft, do not issue" banner until the studio's
 * qualified practitioner approves it here. Approval and withdrawal are audited.
 */
export async function listDocumentTemplates() {
  return db.documentTemplateVersion.findMany({ where: { isCurrent: true }, orderBy: [{ kind: "asc" }, { title: "asc" }], select: { id: true, templateKey: true, version: true, kind: true, title: true, procedureType: true, approvedAt: true, approverName: true, issueDate: true, reviewDate: true, bodyMarkdown: true } })
    .then((rows) => rows.map((r) => ({ ...r, toConfirm: (r.bodyMarkdown.match(/^> Practitioner to confirm/gm) ?? []).length, bodyMarkdown: undefined })));
}

export async function approveDocument(p: Principal, id: string, approverName: string) {
  if (!can(p, "documents.manage")) throw new ForbiddenError();
  const name = approverName.trim();
  if (name.length < 2 || name.length > 80) throw new ValidationError("Enter the name of the practitioner approving it.");
  const d = await db.documentTemplateVersion.findUnique({ where: { id } });
  if (!d || !d.isCurrent) throw new NotFoundError("Document not found");
  if (d.approvedAt) throw new ValidationError("Already approved.");
  const now = new Date();
  await db.documentTemplateVersion.update({ where: { id }, data: { approvedAt: now, approverName: name } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "document.approved", entityType: "DocumentTemplateVersion", entityId: id, after: { templateKey: d.templateKey, version: d.version, approverName: name, approvedAt: now } });
}

export async function withdrawDocumentApproval(p: Principal, id: string, reason: string) {
  if (!can(p, "documents.manage")) throw new ForbiddenError();
  const d = await db.documentTemplateVersion.findUnique({ where: { id } });
  if (!d || !d.isCurrent) throw new NotFoundError("Document not found");
  if (!d.approvedAt) throw new ValidationError("Not approved.");
  await db.documentTemplateVersion.update({ where: { id }, data: { approvedAt: null, approverName: null } });
  await audit({ actorId: p.userId, actorLabel: p.name ?? p.email, action: "document.approval_withdrawn", entityType: "DocumentTemplateVersion", entityId: id, before: { approverName: d.approverName, approvedAt: d.approvedAt }, after: { reason: reason.trim().slice(0, 300) || null } });
}
