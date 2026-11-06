"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { attemptLogin, clearAdminSession, getAdmin, requireAdmin, setAdminSession } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertAllowedImage, processAndStoreProductImage } from "@/lib/images";
import { sendDispatchEmail } from "@/lib/orders";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/passwords";
import { deletePublicObject } from "@/lib/storage";
import { changePasswordSchema, fieldErrors, fulfilSchema, imageAltSchema, loginSchema, orderNoteSchema, productSchema, settingsSchema } from "@/lib/validators";

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string> } | null;

// ───────────────────────────── Auth ─────────────────────────────

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ username: formData.get("username"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const result = await attemptLogin(parsed.data.username, parsed.data.password);
  if (!result.ok) {
    if (result.reason === "locked") {
      const mins = Math.max(1, Math.ceil(((result.unlockAt?.getTime() ?? Date.now()) - Date.now()) / 60000));
      return { ok: false, message: `Too many wrong tries. Locked for ${mins} ${mins === 1 ? "minute" : "minutes"}.` };
    }
    return { ok: false, message: "Wrong username or password." };
  }
  await setAdminSession(result.user);
  await recordAudit({ actor: parsed.data.username.toLowerCase(), action: "login", entity: "AdminUser", entityId: result.user.id });
  redirect(result.user.mustChangePassword ? "/admin/password" : "/admin");
}

export async function logoutAction() {
  const admin = await getAdmin();
  await clearAdminSession();
  if (admin) await recordAudit({ actor: admin.username, action: "logout", entity: "AdminUser", entityId: admin.id });
  redirect("/admin/login");
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin({ allowPasswordChangeDue: true });
  const parsed = changePasswordSchema.safeParse({ current: formData.get("current"), next: formData.get("next"), confirm: formData.get("confirm") });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await verifyPassword(parsed.data.current, user.passwordHash))) return { ok: false, errors: { current: "That is not your current password." } };
  const problem = passwordProblem(parsed.data.next, user.username);
  if (problem) return { ok: false, errors: { next: problem } };
  if (parsed.data.next === parsed.data.current) return { ok: false, errors: { next: "Choose a different password from the current one." } };
  const updated = await db.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(parsed.data.next), mustChangePassword: false, sessionVersion: { increment: 1 } },
  });
  await setAdminSession(updated);
  await recordAudit({ actor: admin.username, action: "password.change", entity: "AdminUser", entityId: admin.id });
  redirect("/admin?password=changed");
}

// ───────────────────────────── Products ─────────────────────────────

function readProductForm(formData: FormData) {
  let variants: unknown = [];
  try {
    variants = JSON.parse(String(formData.get("variantsJson") ?? "[]"));
  } catch {
    variants = null;
  }
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    audience: formData.get("audience"),
    category: formData.get("category"),
    price: formData.get("price"),
    compareAt: formData.get("compareAt") ?? "",
    featured: formData.get("featured") === "on",
    variants,
  };
}

export async function saveProductAction(productId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = productSchema.safeParse(readProductForm(formData));
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", errors: fieldErrors(parsed.error) };
  const input = parsed.data;
  if (input.variants.length === 0) return { ok: false, message: "Add at least one size and colour.", errors: { variants: "Add at least one variant." } };

  const slugClash = await db.product.findFirst({ where: { slug: input.slug, ...(productId ? { id: { not: productId } } : {}) }, select: { id: true } });
  if (slugClash) return { ok: false, errors: { slug: "Another product already uses this slug." } };
  const skuClash = await db.productVariant.findFirst({ where: { sku: { in: input.variants.map((v) => v.sku.toUpperCase()) }, ...(productId ? { productId: { not: productId } } : {}) }, select: { sku: true } });
  if (skuClash) return { ok: false, errors: { variants: `SKU ${skuClash.sku} is already used by another product.` } };

  const data = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    audience: input.audience,
    category: input.category,
    pricePence: input.price,
    compareAtPence: input.compareAt,
    featured: input.featured,
  };

  const id = await db.$transaction(async (tx) => {
    const before = productId ? await tx.product.findUniqueOrThrow({ where: { id: productId }, include: { variants: true } }) : null;
    const product = productId
      ? await tx.product.update({ where: { id: productId }, data: { ...data, isSample: false } })
      : await tx.product.create({ data: { ...data, status: "DRAFT" } });
    const keepIds = new Set<string>();
    for (const v of input.variants) {
      const sku = v.sku.toUpperCase();
      const existing = before?.variants.find((x) => x.id === v.id) ?? before?.variants.find((x) => x.sku === sku);
      if (existing) {
        await tx.productVariant.update({ where: { id: existing.id }, data: { size: v.size, colour: v.colour, sku, stockQty: v.stockQty } });
        keepIds.add(existing.id);
      } else {
        const created = await tx.productVariant.create({ data: { productId: product.id, size: v.size, colour: v.colour, sku, stockQty: v.stockQty } });
        keepIds.add(created.id);
      }
    }
    if (before) {
      const gone = before.variants.filter((x) => !keepIds.has(x.id)).map((x) => x.id);
      if (gone.length) await tx.productVariant.deleteMany({ where: { id: { in: gone } } });
    }
    const after = await tx.product.findUniqueOrThrow({ where: { id: product.id }, include: { variants: true } });
    await recordAudit({ actor: admin.username, action: productId ? "product.update" : "product.create", entity: "Product", entityId: product.id, before: before ?? undefined, after }, tx);
    return product.id;
  });

  revalidatePath("/", "layout");
  if (!productId) redirect(`/admin/products/${id}?created=1`);
  return { ok: true, message: "Saved." };
}

