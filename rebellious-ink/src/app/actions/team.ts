"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { addTeamMember, addTeamMemberSchema } from "@/lib/team";

type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export async function addTeamMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const parsed = addTeamMemberSchema.safeParse({ ...Object.fromEntries(formData.entries()), isPublished: formData.get("isPublished") === "on" });
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  try {
    const r = await addTeamMember(p, parsed.data);
    revalidatePath("/owner/artists"); revalidatePath("/artists"); revalidatePath("/owner/academy");
    return { ok: true, message: r.profile ? `${r.profile.displayName} added. They sign in at /login with ${r.user.email}; a link is emailed to them.` : `${r.user.name} added to the desk. They sign in at /login with ${r.user.email}.` };
  } catch (e) { return { error: msg(e) }; }
}
