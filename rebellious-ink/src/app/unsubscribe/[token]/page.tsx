import Link from "next/link";
import { verifyUnsubscribeToken, setMarketingPreference } from "@/lib/marketing";

export default async function Unsubscribe({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userId = verifyUnsubscribeToken(token);
  if (userId) await setMarketingPreference(userId, false, "unsubscribe_link");
  return (
    <div className="flex-1 grid place-items-center p-8">
      <div className="card p-6 max-w-md">
        <h1 className="text-2xl font-bold">{userId ? "You're unsubscribed" : "That link is not valid"}</h1>
        <p className="mt-2">{userId ? "You will not receive studio news or offers by email. Booking emails are unaffected." : "The unsubscribe link may have been altered. Sign in to manage your preferences instead."}</p>
        <Link href="/my/preferences" className="btn btn-primary mt-4">Manage preferences</Link>
      </div>
    </div>
  );
}
