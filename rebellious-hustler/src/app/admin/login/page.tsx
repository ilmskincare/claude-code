import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  const admin = await getAdmin();
  if (admin) redirect(admin.mustChangePassword ? "/admin/password" : "/admin");
  return (
    <div className="mx-auto max-w-sm py-8">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-1 text-2xl font-extrabold">Sign in</h1>
      <p className="hint mt-1">Staff only. Five wrong tries locks the account for 15 minutes.</p>
      <div className="card mt-6 p-5">
        <LoginForm />
      </div>
    </div>
  );
}
