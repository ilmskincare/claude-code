import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { PageHeader, Alert } from "@/components/ui";
import { SettingsForm } from "./settings-form";

export const SETTING_DEFS = [
  { key: "finance.monthlyOverheadsPence", label: "Monthly overheads (pence)", hint: "Starting assumption £2,000. Used by the calculator and break-even.", def: 200000 },
  { key: "finance.defaultWeeklyChairRentPence", label: "Default weekly chair rent (pence)", hint: "Model A default £200.", def: 20000 },
  { key: "finance.defaultStudioPercent", label: "Default studio commission (%)", hint: "Model B default 40.", def: 40 },
  { key: "pricing.tattooHourlyMinPence", label: "Illustrative tattoo hourly rate, low (pence)", hint: "£60", def: 6000 },
  { key: "pricing.tattooHourlyMaxPence", label: "Illustrative tattoo hourly rate, high (pence)", hint: "£80", def: 8000 },
  { key: "booking.holdMinutes", label: "Slot hold while paying (minutes)", hint: "Default 20.", def: 20 },
  { key: "booking.minNoticeHours", label: "Minimum booking notice (hours)", hint: "Default 24.", def: 24 },
  { key: "booking.cancellationNoticeHours", label: "Free reschedule notice (hours)", hint: "Default 48; shown in quote terms.", def: 48 },
  { key: "quote.requiresOwnerApproval", label: "Artist quotes need owner approval", hint: "true/false", def: false },
  { key: "piercing.minimumAge", label: "Piercing minimum age (public setting)", hint: "18 until the reviewed under-18 policy is approved.", def: 18 },
  { key: "academy.minimumHours", label: "Apprentice minimum verified hours for junior sign-off", hint: "Studio policy, not a national standard. Default 500.", def: 500 },
  { key: "studio.vatRegistered", label: "Studio is VAT registered", hint: "true/false. Accountant to confirm.", def: false },
  { key: "flash.smallPence", label: "Flash: default Small price (pence)", hint: "£60. Changing this updates every design without its own price.", def: 6000 },
  { key: "flash.palmPence", label: "Flash: default Palm price (pence)", hint: "£110.", def: 11000 },
  { key: "flash.apprenticeSmallPence", label: "Flash: apprentice Small price (pence)", hint: "£40.", def: 4000 },
  { key: "flash.apprenticePalmPence", label: "Flash: apprentice Palm price (pence)", hint: "£70.", def: 7000 },
  { key: "flash.depositSmallPence", label: "Flash: deposit for Small (pence)", hint: "£20, deducted from the total.", def: 2000 },
  { key: "flash.depositPalmPence", label: "Flash: deposit for Palm (pence)", hint: "£30.", def: 3000 },
  { key: "flash.apprenticeDepositPence", label: "Flash: apprentice deposit (pence)", hint: "£15.", def: 1500 },
  { key: "flash.smallMaxCm", label: "Flash: Small max size (cm)", hint: "6.", def: 6 },
  { key: "flash.palmMaxCm", label: "Flash: Palm max size (cm)", hint: "12.", def: 12 },
  { key: "flash.minutesSmall", label: "Flash: diary minutes for Small", hint: "60, plus buffers.", def: 60 },
  { key: "flash.minutesPalm", label: "Flash: diary minutes for Palm", hint: "120, plus buffers.", def: 120 },
  { key: "flash.designHoldMinutes", label: "Flash: one-off design hold while booking (minutes)", hint: "15.", def: 15 },
  { key: "flash.quotePlacements", label: "Flash: placements that need a quote (JSON list)", hint: "Matched by word; these switch the button to Request a quote.", def: ["hands", "fingers", "neck", "face"] },
  { key: "flash.fixedPlacements", label: "Flash: fixed-price placements (JSON list)", hint: "What the client can choose from.", def: ["upper arm", "forearm", "shoulder", "thigh", "calf", "shin", "back", "chest", "ribs", "hip", "ankle", "wrist (outer)"] },
] as const;

export default async function Settings() {
  await requireCapability("settings.manage");
  const rows = await db.studioSetting.findMany();
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return (<>
    <PageHeader title="Settings" intro="Every business assumption is editable here and audited. Legal, VAT and contractual treatment still need your accountant's sign-off." />
    <Alert tone="warn">Tattooing under-18s is blocked by law and has no setting. Piercing age paths follow the published policy only once legally reviewed.</Alert>
    <div className="mt-6"><SettingsForm defs={SETTING_DEFS.map((d) => ({ ...d, value: values[d.key] ?? d.def })).map((d) => ({ ...d, value: Array.isArray(d.value) ? JSON.stringify(d.value) : d.value }))} /></div>
  </>);
}
