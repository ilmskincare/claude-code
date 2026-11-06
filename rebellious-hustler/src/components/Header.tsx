import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?audience=mens", label: "Mens" },
  { href: "/shop?audience=womens", label: "Womens" },
  { href: "/shop?audience=boys", label: "Boys" },
  { href: "/shop?audience=girls", label: "Girls" },
];

export function Header({ cartCount }: { cartCount: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-night/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="Rebellious Hustler home">
          <Image src="/brand/icon-64.png" alt="" width={44} height={44} priority className="rounded-full" />
          <span className="script text-[1.9rem] leading-none sm:text-[2.2rem]">Rebellious Hustler</span>
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="nav-link">{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/cart" className="btn btn-secondary btn-sm shrink-0" aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6L5 3H2" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
          <span>Cart</span>
          <span className="badge badge-gold" data-testid="cart-count">{cartCount}</span>
        </Link>
      </div>
      <nav aria-label="Shop sections" className="md:hidden border-t border-border">
        <ul className="nav-scroll px-3 py-1">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="nav-link">{n.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
