import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Rebellious Hustler is a Birmingham clothing brand with a family atmosphere and no discrimination. One brand, one voice, one community.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const settings = await getSettings();
  const handle = settings.instagramHandle || SITE.instagramHandle;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="eyebrow">About</p>
      <h1 className="script mt-2 text-5xl sm:text-6xl">The movement</h1>
      <p className="display mt-4 text-accent">{SITE.straplineDisplay}</p>

      <div className="prose-rh mt-8">
        <p>Rebellious Hustler is a clothing shop in Birmingham. We started with a simple idea: make high quality clothing that the whole family can wear, sell it at a fair price and treat everyone who walks in like one of our own.</p>
        <p>We pride ourselves on being approachable, loyal and honest, with a family atmosphere and no discrimination. Join the movement. One brand, one voice, one community.</p>

        <h2>What we make</h2>
        <p>Tracksuits, t-shirts, hoodies, sportswear and accessories for men, women, boys and girls. Heavy fabrics, clean prints and the crest on everything. Made of hustle, grit and loyalty.</p>

        <h2>Where we are</h2>
        <p>You will find us at {settings.storeAddress || SITE.address}. Come in, try things on, have a chat. Anything you cannot find online, we can usually sort in the shop.</p>

        <h2>Keep up with the drops</h2>
        <p>New pieces go on Instagram first. Follow <a href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noopener noreferrer">@{handle}</a> and message us any time.</p>
      </div>

      <div className="card mt-10 flex flex-col items-center gap-5 p-6 sm:flex-row">
        <Image src="/brand/rebellious-hustler-crest-transparent.png" alt="Rebellious Hustler crest" width={140} height={140} className="shrink-0" />
        <div>
          <p className="text-lg font-bold">Ready to rep the crest?</p>
          <p className="hint mt-1">Shop the full range or come and see us in Fox &amp; Goose.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-primary">Shop now</Link>
            <Link href="/contact" className="btn btn-secondary">Find the shop</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
