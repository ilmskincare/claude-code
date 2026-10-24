import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const VISITOR = "ri_visitor", ADULT = "ri_adult";
const YEAR = 60 * 60 * 24 * 365;

/** Anonymous visitor id (a random uuid, nothing personal) used for spin limits and first-party analytics. */
export async function getVisitorId() {
  return (await cookies()).get(VISITOR)?.value ?? null;
}

/** Only callable from a server action or route handler. */
export async function ensureVisitorId() {
  const jar = await cookies();
  const existing = jar.get(VISITOR)?.value;
  if (existing) return existing;
  const id = randomUUID();
  jar.set(VISITOR, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: YEAR, path: "/" });
  return id;
}

export async function hasPassedAgeGate() {
  return (await cookies()).get(ADULT)?.value === "1";
}

/** Records that this browser passed the 18+ check. The date of birth itself is not stored in the cookie. */
export async function setAgeGatePassed() {
  (await cookies()).set(ADULT, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: YEAR, path: "/" });
}

export function isEighteen(dob: Date, now = new Date()) {
  const cutoff = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  return dob <= cutoff;
}
