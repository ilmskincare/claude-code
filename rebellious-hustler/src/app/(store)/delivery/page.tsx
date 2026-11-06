import type { Metadata } from "next";
import Link from "next/link";
import { formatPence } from "@/lib/money";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Delivery",
  description: "UK delivery options, costs and timescales for Rebellious Hustler orders.",
  alternates: { canonical: "/delivery" },
};

export default async function DeliveryPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="eyebrow">Help</p>
      <h1 className="mt-1 text-3xl font-extrabold">Delivery</h1>
      <div className="prose-rh mt-6">
        <p>We post to addresses in the United Kingdom. Orders are packed at the shop in Birmingham and handed to the courier on the next working day after you order.</p>

        <h2>Options and cost</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th scope="col">Service</th><th scope="col">Cost</th><th scope="col">Arrives</th></tr>
            </thead>
            <tbody>
              <tr><td>UK Standard</td><td>{formatPence(s.shippingStandardPence)}</td><td>2 to 4 working days after dispatch</td></tr>
              <tr><td>UK Express</td><td>{formatPence(s.shippingExpressPence)}</td><td>1 to 2 working days after dispatch</td></tr>
              <tr><td>Free UK delivery</td><td>Free</td><td>On orders over {formatPence(s.freeShippingThresholdPence)}, either service</td></tr>
            </tbody>
          </table>
        </div>

        <h2>Tracking</h2>
        <p>We email you when your order is dispatched. If the service is tracked, the tracking reference is in that email and on your order page.</p>

        <h2>Something not arrived?</h2>
        <p>Give it until the end of the delivery window first. If it has still not turned up, <Link href="/contact">get in touch</Link> with your order number and we will chase it or send a replacement.</p>

        <h2>Collect from the shop</h2>
        <p>Not online yet. If you are local and would rather pick up, message us on Instagram and we will sort it in the shop.</p>
      </div>
    </div>
  );
}
