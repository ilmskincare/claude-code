import { describe, expect, it } from "vitest";
import { chairRentModel, commissionModel, breakEvenSalesPence, studioPosition, splitCommission, eligibleBase, WEEKS_PER_MONTH } from "@/lib/finance/calculator";

const base = { weeklyEligibleSalesPence: 50000, weeklyChairRentPence: 20000, studioPercent: 40, activeStations: 3, monthlyOverheadsPence: 200000 };

describe("artist arrangement calculator (acceptance test 6)", () => {
  it("£200 rent and 40% of £500 are equal before costs", () => {
    expect(chairRentModel(base).weeklyStudioReceiptsPence).toBe(20000);
    expect(commissionModel(base).weeklyStudioReceiptsPence).toBe(20000);
    expect(breakEvenSalesPence(20000, 40)).toBe(50000);
  });
  it("artist retains 100% minus rent under Model A and 60% under Model B", () => {
    expect(chairRentModel(base).weeklyArtistRetainedPence).toBe(30000);
    expect(commissionModel(base).weeklyArtistRetainedPence).toBe(30000);
    expect(commissionModel({ ...base, weeklyEligibleSalesPence: 80000 }).weeklyArtistRetainedPence).toBe(48000);
  });
  it("uses 52/12 weeks per month, not 4", () => {
    expect(WEEKS_PER_MONTH).toBeCloseTo(4.3333, 3);
    expect(chairRentModel(base).monthlyStudioReceiptsPence).toBe(Math.round(20000 * 52 / 12));
    expect(studioPosition(base, "rent").weeklyOverheadsPence).toBe(Math.round(200000 / (52 / 12)));
  });
  it("covers £2,000 monthly overheads with three £200 chairs", () => {
    const pos = studioPosition(base, "rent");
    expect(pos.weeklyGrossPence).toBe(60000);
    expect(pos.coversOverheads).toBe(true);
    expect(pos.weeklyNetPence).toBe(60000 - Math.round(200000 / WEEKS_PER_MONTH));
  });
  it("splits commission on the defined eligible base with no lost pence", () => {
    const s = splitCommission(12345, 60);
    expect(s.artistPence + s.studioPence).toBe(12345);
    expect(s.artistPence).toBe(7407);
  });
  it("derives the eligible base per agreement rules", () => {
    expect(eligibleBase({ grossPence: 10000, tipsPence: 1000 }, { excludeTips: true })).toBe(9000);
    expect(eligibleBase({ grossPence: 12000 }, { excludeVat: true, vatPercent: 20 })).toBe(10000);
    expect(eligibleBase({ grossPence: 10000, refundsPence: 10000 }, {})).toBe(0);
  });
});
