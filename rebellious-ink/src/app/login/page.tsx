import { LoginForm } from "./login-form";
import { Logo } from "@/components/ui";
import Link from "next/link";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <div className="dark-shell flex-1 grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block mb-6"><Logo size={56} /></Link>
        <div className="card p-6">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="opacity-75 mt-1">No passwords. We email you a one-time link. Clients, artists and the owner all sign in here.</p>
          {error && <p role="alert" className="mt-3 text-danger">{error === "AccessDenied" ? "This account is suspended. Contact the studio." : "That link is invalid or has expired. Request a new one."}</p>}
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
