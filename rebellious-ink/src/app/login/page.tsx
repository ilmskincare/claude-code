import { LoginForm } from "./login-form";
import { StaffLoginForm } from "./staff-login-form";
import { Logo } from "@/components/ui";
import Link from "next/link";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; staff?: string }> }) {
  const { next, error, staff } = await searchParams;
  return (
    <div className="dark-shell flex-1 grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block mb-6"><Logo size={56} /></Link>
        <div className="card p-6">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <div className="mt-3 flex gap-2" role="tablist" aria-label="How you sign in">
            <Link role="tab" aria-selected={!staff} href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className={`btn ${staff ? "btn-secondary" : "btn-primary"}`}>Clients: email link</Link>
            <Link role="tab" aria-selected={Boolean(staff)} href={`/login?staff=1${next ? `&next=${encodeURIComponent(next)}` : ""}`} className={`btn ${staff ? "btn-primary" : "btn-secondary"}`}>Staff: username</Link>
          </div>
          {error && <p role="alert" className="mt-3 text-danger">{error === "AccessDenied" ? "This account is suspended. Contact the studio." : "That link is invalid or has expired. Request a new one."}</p>}
          {staff ? <><p className="opacity-75 mt-3">Username and password from the owner. Artists, apprentices and the desk.</p><StaffLoginForm next={next} /></> : <><p className="opacity-75 mt-3">No passwords for clients. We email you a one-time link.</p><LoginForm next={next} /></>}
        </div>
      </div>
    </div>
  );
}
