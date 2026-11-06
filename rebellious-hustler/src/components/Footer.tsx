import Link from "next/link";
import { SITE } from "@/lib/site";
import type { Settings } from "@/lib/settings";

export function Footer({ settings }: { settings: Settings }) {
  const handle = settings.instagramHandle || SITE.instagramHandle;
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="script text-[2rem] leading-none">Rebellious Hustler</p>
          <p className="eyebrow mt-2">{SITE.strapline}</p>
          <p className="hint mt-3">Made of hustle, grit and loyalty. Birmingham, UK.</p>
        </div>
        <div>
          <h2 className="display text-sm text-muted">Find us</h2>
          <address className="mt-3 not-italic text-sm leading-relaxed">
            {settings.storeAddress || SITE.address}
          </address>
          {settings.contactEmail && (
            <p className="mt-2 text-sm">
              <a href={`mailto:${settings.contactEmail}`} className="hover:text-gold">{settings.contactEmail}</a>
            </p>
          )}
        </div>
        <div>
          <h2 className="display text-sm text-muted">Follow</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href={`https://www.instagram.com/${handle}/`} className="hover:text-gold" rel="noopener noreferrer" target="_blank">Instagram @{handle}</a></li>
            <li><a href={SITE.facebookUrl} className="hover:text-gold" rel="noopener noreferrer" target="_blank">Facebook</a></li>
          </ul>
        </div>
        <div>
          <h2 className="display text-sm text-muted">Help</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/delivery" className="hover:text-gold">Delivery</Link></li>
            <li><Link href="/returns" className="hover:text-gold">Returns and refunds</Link></li>
            <li><Link href="/contact" className="hover:text-gold">Contact</Link></li>
            <li><Link href="/about" className="hover:text-gold">About</Link></li>
            <li><Link href="/terms" className="hover:text-gold">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-gold">Privacy and cookies</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted">Rebellious Hustler, Birmingham. All prices in GBP and include VAT where applicable.</p>
      </div>
    </footer>
  );
}
