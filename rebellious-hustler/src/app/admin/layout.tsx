import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/lib/admin-auth";
import { logoutAction } from "./actions";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin | Rebellious Hustler" }, robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="script text-2xl leading-none">Rebellious Hustler</span>
            <span className="badge badge-muted">Admin</span>
          </Link>
          {admin && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hint hidden sm:inline">Signed in as {admin.username}</span>
              <Link href="/" className="btn btn-ghost btn-sm">View shop</Link>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-secondary btn-sm">Sign out</button>
              </form>
            </div>
          )}
        </div>
        {admin && !admin.mustChangePassword && (
          <nav aria-label="Admin" className="border-t border-border">
            <ul className="nav-scroll mx-auto max-w-6xl px-3 py-1">
              {NAV.map((n) => (
                <li key={n.href}><Link href={n.href} className="nav-link">{n.label}</Link></li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
