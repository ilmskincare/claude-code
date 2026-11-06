"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPrincipal } from "@/lib/session";
import { ensureVisitorId, getVisitorId, hasPassedAgeGate } from "@/lib/visitor";
import { pull, bookFromTrio, bookTrioSchema } from "@/lib/trio";

type ActionState = { ok?: boolean; error?: string } | undefined;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState signature
export async function trioPullAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  if (!(await hasPassedAgeGate())) return { error: "Confirm your age first." };
  const visitorId = await ensureVisitorId();
  const p = await getPrincipal();
  let playId: string;
  try { playId = (await pull(visitorId, p?.userId ?? null)).id; } catch (e) { return { error: msg(e) }; }
  revalidatePath("/play/trio");
  redirect(`/play/trio/${playId}`);
}

export async function bookTrioAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await getPrincipal();
  const playId = String(formData.get("playId"));
  if (!p) redirect(`/login?next=${encodeURIComponent(`/play/trio/${playId}`)}`);
  const parsed = bookTrioSchema.safeParse({ playId, artistId: String(formData.get("artistId") ?? ""), placement: String(formData.get("placement") ?? ""), declaredOver18: formData.get("declaredOver18") === "on" });
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  let requestId: string;
  try { requestId = (await bookFromTrio(p, await getVisitorId(), parsed.data)).id; } catch (e) { return { error: msg(e) }; }
  revalidatePath("/play/trio"); revalidatePath("/my");
  redirect(`/my/enquiries/${requestId}/book`);
}
