/**
 * Side-by-side artist arrangement calculator. Pure, unit-tested, all pence.
 * Weekly ↔ monthly conversion uses 52 weeks / 12 months, never a 4-week month.
 */
export const WEEKS_PER_MONTH = 52 / 12;

export type ScenarioInput = {
  weeklyEligibleSalesPence: number; // per artist, defined eligible base
  weeklyChairRentPence: number;     // default 20000
  studioPercent: number;            // default 40
  activeStations: number;
  monthlyOverheadsPence: number;    // default 200000
  cardFeePercent?: number;          // e.g. 1.5
  weeklyConsumablesPence?: number;
};

export type ModelResult = {
  weeklyStudioReceiptsPence: number;
  monthlyStudioReceiptsPence: number;
  weeklyArtistRetainedPence: number;
};

export function chairRentModel(i: ScenarioInput): ModelResult {
  const weekly = i.weeklyChairRentPence;
  return {
    weeklyStudioReceiptsPence: weekly,
    monthlyStudioReceiptsPence: Math.round(weekly * WEEKS_PER_MONTH),
    weeklyArtistRetainedPence: i.weeklyEligibleSalesPence - weekly,
  };
}

export function commissionModel(i: ScenarioInput): ModelResult {
  const weekly = Math.round((i.weeklyEligibleSalesPence * i.studioPercent) / 100);
  return {
    weeklyStudioReceiptsPence: weekly,
    monthlyStudioReceiptsPence: Math.round(weekly * WEEKS_PER_MONTH),
    weeklyArtistRetainedPence: i.weeklyEligibleSalesPence - weekly,
  };
}

/** Weekly sales at which both models yield the same studio gross (before costs, VAT, fees). */
export function breakEvenSalesPence(weeklyChairRentPence: number, studioPercent: number) {
  return Math.round((weeklyChairRentPence * 100) / studioPercent);
}

export function studioPosition(i: ScenarioInput, model: "rent" | "commission") {
  const r = model === "rent" ? chairRentModel(i) : commissionModel(i);
  const weeklyGross = r.weeklyStudioReceiptsPence * i.activeStations;
  const weeklyOverheads = Math.round(i.monthlyOverheadsPence / WEEKS_PER_MONTH);
  const weeklyFees = Math.round((i.weeklyEligibleSalesPence * i.activeStations * (i.cardFeePercent ?? 0)) / 100);
  const weeklyConsumables = (i.weeklyConsumablesPence ?? 0) * i.activeStations;
  const weeklyNet = weeklyGross - weeklyOverheads - weeklyFees - weeklyConsumables;
  return {
    weeklyGrossPence: weeklyGross,
    weeklyOverheadsPence: weeklyOverheads,
    weeklyFeesPence: weeklyFees,
    weeklyConsumablesPence: weeklyConsumables,
    weeklyNetPence: weeklyNet,
    monthlyNetPence: Math.round(weeklyNet * WEEKS_PER_MONTH),
    coversOverheads: weeklyGross >= weeklyOverheads,
  };
}

/** Commission split on a defined eligible base. Rounds artist share down; studio takes the remainder. */
export function splitCommission(eligibleBasePence: number, artistPercent: number) {
  const artist = Math.floor((eligibleBasePence * artistPercent) / 100);
  return { artistPence: artist, studioPence: eligibleBasePence - artist };
}

export type EligibleBaseRules = {
  excludeVat?: boolean;
  vatPercent?: number;
  excludeTips?: boolean;
  excludeCardFees?: boolean;
  excludeMaterials?: boolean;
  excludeDiscounts?: boolean;
};

/** Derive the eligible base for a sale from gross components, per the agreement's rules. */
export function eligibleBase(sale: {
  grossPence: number;
  tipsPence?: number;
  cardFeesPence?: number;
  materialsPence?: number;
  discountsPence?: number;
  refundsPence?: number;
}, rules: EligibleBaseRules) {
  let base = sale.grossPence - (sale.refundsPence ?? 0);
  if (rules.excludeTips) base -= sale.tipsPence ?? 0;
  if (rules.excludeCardFees) base -= sale.cardFeesPence ?? 0;
  if (rules.excludeMaterials) base -= sale.materialsPence ?? 0;
  if (rules.excludeDiscounts === false) base += sale.discountsPence ?? 0; // discounts already netted in gross by default
  if (rules.excludeVat && rules.vatPercent) base = Math.round(base / (1 + rules.vatPercent / 100));
  return Math.max(0, base);
}
