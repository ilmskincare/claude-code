"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { approveAllDocuments, approveDocument, withdrawDocumentApproval } from "@/lib/documents";

type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
const refresh = (key: string) => { revalidatePath("/owner/documents"); revalidatePath("/guides"); revalidatePath(`/guides/${key}`); };

export async function approveDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  try { await approveDocument(p, String(formData.get("id") ?? ""), String(formData.get("approverName") ?? "")); refresh(String(formData.get("templateKey") ?? "")); return { ok: true, message: "Approved. The draft banner is gone and it can be issued to clients." }; } catch (e) { return { error: msg(e) }; }
}

export async function approveAllDocumentsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  try { const n = await approveAllDocuments(p, String(formData.get("approverName") ?? "")); revalidatePath("/owner/documents"); revalidatePath("/guides"); return { ok: true, message: n === 0 ? "Nothing was in draft." : `${n} document${n === 1 ? "" : "s"} approved and live on the website.` }; } catch (e) { return { error: msg(e) }; }
}

export async function withdrawDocumentApprovalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  try { await withdrawDocumentApproval(p, String(formData.get("id") ?? ""), String(formData.get("reason") ?? "")); refresh(String(formData.get("templateKey") ?? "")); return { ok: true, message: "Approval withdrawn. It shows as a draft again." }; } catch (e) { return { error: msg(e) }; }
}
