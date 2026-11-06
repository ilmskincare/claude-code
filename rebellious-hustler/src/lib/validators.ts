import { z } from "zod";
import { parsePoundsToPence } from "./money";

export const AUDIENCES = ["MENS", "WOMENS", "BOYS", "GIRLS", "UNISEX"] as const;
export const CATEGORIES = ["TRACKSUITS", "T_SHIRTS", "HOODIES", "SPORTSWEAR", "ACCESSORIES"] as const;
export const STATUSES = ["DRAFT", "LIVE", "ARCHIVED"] as const;

/** A price typed as pounds ("24.99") that becomes integer pence. */
export const poundsField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const pence = parsePoundsToPence(v);
    if (pence === null) {
      ctx.addIssue({ code: "custom", message: "Enter a price like 24.99" });
      return z.NEVER;
    }
    return pence;
  });

const optionalPoundsField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const pence = parsePoundsToPence(v);
    if (pence === null) {
      ctx.addIssue({ code: "custom", message: "Enter a price like 24.99 or leave it blank" });
      return z.NEVER;
    }
    return pence;
  });

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug needs at least 2 characters")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lower-case letters, numbers and single hyphens");

export const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().trim().min(1, "Size is required").max(20),
  colour: z.string().trim().min(1, "Colour is required").max(30),
  sku: z.string().trim().min(1, "SKU is required").max(40).regex(/^[A-Za-z0-9-]+$/, "SKU: letters, numbers and hyphens only"),
  stockQty: z.coerce.number().int().min(0).max(100000),
});

export const variantsSchema = z
  .array(variantSchema)
  .max(200)
  .superRefine((rows, ctx) => {
    const combos = new Set<string>();
    const skus = new Set<string>();
    rows.forEach((r, i) => {
      const combo = `${r.size.toLowerCase()}|${r.colour.toLowerCase()}`;
      if (combos.has(combo)) ctx.addIssue({ code: "custom", path: [i, "size"], message: `Duplicate size and colour: ${r.size} / ${r.colour}` });
      combos.add(combo);
      const sku = r.sku.toUpperCase();
      if (skus.has(sku)) ctx.addIssue({ code: "custom", path: [i, "sku"], message: `Duplicate SKU: ${r.sku}` });
      skus.add(sku);
    });
  });

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters").max(120),
  slug: slugSchema,
  description: z.string().trim().max(5000).default(""),
  audience: z.enum(AUDIENCES),
  category: z.enum(CATEGORIES),
  price: poundsField,
  compareAt: optionalPoundsField,
  featured: z.boolean().default(false),
  variants: variantsSchema,
});

export type ProductInput = z.infer<typeof productSchema>;

export const settingsSchema = z.object({
  shippingStandard: poundsField,
  shippingExpress: poundsField,
  freeShippingThreshold: poundsField,
  announcement: z.string().trim().max(160).default(""),
  contactEmail: z.email("Enter a valid email address").max(120),
  instagramHandle: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, ""))
    .pipe(z.string().max(40).regex(/^[A-Za-z0-9._]*$/, "Instagram handle: letters, numbers, dots and underscores")),
  storeAddress: z.string().trim().max(300),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username").max(60),
  password: z.string().min(1, "Enter your password").max(200),
});

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password").max(200),
    next: z.string().min(10, "Use at least 10 characters").max(200),
    confirm: z.string().max(200),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "The two passwords do not match" });

export const fulfilSchema = z.object({
  trackingRef: z.string().trim().max(80).default(""),
});

export const orderNoteSchema = z.object({
  adminNote: z.string().trim().max(2000).default(""),
  status: z.enum(["PAID", "FULFILLED", "CANCELLED", "REFUNDED"]).optional(),
});

export const addToCartSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10),
});

export const updateCartSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(10),
});

export const checkoutSchema = z.object({
  shipping: z.enum(["standard", "express"]).default("standard"),
});

export const imageAltSchema = z.string().trim().max(160);

/** Flatten zod issues to { field: message } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
