import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/** `value.signature` where the signature is an HMAC-SHA256 of the value under SESSION_SECRET. */
export function sign(value: string): string {
  return `${value}.${hmac(value)}`;
}

/** Returns the original value when the signature checks out, otherwise null. */
export function unsign(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const at = signed.lastIndexOf(".");
  if (at <= 0) return null;
  const value = signed.slice(0, at);
  const sig = signed.slice(at + 1);
  const expected = hmac(value);
  if (expected.length !== sig.length) return null;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig)) ? value : null;
}

function hmac(value: string) {
  return createHmac("sha256", env().SESSION_SECRET).update(value).digest("base64url");
}

export function encodeJson(data: unknown) {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

export function decodeJson<T>(encoded: string): T | null {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}
