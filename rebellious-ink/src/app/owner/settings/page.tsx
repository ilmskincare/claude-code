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
  { key: "gumball.pricePence", label: "Gumball: fixed price (pence)", hint: "£30 total, shown before the spin.", def: 3000 },
  { key: "gumball.depositPence", label: "Gumball: deposit when booking (pence)", hint: "£10, deducted on the day.", def: 1000 },
  { key: "gumball.spinsPerDay", label: "Gumball: spins per person per day", hint: "1 keeps it meaningful.", def: 1 },
  { key: "gumball.minStock", label: "Gumball: minimum designs before the machine shows as restocking", hint: "5.", def: 5 },
  { key: "gumball.enabled", label: "Gumball: machine switched on", hint: "true/false.", def: true },
  { key: "flash.smallPence", label: "Flash: default price (pence)", hint: "£60. Changing this updates every design without its own price.", def: 6000 },
  { key: "flash.sizeOptionsCm", label: "Flash: size options the client can pick (JSON list of cm)", hint: "All the same price; the last is the maximum. Bigger is a custom price from the desk.", def: [4, 5, 6, 7, 8] },
  { key: "flash.apprenticeSmallPence", label: "Flash: apprentice price (pence)", hint: "£40.", def: 4000 },
  { key: "flash.depositSmallPence", label: "Flash: deposit (pence)", hint: "£20, deducted from the total.", def: 2000 },
  { key: "flash.apprenticeDepositPence", label: "Flash: apprentice deposit (pence)", hint: "£15.", def: 1500 },
  { key: "flash.smallMaxCm", label: "Flash: size shown on sheets and guides (cm)", hint: "Should match the largest size option.", def: 8 },
  { key: "flash.minutesSmall", label: "Flash: diary minutes per flash tattoo", hint: "60, plus buffers.", def: 60 },
  { key: "flash.designHoldMinutes", label: "Flash: one-off design hold while booking (minutes)", hint: "15.", def: 15 },
    { key: "flash.fixedPlacements", label: "Flash: flat, easy placements the fixed price applies to (JSON list)", hint: "Anywhere else is a custom price from the desk.", def: ["upper arm (outer)", "forearm (outer)", "forearm (inner)", "shoulder (top)", "thigh (outer)", "calf"] },
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
