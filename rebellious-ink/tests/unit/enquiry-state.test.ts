import { describe, expect, it } from "vitest";
import { canTransition, assertTransition } from "@/lib/enquiry-state";

describe("enquiry state machine", () => {
  it("follows the documented path to confirmation", () => {
    for (const [f, t] of [["NEW", "IN_DISCUSSION"], ["IN_DISCUSSION", "QUOTED"], ["QUOTED", "AWAITING_ACCEPTANCE"], ["AWAITING_ACCEPTANCE", "AWAITING_DEPOSIT"], ["AWAITING_DEPOSIT", "CONFIRMED"], ["CONFIRMED", "CHECKED_IN"], ["CHECKED_IN", "IN_SESSION"], ["IN_SESSION", "COMPLETED"]] as const) {
      expect(canTransition(f, t), `${f} → ${t}`).toBe(true);
    }
  });
  it("blocks a client-forced confirmation without a deposit", () => {
    expect(canTransition("NEW", "CONFIRMED")).toBe(false);
    expect(canTransition("AWAITING_ACCEPTANCE", "CONFIRMED")).toBe(false);
    expect(() => assertTransition("QUOTED", "COMPLETED")).toThrow(/Cannot move/);
  });
});
