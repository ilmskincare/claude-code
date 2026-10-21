import { RoleKey } from "@/generated/prisma/enums";

/**
 * Capability model. Roles map to default capabilities; memberships may add
 * granular overrides. Record-level scoping (e.g. "only my enquiries") is
 * enforced in the domain services, never by the UI alone.
 */
export const CAPABILITIES = [
  "studio.manage",
  "settings.manage",
  "roster.manage",
  "enquiries.view_all",
  "enquiries.view_assigned",
  "enquiries.create_desk",
  "enquiries.assign",
  "quotes.issue",
  "quotes.approve",
  "bookings.view_all",
  "bookings.view_own",
  "bookings.override",
  "bookings.cancel",
  "finance.view_studio",
  "finance.view_own",
  "finance.verify_manual_payment",
  "finance.refund",
  "finance.export",
  "clients.view_assigned",
  "clients.view_all",
  "health.view_need_to_know",
  "portfolio.manage_own",
  "portfolio.publish",
  "stock.view",
  "stock.manage",
  "documents.manage",
  "audit.view",
  "staff.chat",
  "academy.learn",
  "academy.signoff",
  "ai.use",
  "loyalty.redeem",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const ROLE_DEFAULTS: Record<RoleKey, Capability[]> = {
  OWNER: [...CAPABILITIES],
  STUDIO_MANAGER: [
    "roster.manage", "enquiries.view_all", "enquiries.create_desk", "enquiries.assign", "quotes.approve",
    "bookings.view_all", "bookings.override", "bookings.cancel", "finance.view_studio",
    "finance.verify_manual_payment", "clients.view_all", "stock.view", "stock.manage",
    "documents.manage", "audit.view", "staff.chat", "portfolio.publish", "ai.use", "loyalty.redeem",
  ],
  RECEPTION: [
    "enquiries.view_all", "enquiries.create_desk", "enquiries.assign", "bookings.view_all",
    "clients.view_all", "stock.view", "staff.chat", "loyalty.redeem",
  ],
  RESIDENT_ARTIST: [
    "enquiries.view_assigned", "quotes.issue", "bookings.view_own", "finance.view_own",
    "clients.view_assigned", "health.view_need_to_know", "portfolio.manage_own", "stock.view", "staff.chat", "ai.use",
  ],
  CHAIR_RENT_ARTIST: [
    "enquiries.view_assigned", "quotes.issue", "bookings.view_own", "finance.view_own",
    "clients.view_assigned", "health.view_need_to_know", "portfolio.manage_own", "stock.view", "staff.chat", "ai.use",
  ],
  GUEST_ARTIST: [
    "enquiries.view_assigned", "quotes.issue", "bookings.view_own", "finance.view_own",
    "clients.view_assigned", "health.view_need_to_know", "portfolio.manage_own", "staff.chat",
  ],
  PIERCER: [
    "enquiries.view_assigned", "quotes.issue", "bookings.view_own", "finance.view_own",
    "clients.view_assigned", "health.view_need_to_know", "portfolio.manage_own", "stock.view", "staff.chat",
  ],
  APPRENTICE: ["enquiries.view_assigned", "bookings.view_own", "portfolio.manage_own", "stock.view", "staff.chat", "academy.learn"],
  MENTOR: ["academy.signoff", "staff.chat"],
  CLIENT: [],
  FINANCE_ADVISER: ["finance.view_studio", "finance.export"],
  AI_ASSISTANT: ["ai.use"],
};

export type Principal = {
  userId: string;
  email: string;
  name: string | null;
  roles: RoleKey[];
  capabilities: Set<Capability>;
  artistProfileId: string | null;
  membershipId: string | null;
  isSuspended: boolean;
};

export function capabilitiesFor(roles: RoleKey[], overrides: Record<string, boolean> = {}): Set<Capability> {
  const set = new Set<Capability>();
  for (const r of roles) for (const c of ROLE_DEFAULTS[r] ?? []) set.add(c);
  for (const [k, v] of Object.entries(overrides)) {
    if (!CAPABILITIES.includes(k as Capability)) continue;
    if (v) set.add(k as Capability);
    else set.delete(k as Capability);
  }
  return set;
}

export function can(p: Principal | null | undefined, cap: Capability) {
  return Boolean(p && !p.isSuspended && p.capabilities.has(cap));
}

export function hasRole(p: Principal | null | undefined, ...roles: RoleKey[]) {
  return Boolean(p && roles.some((r) => p.roles.includes(r)));
}

export const STAFF_ROLES: RoleKey[] = [
  "OWNER", "STUDIO_MANAGER", "RECEPTION", "RESIDENT_ARTIST", "CHAIR_RENT_ARTIST", "GUEST_ARTIST", "PIERCER", "APPRENTICE", "MENTOR",
];

export const PRACTITIONER_ROLES: RoleKey[] = ["RESIDENT_ARTIST", "CHAIR_RENT_ARTIST", "GUEST_ARTIST", "PIERCER", "APPRENTICE"];

export function isStaff(p: Principal | null | undefined) {
  return hasRole(p, ...STAFF_ROLES);
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(msg = "You do not have permission to do that.") {
    super(msg);
  }
}
export class NotFoundError extends Error {
  status = 404;
  constructor(msg = "Not found.") {
    super(msg);
  }
}
export class ValidationError extends Error {
  status = 422;
  constructor(msg: string) {
    super(msg);
  }
}

export function assertCan(p: Principal | null | undefined, cap: Capability) {
  if (!can(p, cap)) throw new ForbiddenError();
}
