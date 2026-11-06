import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { setMarketingPreferenceAction } from "@/app/actions/loyalty";
import { PageHeader } from "@/components/ui";

export default async function Preferences() {
  const p = await requirePrincipal("/my/preferences");
  const last = await db.privacyPreference.findFirst({ where: { userId: p.userId, purpose: "MARKETING_EMAIL" }, orderBy: { version: "desc" } });
  const on = Boolean(last?.granted && !last.withdrawnAt);
  return (<>
    <PageHeader title="Your preferences" intro="Each permission is separate and you can change it any time. Treatment emails such as booking confirmations are always sent." />
    <section className="card p-5">
      <h2 className="text-xl font-bold">Studio news and offers by email</h2>
      <p className="mt-1">Currently: <strong>{on ? "on" : "off"}</strong>{last ? ` (changed ${last.grantedAt?.toLocaleDateString("en-GB") ?? last.withdrawnAt?.toLocaleDateString("en-GB") ?? ""})` : ""}</p>
      <form action={setMarketingPreferenceAction} className="mt-3 flex gap-2"><input type="hidden" name="granted" value={on ? "no" : "yes"} /><button className={`btn ${on ? "btn-secondary" : "btn-primary"}`}>{on ? "Turn off" : "Turn on"}</button></form>
    </section>
    <p className="hint mt-4">Photography, portfolio and social media permissions are asked for separately at your appointment and recorded per image.</p>
  </>);
}
