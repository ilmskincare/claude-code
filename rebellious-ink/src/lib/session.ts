import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "./db";
import { capabilitiesFor, type Principal, type Capability, can } from "./rbac";

/** Load the current principal (roles + capabilities) once per request. */
export const getPrincipal = cache(async (): Promise<Principal | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { memberships: true, artistProfile: { select: { id: true } } },
  });
  if (!user) return null;
  const membership = user.memberships.find((m) => m.status === "ACTIVE") ?? null;
  const expired = membership?.accessExpiresAt && membership.accessExpiresAt < new Date();
  const roles = membership && !expired ? membership.roles : (["CLIENT"] as const);
  const overrides = (membership?.capabilities as Record<string, boolean>) ?? {};
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    roles: [...roles],
    capabilities: capabilitiesFor([...roles], overrides),
    artistProfileId: user.artistProfile?.id ?? null,
    membershipId: membership?.id ?? null,
    isSuspended: user.isSuspended || membership?.status === "SUSPENDED",
    mustChangePassword: user.mustChangePassword,
  };
});

export async function requirePrincipal(nextPath?: string): Promise<Principal> {
  const p = await getPrincipal();
  if (!p) redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  if (p.isSuspended) redirect("/suspended");
  return p;
}

export async function requireCapability(cap: Capability, nextPath?: string): Promise<Principal> {
  const p = await requirePrincipal(nextPath);
  if (!can(p, cap)) redirect("/forbidden");
  return p;
}
