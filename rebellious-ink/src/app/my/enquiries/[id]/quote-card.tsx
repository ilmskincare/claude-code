"use client";
import { useActionState } from "react";
import { respondQuote } from "@/app/actions/enquiry";
import { Alert } from "@/components/ui";

type Q = { id: string; version: number; scope: string; priceBasis: string; amountPence: number; depositPence: number; estimatedMinutes: number; sessions: number; termsText: string; termsVersion: string; expiresAt: Date | null };
const gbp = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(p / 100);

export function QuoteCard({ quote, artistName }: { quote: Q; artistName: string }) {
  const [state, action, pending] = useActionState(respondQuote, undefined);
  return (
    <section className="card p-5 border-2 border-acid">
      <p className="hint">Quote v{quote.version} from {artistName}</p>
      <h2 className="text-2xl font-bold">{gbp(quote.amountPence)} <span className="text-base font-normal opacity-70">({quote.priceBasis.replace("_", " ")})</span></h2>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm"><div><dt className="hint">Deposit</dt><dd className="font-semibold">{gbp(quote.depositPence)}</dd></div><div><dt className="hint">Estimated time</dt><dd>{Math.round(quote.estimatedMinutes / 60 * 10) / 10} h</dd></div><div><dt className="hint">Sessions</dt><dd>{quote.sessions}</dd></div></dl>
      <p className="mt-3 whitespace-pre-wrap">{quote.scope}</p>
      <details className="mt-3"><summary className="cursor-pointer font-semibold">Booking terms ({quote.termsVersion})</summary><p className="mt-2 text-sm whitespace-pre-wrap">{quote.termsText}</p></details>
      {quote.expiresAt && <p className="hint mt-2">Valid until {new Date(quote.expiresAt).toLocaleDateString("en-GB")}</p>}
      <form action={action} className="mt-4 flex flex-wrap gap-2">
        {state?.error && <Alert tone="danger">{state.error}</Alert>}
        <input type="hidden" name="quoteId" value={quote.id} />
        <button name="decision" value="accept" className="btn btn-primary" disabled={pending}>Accept quote and terms</button>
        <button name="decision" value="decline" className="btn btn-secondary" disabled={pending}>Decline</button>
      </form>
      <p className="hint mt-2">Accepting does not book anything yet: next you choose a time and pay the deposit.</p>
    </section>
  );
}
