import { requirePrincipal } from "@/lib/session";
import { rewardsFor } from "@/lib/loyalty";
import { PageHeader, Stat, Alert } from "@/components/ui";
import { formatPence } from "@/lib/money";
import { formatStudio } from "@/lib/time";

export default async function Rewards() {
  const p = await requirePrincipal("/my/rewards");
  const r = await rewardsFor(p.userId);
  if (!r.settings.enabled) return <Alert tone="info">The rewards programme is not running at the moment.</Alert>;
  return (<>
    <PageHeader title="Rewards and referrals" intro={`Earn ${r.settings.earnPercent}% of what you spend back as studio credit, and ${formatPence(r.settings.referralBonusPence)} every time a friend you refer completes their first appointment. They get ${formatPence(r.settings.welcomeCreditPence)} off too.`} />
    <div className="grid sm:grid-cols-3 gap-4 mb-6"><Stat label="Your credit" value={formatPence(r.account.balancePence)} hint={`Redeem ${formatPence(r.settings.minRedeemPence)} or more at the desk`} /><Stat label="Your code" value={r.account.referralCode} /><Stat label="Friends referred" value={r.referrals.length} /></div>
    <section className="card p-5 mb-6"><h2 className="text-xl font-bold">Share your code</h2><p className="mt-1">Give a friend the code <strong>{r.account.referralCode}</strong> to enter on the enquiry form, or send them this link:</p><p className="mt-2 break-all"><a href={r.shareUrl} className="underline">{r.shareUrl}</a></p><p className="hint mt-2">Credit is added once their first appointment is completed. One welcome credit per new client; it cannot be used on deposits.</p></section>
    <h2 className="text-xl font-bold mb-2">History</h2>
    <table className="data"><thead><tr><th>When</th><th>What</th><th>Amount</th></tr></thead><tbody>{r.transactions.map((t) => <tr key={t.id}><td>{formatStudio(t.createdAt, "dd/MM/yy")}</td><td>{t.note}</td><td className={t.amountPence < 0 ? "text-danger" : ""}>{t.amountPence < 0 ? "−" : "+"}{formatPence(Math.abs(t.amountPence))}</td></tr>)}{r.transactions.length === 0 && <tr><td colSpan={3} className="opacity-60">No activity yet.</td></tr>}</tbody></table>
    {r.referrals.length > 0 && <><h2 className="text-xl font-bold mt-8 mb-2">Friends you have referred</h2><ul className="space-y-1">{r.referrals.map((x) => <li key={x.id}>{x.referred.user.name ?? "A friend"} · <span className="badge badge-outline">{x.status.toLowerCase()}</span></li>)}</ul></>}
  </>);
}
