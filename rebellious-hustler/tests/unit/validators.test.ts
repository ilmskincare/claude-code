import { describe, expect, it } from "vitest";
import { fieldErrors, productSchema, settingsSchema, slugSchema, variantsSchema } from "@/lib/validators";

const variant = { size: "M", colour: "Black", sku: "RH-TEE-BLA-M", stockQty: "5" };

describe("product validator", () => {
  it("accepts a well formed product and converts prices to pence", () => {
    const result = productSchema.safeParse({
      name: "Script Tee",
      slug: "script-tee",
      description: "A tee.",
      audience: "MENS",
      category: "T_SHIRTS",
      price: "24.99",
      compareAt: "",
      featured: true,
      variants: [variant],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(2499);
      expect(result.data.compareAt).toBeNull();
      expect(result.data.variants[0].stockQty).toBe(5);
    }
  });

  it("rejects bad prices, slugs and enums with readable messages", () => {
    const result = productSchema.safeParse({ name: "X", slug: "Bad Slug!", audience: "DOGS", category: "T_SHIRTS", price: "twenty", compareAt: "x", variants: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.name).toMatch(/at least 2/);
      expect(errors.slug).toBeTruthy();
      expect(errors.audience).toBeTruthy();
      expect(errors.price).toBe("Enter a price like 24.99");
      expect(errors.compareAt).toMatch(/leave it blank/);
    }
  });

  it("lower-cases slugs and rejects double hyphens", () => {
    expect(slugSchema.parse("Script-Tee")).toBe("script-tee");
    expect(slugSchema.safeParse("script--tee").success).toBe(false);
    expect(slugSchema.safeParse("-tee").success).toBe(false);
  });

  it("refuses duplicate size and colour combinations and duplicate SKUs", () => {
    const dupCombo = variantsSchema.safeParse([variant, { ...variant, sku: "OTHER" }]);
    expect(dupCombo.success).toBe(false);
    if (!dupCombo.success) expect(fieldErrors(dupCombo.error)["1.size"]).toMatch(/Duplicate size and colour/);
    const dupSku = variantsSchema.safeParse([variant, { ...variant, size: "L", sku: "rh-tee-bla-m" }]);
    expect(dupSku.success).toBe(false);
    if (!dupSku.success) expect(fieldErrors(dupSku.error)["1.sku"]).toMatch(/Duplicate SKU/);
  });
});

describe("settings validator", () => {
  it("strips the @ from the Instagram handle and converts pounds", () => {
    const result = settingsSchema.safeParse({ shippingStandard: "3.95", shippingExpress: "6.95", freeShippingThreshold: "60", announcement: "Hi", contactEmail: "hello@rebellioushustler.com", instagramHandle: "@rebellious_hustler1", storeAddress: "Birmingham" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.instagramHandle).toBe("rebellious_hustler1");
      expect(result.data.freeShippingThreshold).toBe(6000);
    }
  });

  it("rejects a bad email", () => {
    const result = settingsSchema.safeParse({ shippingStandard: "3.95", shippingExpress: "6.95", freeShippingThreshold: "60", announcement: "", contactEmail: "nope", instagramHandle: "", storeAddress: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).contactEmail).toBe("Enter a valid email address");
  });
});
