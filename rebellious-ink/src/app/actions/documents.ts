"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { approveDocument, withdrawDocumentApproval } from "@/lib/documents";

type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
const refresh = (key: string) => { revalidatePath("/owner/documents"); revalidatePath("/guides"); revalidatePath(`/guides/${key}`); };

export async function approveDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  try { await approveDocument(p, String(formData.get("id") ?? ""), String(formData.get("approverName") ?? "")); refresh(String(formData.get("templateKey") ?? "")); return { ok: true, message: "Approved. The draft banner is gone and it can be issued to clients." }; } catch (e) { return { error: msg(e) }; }
}

export async function withdrawDocumentApprovalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  try { await withdrawDocumentApproval(p, String(formData.get("id") ?? ""), String(formData.get("reason") ?? "")); refresh(String(formData.get("templateKey") ?? "")); return { ok: true, message: "Approval withdrawn. It shows as a draft again." }; } catch (e) { return { error: msg(e) }; }
}
