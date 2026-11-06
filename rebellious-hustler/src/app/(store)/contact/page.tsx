import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Find Rebellious Hustler at 4 Fox & Goose Shopping Centre, Birmingham, B8 2EP, or message us on Instagram.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSettings();
  const handle = settings.instagramHandle || SITE.instagramHandle;
  const address = settings.storeAddress || SITE.address;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-1 text-3xl font-extrabold">Come and see us</h1>
      <p className="mt-3 max-w-xl text-muted">The quickest way to reach us is a message on Instagram. For anything about an order, email us and quote your order number.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="card p-5" aria-labelledby="shop">
          <h2 id="shop" className="display text-sm text-accent">The shop</h2>
          <address className="mt-3 not-italic leading-relaxed">{address}</address>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm mt-4">Open in maps</a>
        </section>

        <section className="card p-5" aria-labelledby="hours">
          <h2 id="hours" className="display text-sm text-accent">Opening hours</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Monday to Saturday</dt><dd>[opening hours to confirm]</dd></div>
            <div className="flex justify-between"><dt>Sunday</dt><dd>[opening hours to confirm]</dd></div>
          </dl>
          <p className="hint mt-3 text-xs">Hours follow the shopping centre. Check Instagram for bank holidays.</p>
        </section>

        <section className="card p-5" aria-labelledby="online">
          <h2 id="online" className="display text-sm text-accent">Online</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Instagram: <a href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noopener noreferrer" className="text-accent underline">@{handle}</a></li>
            <li>Facebook: <a href={SITE.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">Rebellious Hustler</a></li>
            {settings.contactEmail && <li>Email: <a href={`mailto:${settings.contactEmail}`} className="text-accent underline">{settings.contactEmail}</a></li>}
          </ul>
        </section>

        <section className="card p-5" aria-labelledby="orders">
          <h2 id="orders" className="display text-sm text-accent">About an order</h2>
          <p className="mt-3 text-sm">Email us with your order number (it looks like RH-2026-000123) and what you need. We reply within two working days.</p>
        </section>
      </div>
    </div>
  );
}
