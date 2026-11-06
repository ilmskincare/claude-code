import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { generateSlots } from "@/lib/slots";

const rules = [{ weekday: 6, startMinute: 600, endMinute: 1080 }]; // Saturdays 10–18

describe("slot generation", () => {
  it("keeps 10:00 local across the BST → GMT clock change", () => {
    // Clocks go back on Sunday 25 October 2026. Saturday 24 Oct is BST, Saturday 31 Oct is GMT.
    const slots = generateSlots({ from: new Date("2026-10-20T00:00:00Z"), to: new Date("2026-11-01T00:00:00Z"), durationMinutes: 150, rules, busy: [], now: new Date("2026-10-01T00:00:00Z") });
    const first = slots.filter((s) => DateTime.fromJSDate(s.startsAt, { zone: "Europe/London" }).toFormat("yyyy-LL-dd") === "2026-10-24")[0];
    const second = slots.filter((s) => DateTime.fromJSDate(s.startsAt, { zone: "Europe/London" }).toFormat("yyyy-LL-dd") === "2026-10-31")[0];
    expect(first.startsAt.toISOString()).toBe("2026-10-24T09:00:00.000Z"); // 10:00 BST
    expect(second.startsAt.toISOString()).toBe("2026-10-31T10:00:00.000Z"); // 10:00 GMT
  });
  it("removes slots that overlap busy periods and respects minimum notice", () => {
    const busy = [{ startsAt: new Date("2026-10-24T11:00:00Z"), endsAt: new Date("2026-10-24T13:00:00Z") }];
    const slots = generateSlots({ from: new Date("2026-10-24T00:00:00Z"), to: new Date("2026-10-24T23:59:59Z"), durationMinutes: 120, rules, busy, now: new Date("2026-10-23T12:00:00Z"), minNoticeHours: 24 });
    const starts = slots.map((s) => DateTime.fromJSDate(s.startsAt, { zone: "Europe/London" }).toFormat("HH:mm"));
    expect(starts).not.toContain("10:00"); // ends 12:00 BST = 11:00Z, overlaps busy
    expect(starts).toContain("14:00");
    expect(starts).not.toContain("16:30"); // 16:30 + 2h exceeds 18:00
  });

  it("honours a one-off day stored as a calendar date during BST", () => {
    const oneOff = [{ weekday: 2, startMinute: 540, endMinute: 720, validFrom: new Date("2026-07-14T00:00:00Z"), validTo: new Date("2026-07-14T00:00:00Z") }];
    const slots = generateSlots({ from: new Date("2026-07-06T00:00:00Z"), to: new Date("2026-07-26T00:00:00Z"), durationMinutes: 60, rules: oneOff, busy: [], now: new Date("2026-07-01T00:00:00Z") });
    const days = new Set(slots.map((s) => DateTime.fromJSDate(s.startsAt, { zone: "Europe/London" }).toISODate()));
    expect([...days]).toEqual(["2026-07-14"]);
    expect(slots[0].startsAt.toISOString()).toBe("2026-07-14T08:00:00.000Z"); // 09:00 BST
  });
});
