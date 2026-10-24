"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { addTeamMember, addTeamMemberSchema } from "@/lib/team";

type ActionState = { ok?: boolean; error?: string; message?: string; username?: string; tempPassword?: string } | undefined;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export async function addTeamMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const parsed = addTeamMemberSchema.safeParse({ ...Object.fromEntries(formData.entries()), isPublished: formData.get("isPublished") === "on" });
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  try {
    const r = await addTeamMember(p, parsed.data);
    revalidatePath("/owner/artists"); revalidatePath("/artists"); revalidatePath("/owner/academy");
    const who = r.profile ? r.profile.displayName : r.user.name ?? "They";
    if (r.tempPassword) return { ok: true, username: r.username ?? undefined, tempPassword: r.tempPassword, message: `${who} added. They sign in at /login under "Staff" with the username ${r.username} and this one-time password, then set their own:` };
    return { ok: true, message: `${who} added. They sign in at /login with ${r.user.email}; a link is emailed to them.` };
  } catch (e) { return { error: msg(e) }; }
}
