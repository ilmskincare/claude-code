import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { PasswordForm } from "@/components/admin/PasswordForm";

export const metadata: Metadata = { title: "Change password" };

export default async function PasswordPage() {
  const admin = await requireAdmin({ allowPasswordChangeDue: true });
  return (
    <div className="mx-auto max-w-sm py-8">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-1 text-2xl font-extrabold">Change your password</h1>
      {admin.mustChangePassword ? (
        <p className="mt-2 text-sm text-warn" role="status">You are using the starting password. Pick your own before you carry on.</p>
      ) : (
        <p className="hint mt-1">Use at least 10 characters. Signing in elsewhere will need the new password.</p>
      )}
      <div className="card mt-6 p-5">
        <PasswordForm />
      </div>
    </div>
  );
}
