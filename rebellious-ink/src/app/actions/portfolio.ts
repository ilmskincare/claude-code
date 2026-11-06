"use server";
import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/lib/session";
import { db } from "@/lib/db";
import { addPortfolioItem, portfolioItemSchema, removePortfolioItem, setPortfolioCover, setPortfolioPublished } from "@/lib/portfolio";

type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
async function refresh(artistId: string) {
  const a = await db.artistProfile.findUnique({ where: { id: artistId }, select: { slug: true } });
  revalidatePath("/studio/portfolio"); revalidatePath(`/owner/artists/${artistId}/profile`); revalidatePath("/artists"); if (a) revalidatePath(`/artists/${a.slug}`);
}

export async function addPortfolioItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await requirePrincipal();
  const artistId = String(formData.get("artistId") ?? "");
  const parsed = portfolioItemSchema.safeParse({ caption: formData.get("caption") ?? "", styleTags: formData.get("styleTags") ?? "", placement: formData.get("placement") ?? "", isHealed: formData.get("isHealed") === "on", isCover: formData.get("isCover") === "on", permission: formData.get("permission") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  try { const item = await addPortfolioItem(p, artistId, formData.get("photo") as File, parsed.data); await refresh(artistId); return { ok: true, message: item.publishedAt ? "Added and published." : "Added, but kept off the public site until the client's permission is recorded." }; } catch (e) { return { error: msg(e) }; }
}

export async function portfolioItemAction(formData: FormData) {
  const p = await requirePrincipal();
  const itemId = String(formData.get("itemId") ?? ""), artistId = String(formData.get("artistId") ?? ""), op = String(formData.get("op") ?? "");
  if (op === "remove") await removePortfolioItem(p, itemId);
  else if (op === "cover") await setPortfolioCover(p, itemId);
  else if (op === "publish") await setPortfolioPublished(p, itemId, true);
  else if (op === "unpublish") await setPortfolioPublished(p, itemId, false);
  await refresh(artistId);
}