export async function setProductStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("productId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["DRAFT", "LIVE", "ARCHIVED"].includes(status)) return;
  const before = await db.product.findUnique({ where: { id } });
  if (!before) return;
  if (status === "LIVE") {
    const variants = await db.productVariant.count({ where: { productId: id } });
    if (variants === 0) redirect(`/admin/products/${id}?error=${encodeURIComponent("Add at least one size and colour before publishing.")}`);
  }
  const after = await db.product.update({ where: { id }, data: { status: status as "DRAFT" | "LIVE" | "ARCHIVED" } });
  await recordAudit({ actor: admin.username, action: `product.status.${status.toLowerCase()}`, entity: "Product", entityId: id, before: { status: before.status }, after: { status: after.status } });
  revalidatePath("/", "layout");
  redirect(`/admin/products/${id}`);
}

export async function deleteProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("productId") ?? "");
  const product = await db.product.findUnique({ where: { id }, include: { images: true, variants: { include: { _count: { select: { orderItems: true } } } } } });
  if (!product) return;
  const ordered = product.variants.some((v) => v._count.orderItems > 0);
  if (ordered) redirect(`/admin/products/${id}?error=${encodeURIComponent("This product has been ordered, so it cannot be deleted. Archive it instead.")}`);
  await db.product.delete({ where: { id } });
  for (const img of product.images) {
    if (!img.storageKey.startsWith("placeholders/")) {
      try {
        await deletePublicObject({ key: img.storageKey, url: img.url });
        await deletePublicObject({ key: img.thumbKey, url: img.thumbUrl });
      } catch (err) {
        console.error("image delete failed", err);
      }
    }
  }
  await recordAudit({ actor: admin.username, action: "product.delete", entity: "Product", entityId: id, before: product });
  revalidatePath("/", "layout");
  redirect("/admin/products?deleted=1");
}

// ───────────────────────────── Images ─────────────────────────────

export async function uploadProductImageAction(productId: string, formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const admin = await requireAdmin();
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, name: true } });
  if (!product) return { ok: false, message: "Product not found." };
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, message: "Choose at least one image." };
  let position = (await db.productImage.count({ where: { productId } })) || 0;
  for (const file of files) {
    try {
      assertAllowedImage(file.type, file.size);
    } catch (err) {
      return { ok: false, message: (err as Error).message };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const stored = await processAndStoreProductImage(productId, bytes);
    const image = await db.productImage.create({
      data: { productId, url: stored.full.url, thumbUrl: stored.thumb.url, storageKey: stored.full.key, thumbKey: stored.thumb.key, alt: product.name, position: position++ },
    });
    await recordAudit({ actor: admin.username, action: "image.upload", entity: "ProductImage", entityId: image.id, after: { productId, url: image.url, width: stored.width, height: stored.height } });
  }
  revalidatePath("/", "layout");
  return { ok: true, message: `${files.length} ${files.length === 1 ? "image" : "images"} uploaded.` };
}

export async function deleteProductImageAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("imageId") ?? "");
  const image = await db.productImage.findUnique({ where: { id } });
  if (!image) return;
  await db.productImage.delete({ where: { id } });
  if (!image.storageKey.startsWith("placeholders/")) {
    try {
      await deletePublicObject({ key: image.storageKey, url: image.url });
      await deletePublicObject({ key: image.thumbKey, url: image.thumbUrl });
    } catch (err) {
      console.error("image delete failed", err);
    }
  }
  await recordAudit({ actor: admin.username, action: "image.delete", entity: "ProductImage", entityId: id, before: image });
  revalidatePath("/", "layout");
}

