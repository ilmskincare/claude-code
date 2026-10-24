import Link from "next/link";
import { db } from "@/lib/db";
import { emailProviderConfigured, isProduction } from "@/lib/env";

export default async function CheckEmail({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const devMail = !isProduction() && !emailProviderConfigured() && email ? await db.devMailbox.findFirst({ where: { to: email, subject: { contains: "sign-in" } }, orderBy: { createdAt: "desc" } }) : null;
  const link = devMail?.text.match(/https?:\/\/\S+/)?.[0];
  return (
    <div className="dark-shell flex-1 grid place-items-center px-4 py-12">
      <div className="card p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-2 opacity-80">We sent a sign-in link{email ? ` to ${email}` : ""}. It expires in 24 hours and works once.</p>
        {link && <div className="mt-4 p-3 rounded-lg bg-steel text-sm"><p className="text-warn font-semibold">No email provider configured (development or staging only; never shown in production).</p><p className="mt-1">The link was written to the DevMailbox table instead:</p><a href={link} className="underline break-all text-acid-bright" data-testid="dev-magic-link">{link}</a></div>}
        <Link href="/login" className="inline-block mt-4 underline">Use a different email</Link>
      </div>
    </div>
  );
}
