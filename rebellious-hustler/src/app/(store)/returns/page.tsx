import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Returns and refunds",
  description: "How to return or exchange a Rebellious Hustler order, your 14 day right to cancel and what happens with faulty items.",
  alternates: { canonical: "/returns" },
};

export default async function ReturnsPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="eyebrow">Help</p>
      <h1 className="mt-1 text-3xl font-extrabold">Returns and refunds</h1>
      <div className="prose-rh mt-6">
        <p>Changed your mind, wrong size, or something is not right? Here is how it works. These rights apply to orders placed on this website. They sit alongside your legal rights and do not take anything away from them.</p>

        <h2>Changed your mind: 14 days to cancel</h2>
        <p>Under the Consumer Contracts Regulations 2013 you can cancel an online order for any reason within 14 days of the day you receive it. Tell us you want to cancel by email or Instagram message within that time. You then have a further 14 days to send the items back.</p>
        <ul>
          <li>Items must be unworn, unwashed and in their original condition with any tags still attached. You can try things on for size, as you would in the shop, but not wear them out.</li>
          <li>You pay the return postage unless the item is faulty or we sent the wrong thing. We recommend a tracked service and keeping the receipt, because the items are your responsibility until they reach us.</li>
          <li>We refund the price of the items and the cost of standard delivery. If you chose express delivery we refund the standard rate only.</li>
          <li>We refund within 14 days of receiving the items back (or of you showing proof of posting, if sooner), to the card you paid with.</li>
          <li>If an item comes back worn or damaged beyond what is needed to check it, we can reduce the refund to cover the loss in value.</li>
        </ul>

        <h2>Faulty or wrong items</h2>
        <p>Under the Consumer Rights Act 2015 everything we sell must be of satisfactory quality, as described and fit for purpose. If it is not:</p>
        <ul>
          <li>Within 30 days of delivery you can reject it for a full refund, including the return postage.</li>
          <li>After 30 days and up to six months, we will repair or replace it. If that is not possible or does not work, you get a refund. In the first six months it is assumed the fault was there when you received it unless we can show otherwise.</li>
          <li>After six months you can still claim for up to six years, but you may need to show the fault was present at delivery.</li>
        </ul>
        <p>Send us a photo of the problem with your order number and we will tell you what to do. We cover the return postage for faulty or wrong items.</p>

        <h2>Exchanges</h2>
        <p>Need a different size? The quickest way is to return the item for a refund and place a new order, so the size you want is not sold before your parcel gets back to us. If you are local, bring it into the shop with your order confirmation and we will swap it there.</p>

        <h2>How to return something</h2>
        <ol>
          <li>Email {s.contactEmail || "us"} or message <a href={`https://www.instagram.com/${s.instagramHandle || SITE.instagramHandle}/`} target="_blank" rel="noopener noreferrer">@{s.instagramHandle || SITE.instagramHandle}</a> with your order number and what you are sending back.</li>
          <li>Pack the items with a note of your order number.</li>
          <li>Post to: Returns, Rebellious Hustler, {s.storeAddress || SITE.address}.</li>
          <li>We email you when the refund is on its way. Banks can take up to five working days to show it.</li>
        </ol>

        <h2>Things we cannot take back</h2>
        <p>For hygiene reasons we cannot accept returns on underwear or socks once the packaging is opened, unless they are faulty.</p>

        <p>Questions? <Link href="/contact">Contact us</Link>.</p>
      </div>
    </div>
  );
}
