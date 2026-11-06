import { EnquiryStatus } from "@/generated/prisma/enums";

/**
 * Explicit state-transition rules for the enquiry → booking lifecycle.
 * Anything not listed here is rejected by the services with a readable error.
 */
const TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ["NEEDS_INFORMATION", "IN_DISCUSSION", "QUOTED", "DECLINED", "EXPIRED", "CANCELLED"],
  NEEDS_INFORMATION: ["IN_DISCUSSION", "QUOTED", "DECLINED", "EXPIRED", "CANCELLED"],
  IN_DISCUSSION: ["NEEDS_INFORMATION", "QUOTED", "DECLINED", "EXPIRED", "CANCELLED"],
  QUOTED: ["AWAITING_ACCEPTANCE", "IN_DISCUSSION", "DECLINED", "EXPIRED", "CANCELLED"],
  AWAITING_ACCEPTANCE: ["AWAITING_DEPOSIT", "IN_DISCUSSION", "QUOTED", "DECLINED", "EXPIRED", "CANCELLED"],
  AWAITING_DEPOSIT: ["CONFIRMED", "AWAITING_ACCEPTANCE", "EXPIRED", "CANCELLED"],
  CONFIRMED: ["FORMS_PENDING", "CHECKED_IN", "RESCHEDULE_REQUESTED", "CANCELLED", "NO_SHOW"],
  FORMS_PENDING: ["CHECKED_IN", "RESCHEDULE_REQUESTED", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["IN_SESSION", "CANCELLED"],
  IN_SESSION: ["COMPLETED"],
  COMPLETED: ["REFUNDED", "DISPUTED"],
  CANCELLED: ["REFUNDED", "DISPUTED"],
  EXPIRED: ["IN_DISCUSSION"],
  DECLINED: ["IN_DISCUSSION"],
  NO_SHOW: ["CONFIRMED", "REFUNDED", "DISPUTED"],
  RESCHEDULE_REQUESTED: ["CONFIRMED", "AWAITING_DEPOSIT", "CANCELLED"],
  REFUNDED: ["DISPUTED"],
  DISPUTED: ["REFUNDED", "COMPLETED"],
};

export function canTransition(from: EnquiryStatus, to: EnquiryStatus) {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: EnquiryStatus, to: EnquiryStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Cannot move an enquiry from ${label(from)} to ${label(to)}.`);
  }
}

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  NEEDS_INFORMATION: "Needs information",
  IN_DISCUSSION: "In discussion",
  QUOTED: "Quoted",
  AWAITING_ACCEPTANCE: "Awaiting acceptance",
  AWAITING_DEPOSIT: "Awaiting deposit",
  CONFIRMED: "Confirmed",
  FORMS_PENDING: "Forms pending",
  CHECKED_IN: "Checked in",
  IN_SESSION: "In session",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  DECLINED: "Declined",
  NO_SHOW: "No-show",
  RESCHEDULE_REQUESTED: "Reschedule requested",
  REFUNDED: "Refunded",
  DISPUTED: "Disputed",
};

export function label(s: EnquiryStatus) {
  return STATUS_LABELS[s];
}

export const OPEN_STATUSES: EnquiryStatus[] = [
  "NEW", "NEEDS_INFORMATION", "IN_DISCUSSION", "QUOTED", "AWAITING_ACCEPTANCE", "AWAITING_DEPOSIT", "RESCHEDULE_REQUESTED",
];
