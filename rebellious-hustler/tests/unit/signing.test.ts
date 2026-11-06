import { describe, expect, it } from "vitest";
import { decodeJson, encodeJson, sign, unsign } from "@/lib/signing";
import { decodeItemsMetadata, encodeItemsMetadata } from "@/lib/stripe";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/passwords";

describe("cookie signing", () => {
  it("round-trips a signed value and rejects tampering", () => {
    const signed = sign("cart_123");
    expect(unsign(signed)).toBe("cart_123");
    expect(unsign(signed.replace("cart_123", "cart_124"))).toBeNull();
    expect(unsign(signed.slice(0, -2) + "zz")).toBeNull();
    expect(unsign("")).toBeNull();
    expect(unsign(undefined)).toBeNull();
    expect(unsign("no-signature")).toBeNull();
  });

  it("encodes JSON payloads as base64url", () => {
    const encoded = encodeJson({ uid: "abc", exp: 1 });
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeJson<{ uid: string }>(encoded)?.uid).toBe("abc");
    expect(decodeJson("not-json")).toBeNull();
  });
});

describe("stripe metadata", () => {
  it("splits long item lists across 480 character chunks and reads them back", () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ variantId: `cmvariant${String(i).padStart(16, "0")}`, quantity: (i % 10) + 1 }));
    const meta = encodeItemsMetadata(items);
    expect(Object.keys(meta).length).toBeGreaterThan(1);
    for (const v of Object.values(meta)) expect(v.length).toBeLessThanOrEqual(500);
    expect(decodeItemsMetadata(meta)).toEqual(items);
  });

  it("drops malformed or out-of-range lines", () => {
    expect(decodeItemsMetadata({ items0: "abc:0|def:11|ghi:3|:2|jkl:x" })).toEqual([{ variantId: "ghi", quantity: 3 }]);
    expect(decodeItemsMetadata(null)).toEqual([]);
    expect(decodeItemsMetadata({})).toEqual([]);
  });
});

describe("passwords", () => {
  it("hashes with scrypt and verifies", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("anything", null)).toBe(false);
  });

  it("explains weak passwords", () => {
    expect(passwordProblem("short")).toMatch(/at least 10/);
    expect(passwordProblem("aaaaaaaaaaaa")).toMatch(/less obvious/);
    expect(passwordProblem("hustler-is-great", "hustler")).toMatch(/username/);
    expect(passwordProblem("grit and loyalty 2026")).toBeNull();
  });
});
