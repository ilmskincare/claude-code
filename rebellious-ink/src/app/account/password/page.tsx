import { requirePrincipal } from "@/lib/session";
import { db } from "@/lib/db";
import { Logo } from "@/components/ui";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Set your password" };

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const p = await requirePrincipal("/account/password");
  const { first } = await searchParams;
  const user = await db.user.findUniqueOrThrow({ where: { id: p.userId }, select: { username: true, mustChangePassword: true } });
  return (
    <div className="dark-shell flex-1 grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6"><Logo size={56} /></div>
        <div className="card p-6">
          <h1 className="text-2xl font-bold">{user.mustChangePassword || first ? "Set your own password" : "Change your password"}</h1>
          <p className="opacity-75 mt-1">{user.mustChangePassword ? "The one-time password you were given only works once. Choose your own now: at least 10 characters." : "At least 10 characters. You will stay signed in here."}</p>
          {!user.username ? <p className="mt-3 text-sm">Your account signs in by email link, so there is no password to set.</p> : <PasswordForm needsCurrent={!user.mustChangePassword} />}
        </div>
      </div>
    </div>
  );
}
