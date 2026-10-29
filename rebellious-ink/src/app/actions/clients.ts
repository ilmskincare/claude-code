"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { deskClientSchema, upsertClientAtDesk } from "@/lib/clients";
import type { ActionState } from "./enquiry";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

export async function deskClientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const parsed = deskClientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  try { await upsertClientAtDesk(p, parsed.data); } catch (e) { return { error: msg(e) }; }
  revalidatePath("/owner/clients"); revalidatePath("/owner/marketing");
  return { ok: true };
}
