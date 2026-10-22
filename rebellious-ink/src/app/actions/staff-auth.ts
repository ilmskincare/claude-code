"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { checkStaffCredentials, startSession, setOwnPassword, issueCredentials, changeRole, setStaffStatus, setJobTitle, ASSIGNABLE_ROLES, type AssignableRole } from "@/lib/staff-auth";

type ActionState = { ok?: boolean; error?: string; message?: string; username?: string; tempPassword?: string } | undefined;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export async function staffSignInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? ""), password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  let user;
  try { user = await checkStaffCredentials(username, password); await startSession(user.id); } catch (e) { return { error: msg(e) }; }
  redirect(user.mustChangePassword ? "/account/password?first=1" : next.startsWith("/") ? next : "/after-login");
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal("/account/password");
  const next = String(formData.get("password") ?? ""), again = String(formData.get("confirm") ?? "");
  if (next !== again) return { error: "The two passwords do not match." };
  try { await setOwnPassword(p, formData.get("current") ? String(formData.get("current")) : null, next); } catch (e) { return { error: msg(e) }; }
  redirect("/after-login");
}

export async function issueCredentialsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  try {
    const r = await issueCredentials(p, String(formData.get("userId") ?? ""), String(formData.get("username") ?? "") || undefined);
    revalidatePath("/owner/artists");
    return { ok: true, username: r.username, tempPassword: r.tempPassword, message: `Username ${r.username}. One-time password shown once below: read it to them, they set their own on first sign-in.` };
  } catch (e) { return { error: msg(e) }; }
}

export async function changeRoleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const role = String(formData.get("role") ?? "");
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) return { error: "Unknown role." };
  try { await changeRole(p, String(formData.get("userId") ?? ""), role as AssignableRole); revalidatePath("/owner/artists"); return { ok: true, message: "Access updated. It applies when they next sign in." }; } catch (e) { return { error: msg(e) }; }
}

export async function setJobTitleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  try { const t = await setJobTitle(p, String(formData.get("userId") ?? ""), String(formData.get("jobTitle") ?? "")); revalidatePath("/owner/artists"); return { ok: true, message: t ? `Shown as (${t}).` : "Job title removed." }; } catch (e) { return { error: msg(e) }; }
}

export async function setStaffStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const status = formData.get("status") === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
  try { await setStaffStatus(p, String(formData.get("userId") ?? ""), status); revalidatePath("/owner/artists"); revalidatePath("/artists"); return { ok: true, message: status === "SUSPENDED" ? "Suspended and signed out everywhere." : "Reactivated." }; } catch (e) { return { error: msg(e) }; }
}
