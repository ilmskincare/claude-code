"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addToCart, getOrCreateCartId, readCartId, setCartQuantity } from "@/lib/cart";
import { stripeConfigured } from "@/lib/env";
import { CheckoutError, createCheckoutSession } from "@/lib/stripe";
import { addToCartSchema, checkoutSchema, updateCartSchema } from "@/lib/validators";

export type ActionState = { ok?: boolean; message?: string } | null;

export async function addToCartAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = addToCartSchema.safeParse({ variantId: formData.get("variantId"), quantity: formData.get("quantity") });
  if (!parsed.success) return { ok: false, message: "Choose a size and colour first." };
  const cartId = await getOrCreateCartId();
  const result = await addToCart(cartId, parsed.data.variantId, parsed.data.quantity);
  revalidatePath("/", "layout");
  if (!result.ok) return { ok: false, message: result.message };
  return { ok: true, message: result.message ?? "Added to your cart." };
}

export async function updateCartAction(formData: FormData) {
  const parsed = updateCartSchema.safeParse({ variantId: formData.get("variantId"), quantity: formData.get("quantity") });
  const cartId = await readCartId();
  if (parsed.success && cartId) await setCartQuantity(cartId, parsed.data.variantId, parsed.data.quantity);
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function removeFromCartAction(formData: FormData) {
  const variantId = String(formData.get("variantId") ?? "");
  const cartId = await readCartId();
  if (variantId && cartId) await setCartQuantity(cartId, variantId, 0);
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function startCheckoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!stripeConfigured()) return { ok: false, message: "Online checkout is being connected. Message us on Instagram to order." };
  const cartId = await readCartId();
  if (!cartId) return { ok: false, message: "Your cart is empty." };
  const parsed = checkoutSchema.safeParse({ shipping: formData.get("shipping") ?? "standard" });
  let url: string;
  try {
    url = await createCheckoutSession(cartId, parsed.success ? parsed.data.shipping : "standard");
  } catch (err) {
    if (err instanceof CheckoutError) return { ok: false, message: err.message };
    console.error("checkout failed", err);
    return { ok: false, message: "We could not start the checkout. Please try again in a minute." };
  }
  redirect(url);
}
