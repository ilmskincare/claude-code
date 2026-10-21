"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrincipal, requirePrincipal } from "@/lib/session";
import { db } from "@/lib/db";
import { spin, bookFromPlay, bookPlaySchema, addRestockAlert, sendRestockAlerts } from "@/lib/gumball";
import { ensureVisitorId, getVisitorId, hasPassedAgeGate, setAgeGatePassed, isEighteen } from "@/lib/visitor";
import { track } from "@/lib/analytics";
import type { ActionState } from "./enquiry";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

/** Date-of-birth check. The date is used once and not stored unless the visitor is signed in and has no date on file. */
export async function ageGateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = String(formData.get("dateOfBirth") ?? "");
  const dob = new Date(raw + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(dob.getTime())) return { error: "Enter your date of birth." };
  if (!isEighteen(dob)) return { error: "You must be 18 or over to play. Tattooing anyone under 18 is against the law in the UK, and photographic ID is checked in the studio." };
  await setAgeGatePassed();
  const visitorId = await ensureVisitorId();
  const p = await getPrincipal();
  if (p) await db.clientProfile.updateMany({ where: { userId: p.userId, dateOfBirth: null }, data: { dateOfBirth: dob } });
  await track("age_gate_passed", { game: "gumball", visitorId, userId: p?.userId ?? null });
  revalidatePath("/play/gumball");
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState signature
export async function spinAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  if (!(await hasPassedAgeGate())) return { error: "Confirm your age first." };
  const visitorId = await ensureVisitorId();
  const p = await getPrincipal();
  let playId: string;
  try { playId = (await spin(visitorId, p?.userId ?? null)).id; } catch (e) { return { error: msg(e) }; }
  revalidatePath("/play/gumball");
  redirect(`/play/gumball/${playId}`);
}

export async function bookPlayAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await getPrincipal();
  const playId = String(formData.get("playId"));
  if (!p) redirect(`/login?next=${encodeURIComponent(`/play/gumball/${playId}`)}`);
  const parsed = bookPlaySchema.safeParse({ ...Object.fromEntries(formData.entries()), declaredOver18: formData.get("declaredOver18") === "on" });
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  let requestId: string;
  try { requestId = (await bookFromPlay(p, await getVisitorId(), parsed.data)).id; } catch (e) { return { error: msg(e) }; }
  revalidatePath("/play/gumball"); revalidatePath("/my");
  redirect(`/my/enquiries/${requestId}/book`);
}

export async function restockAlertAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try { await addRestockAlert(String(formData.get("email") ?? ""), await getVisitorId()); } catch (e) { return { error: msg(e) }; }
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState signature
export async function sendRestockAlertsAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  let n = 0;
  try { n = await sendRestockAlerts(p); } catch (e) { return { error: msg(e) }; }
  revalidatePath("/owner/gumball");
  return { ok: true, error: `${n} alert${n === 1 ? "" : "s"} sent.` };
}