export async function moveProductImageAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("imageId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const image = await db.productImage.findUnique({ where: { id } });
  if (!image) return;
  const siblings = await db.productImage.findMany({ where: { productId: image.productId }, orderBy: { position: "asc" } });
  const index = siblings.findIndex((s) => s.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= siblings.length) return;
  const reordered = [...siblings];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await db.$transaction(reordered.map((s, i) => db.productImage.update({ where: { id: s.id }, data: { position: i } })));
  await recordAudit({ actor: admin.username, action: "image.reorder", entity: "Product", entityId: image.productId, before: siblings.map((s) => s.id), after: reordered.map((s) => s.id) });
  revalidatePath("/", "layout");
}

export async function updateImageAltAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("imageId") ?? "");
  const parsed = imageAltSchema.safeParse(formData.get("alt") ?? "");
  if (!parsed.success) return;
  const before = await db.productImage.findUnique({ where: { id } });
  if (!before) return;
  await db.productImage.update({ where: { id }, data: { alt: parsed.data } });
  await recordAudit({ actor: admin.username, action: "image.alt", entity: "ProductImage", entityId: id, before: { alt: before.alt }, after: { alt: parsed.data } });
  revalidatePath("/", "layout");
}

// ───────────────────────────── Orders ─────────────────────────────

export async function fulfilOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("orderId") ?? "");
  const parsed = fulfilSchema.safeParse({ trackingRef: formData.get("trackingRef") ?? "" });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const before = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!before) return { ok: false, message: "Order not found." };
  if (before.status !== "PAID") return { ok: false, message: `Only paid orders can be marked fulfilled (this one is ${before.status.toLowerCase()}).` };
  const after = await db.order.update({ where: { id }, data: { status: "FULFILLED", trackingRef: parsed.data.trackingRef || null, fulfilledAt: new Date() }, include: { items: true } });
  await recordAudit({ actor: admin.username, action: "order.fulfil", entity: "Order", entityId: id, before: { status: before.status, trackingRef: before.trackingRef }, after: { status: after.status, trackingRef: after.trackingRef } });
  let emailNote = "";
  try {
    const sent = await sendDispatchEmail(after);
    emailNote = sent.sent ? " Dispatch email sent." : " Email not configured, so no dispatch email went out.";
  } catch (err) {
    console.error("dispatch email failed", err);
    emailNote = " The dispatch email failed to send.";
  }
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: `Marked as fulfilled.${emailNote}` };
}

export async function updateOrderNoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("orderId") ?? "");
  const parsed = orderNoteSchema.safeParse({ adminNote: formData.get("adminNote") ?? "", status: formData.get("status") || undefined });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const before = await db.order.findUnique({ where: { id } });
  if (!before) return { ok: false, message: "Order not found." };
  const status = parsed.data.status && ["CANCELLED", "REFUNDED"].includes(parsed.data.status) ? parsed.data.status : before.status;
  const after = await db.order.update({ where: { id }, data: { adminNote: parsed.data.adminNote, status } });
  await recordAudit({ actor: admin.username, action: "order.note", entity: "Order", entityId: id, before: { status: before.status, adminNote: before.adminNote }, after: { status: after.status, adminNote: after.adminNote } });
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: status !== before.status ? `Saved and marked ${status.toLowerCase()}. Refunds are issued in the Stripe dashboard.` : "Note saved." };
}

// ───────────────────────────── Settings ─────────────────────────────

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = settingsSchema.safeParse({
    shippingStandard: formData.get("shippingStandard"),
    shippingExpress: formData.get("shippingExpress"),
    freeShippingThreshold: formData.get("freeShippingThreshold"),
    announcement: formData.get("announcement") ?? "",
    contactEmail: formData.get("contactEmail"),
    instagramHandle: formData.get("instagramHandle") ?? "",
    storeAddress: formData.get("storeAddress") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const data = {
    shippingStandardPence: d.shippingStandard,
    shippingExpressPence: d.shippingExpress,
    freeShippingThresholdPence: d.freeShippingThreshold,
    announcement: d.announcement,
    contactEmail: d.contactEmail,
    instagramHandle: d.instagramHandle,
    storeAddress: d.storeAddress,
  };
  const before = await db.storeSettings.findUnique({ where: { id: "default" } });
  const after = await db.storeSettings.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
  await recordAudit({ actor: admin.username, action: "settings.update", entity: "StoreSettings", entityId: "default", before: before ?? undefined, after });
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}
