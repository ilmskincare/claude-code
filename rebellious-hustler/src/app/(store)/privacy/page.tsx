import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy and cookies",
  description: "How Rebellious Hustler uses your personal data when you shop online, and the cookies this site sets.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-1 text-3xl font-extrabold">Privacy and cookies</h1>
      <p className="hint mt-2">Last updated November 2026.</p>
      <div className="prose-rh mt-6">
        <p>This notice explains what personal data we collect when you use {SITE.domain}, why, and what your rights are under the UK GDPR and the Data Protection Act 2018. We keep it short and plain.</p>

        <h2>Who is responsible</h2>
        <p>The data controller is <span className="placeholder">[legal entity name]</span>, trading as Rebellious Hustler, {s.storeAddress || SITE.address}. Company number <span className="placeholder">[company number]</span>. Contact us about your data at {s.contactEmail || "the address on the contact page"}.</p>

        <h2>What we collect and why</h2>
        <h3>When you place an order</h3>
        <p>Your name, email address, delivery address and what you bought. We need this to perform the contract with you: to take payment, send the goods, email you about the order and handle returns. Your card details are entered on Stripe&apos;s secure page and never reach our servers. We receive only a payment reference and the last four digits of the card.</p>
        <h3>When you browse</h3>
        <p>Our hosting provider records standard server logs (IP address, browser type, pages requested, time) to keep the site running and secure. We rely on our legitimate interest in running a safe website. We do not run analytics or advertising trackers.</p>
        <h3>When you contact us</h3>
        <p>Whatever you tell us in an email or message, so we can reply. If you message us on Instagram or Facebook, their own privacy policies also apply.</p>

        <h2>Who we share it with</h2>
        <ul>
          <li><strong>Stripe</strong> processes your payment and your delivery address. Stripe is a separate data controller for payment data. See stripe.com/privacy.</li>
          <li><strong>Resend</strong> sends our order confirmation and dispatch emails on our behalf and processes your email address to do so.</li>
          <li><strong>Vercel</strong> hosts the website and stores product photos. Your order data sits in our database on their infrastructure.</li>
          <li><strong>Couriers</strong> get your name, address and, where needed, a contact detail so they can deliver the parcel.</li>
        </ul>
        <p>We do not sell your data and we do not share it with anyone else unless the law requires it.</p>

        <h2>Where it is stored</h2>
        <p>Our providers may process data outside the UK, including in the United States. Where they do, transfers are covered by the UK International Data Transfer Agreement, the UK Addendum to the EU Standard Contractual Clauses, or an adequacy decision.</p>

        <h2>How long we keep it</h2>
        <ul>
          <li>Order records, including your name, address and what you bought, are kept for six years after the end of the tax year of the order, because HMRC requires us to keep accounting records for that long.</li>
          <li>Your cart is held for 30 days and then deleted.</li>
          <li>Emails and messages are deleted once the matter is closed, or after two years at most.</li>
        </ul>

        <h2>Your rights</h2>
        <p>You can ask us for a copy of your data, ask us to correct it, ask us to delete it (where we are not required to keep it), object to how we use it, or ask for it in a portable format. Email us and we will reply within one month. You can also complain to the Information Commissioner&apos;s Office at ico.org.uk.</p>

        <h2>Cookies</h2>
        <p>We only set cookies that are strictly necessary for the site to work, so no cookie banner is needed:</p>
        <ul>
          <li><code>rh_cart</code> remembers which cart is yours. It holds a signed cart reference, nothing personal, and lasts 30 days.</li>
          <li><code>rh_admin</code> is set only when a member of staff signs in to the admin area. It lasts 12 hours.</li>
        </ul>
        <p>Stripe sets its own cookies on its checkout page for fraud prevention. We do not use analytics, advertising or social media cookies.</p>

        <h2>Children</h2>
        <p>We sell children&apos;s clothing but our website is for adults to use. We do not knowingly collect data from anyone under 16.</p>

        <h2>Changes</h2>
        <p>If we change this notice we will update the date at the top. Questions? <Link href="/contact">Contact us</Link>.</p>
      </div>
    </div>
  );
}
