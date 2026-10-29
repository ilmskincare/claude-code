import Link from "next/link";
import { Logo } from "./ui";
import type { Principal } from "@/lib/rbac";
import { can } from "@/lib/rbac";
import { signOutAction } from "@/app/actions/auth";

export function PublicShell({ children, banner, gumball = true }: { children: React.ReactNode; banner?: React.ReactNode; gumball?: boolean }) {
  return (
    <>
      <header className="dark-shell border-b border-graphite">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link href="/" aria-label="Rebellious Ink home"><Logo /></Link>
          <nav aria-label="Main" className="flex flex-wrap items-center justify-end gap-1 text-sm">
            <Link className="nav-link" href="/artists">Artists</Link>
            <Link className="nav-link" href="/flash">Flash</Link>
            {gumball && <Link className="nav-link" href="/play/gumball">Gumball</Link>}
            <Link className="nav-link" href="/guides">Guides</Link>
            <Link className="nav-link" href="/login">Sign in</Link>
            <Link className="btn btn-primary ml-2" href="/enquire">Enquire</Link>
          </nav>
        </div>
      </header>
      {banner}
      <main id="main" className="flex-1">{children}</main>
      <footer className="dark-shell mt-16 border-t border-graphite">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm opacity-80 grid gap-4 md:grid-cols-3">
          <div><Logo size={32} /><p className="mt-2">Tattoo and piercing studio, United Kingdom.<br />18+ for tattooing, photographic ID required.</p></div>
          <div><p className="font-semibold text-acid-bright">Information</p><ul className="mt-1 space-y-1"><li><Link href="/guides">Preparation and aftercare guides</Link></li><li><Link href="/privacy">Privacy notice</Link></li><li><Link href="/enquire">Make an enquiry</Link></li></ul></div>
          <div><p className="font-semibold text-acid-bright">Need medical advice?</p><p className="mt-1">We cannot diagnose. For worsening redness, swelling, heat, pain, pus or fever contact your GP, NHS 111, or 999 in an emergency.</p></div>
        </div>
      </footer>
    </>
  );
}

type NavItem = { href: string; label: string };

export function AppShell({ principal, area, nav, children }: { principal: Principal; area: "Client portal" | "Artist workspace" | "Owner command centre"; nav: NavItem[]; children: React.ReactNode }) {
  const dark = area !== "Client portal";
  return (
    <div className={`min-h-full flex flex-col md:flex-row ${dark ? "dark-shell" : ""}`}>
      <aside className={`md:w-64 shrink-0 border-b md:border-b-0 md:border-r ${dark ? "border-graphite bg-charcoal" : "border-border bg-surface"}`}>
        <div className="p-4 flex items-center justify-between md:block">
          <Link href={nav[0]?.href ?? "/"}><Logo size={36} /></Link>
          <p className={`text-xs uppercase tracking-widest mt-0 md:mt-3 ${dark ? "text-acid-bright" : "text-acid-deep"}`}>{area}</p>
        </div>
        <nav aria-label={area} className="px-2 pb-3 flex md:flex-col gap-1 overflow-x-auto">
          {nav.map((n) => <Link key={n.href} href={n.href} className={dark ? "nav-link whitespace-nowrap" : "px-3 py-2 rounded-lg hover:bg-surface-muted whitespace-nowrap"}>{n.label}</Link>)}
        </nav>
        <div className={`px-4 py-3 text-sm border-t ${dark ? "border-graphite" : "border-border"} flex items-center justify-between gap-2`}>
          <div className="truncate"><span className="font-semibold">{principal.name ?? principal.email}</span><br /><span className="opacity-60 text-xs">{principal.roles.map((r) => r.replace(/_/g, " ").toLowerCase()).join(", ")}</span></div>
          <form action={signOutAction}><button className="underline text-xs">Sign out</button></form>
        </div>
        {can(principal, "studio.manage") && area !== "Owner command centre" && <Link href="/owner" className="block px-4 pb-3 text-xs underline">Switch to owner view</Link>}
        {principal.artistProfileId && area !== "Artist workspace" && <Link href="/studio" className="block px-4 pb-3 text-xs underline">Switch to artist view</Link>}
      </aside>
      <main id="main" className="flex-1 p-4 md:p-8 max-w-6xl w-full">{children}</main>
    </div>
  );
}
