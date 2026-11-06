import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of sale",
  description: "Terms and conditions for buying from the Rebellious Hustler online shop.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-1 text-3xl font-extrabold">Terms of sale</h1>
      <p className="hint mt-2">Last updated November 2026.</p>
      <div className="prose-rh mt-6">
        <h2>1. Who we are</h2>
        <p>This website is run by <span className="placeholder">[legal entity name]</span>, trading as Rebellious Hustler, at {s.storeAddress || SITE.address}. Company number <span className="placeholder">[company number]</span>. VAT number <span className="placeholder">[VAT number]</span>. Email {s.contactEmail || "us via the contact page"}.</p>

        <h2>2. These terms</h2>
        <p>These terms apply when you buy anything from {SITE.domain}. By placing an order you agree to them. They do not affect your legal rights as a consumer. If you buy in the shop, the usual shop rules apply instead.</p>

        <h2>3. Placing an order</h2>
        <p>When you pay, we send an email confirming we have received your order. That is when the contract between us is made. If we cannot supply something, for example because it sold out before your payment went through or we find a pricing mistake, we will tell you and refund anything you have paid for it.</p>

        <h2>4. Prices and payment</h2>
        <p>Prices are in pounds sterling and include VAT where it applies. Delivery is charged on top and shown before you pay. Payment is taken in full at checkout by card through Stripe. We do not see or store your card details.</p>

        <h2>5. Delivery</h2>
        <p>We deliver to UK addresses only. Delivery options, costs and timescales are on our <Link href="/delivery">delivery page</Link>. The items are your responsibility from the moment they are delivered to the address you gave us.</p>

        <h2>6. Your right to cancel</h2>
        <p>You can cancel an order for any reason within 14 days of receiving it and return the items within a further 14 days. The full details, including who pays for return postage and when you get your refund, are on our <Link href="/returns">returns page</Link>.</p>

        <h2>7. Faulty items</h2>
        <p>Everything we sell must be of satisfactory quality, as described and fit for purpose under the Consumer Rights Act 2015. If it is not, you can reject it within 30 days for a full refund, or ask for a repair or replacement after that. See the <Link href="/returns">returns page</Link>.</p>

        <h2>8. Product descriptions</h2>
        <p>We do our best to show colours and details accurately, but screens differ. Sizes are listed on each product. If you are unsure, message us before you order.</p>

        <h2>9. Our liability</h2>
        <p>We are responsible for losses you suffer that are a foreseeable result of us breaking these terms or failing to use reasonable care. We are not responsible for losses that are not foreseeable, or for business losses. Nothing in these terms limits our liability for death or personal injury caused by negligence, for fraud, or for anything else the law does not let us limit.</p>

        <h2>10. Events outside our control</h2>
        <p>If something outside our control delays your order, such as a courier strike or severe weather, we will let you know and deliver as soon as we can. If the delay is substantial you can cancel and get a refund.</p>

        <h2>11. Complaints</h2>
        <p>If something has gone wrong, <Link href="/contact">tell us</Link> and we will try to put it right. If we cannot agree, you can get free advice from Citizens Advice or take the matter to the courts.</p>

        <h2>12. Law</h2>
        <p>These terms are governed by the law of England and Wales. If you live in Scotland or Northern Ireland you can bring proceedings in your local courts.</p>
      </div>
    </div>
  );
}
