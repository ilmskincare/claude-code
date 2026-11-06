import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE } from "@/lib/site";

// Self-hosted (SIL OFL) so builds never depend on Google Fonts being reachable. See src/app/fonts/LICENSE.txt.
const script = localFont({ src: "./fonts/pinyon-script-latin.woff2", variable: "--font-pinyon", weight: "400", display: "swap" });
const montserrat = localFont({ src: "./fonts/montserrat-latin.woff2", variable: "--font-montserrat", weight: "400 800", display: "swap" });

const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: "Rebellious Hustler | Birmingham streetwear", template: "%s | Rebellious Hustler" },
  description: SITE.description,
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/brand/rebellious-hustler-crest-192.png", sizes: "192x192", type: "image/png" }], apple: "/brand/rebellious-hustler-crest-192.png" },
  openGraph: { type: "website", siteName: SITE.name, locale: "en_GB", images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Rebellious Hustler crest, Birmingham streetwear" }] },
  twitter: { card: "summary_large_image" },
};

/** Stock, prices and settings are live data; nothing is prerendered at build time. */
export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: "#0a0a0a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${script.variable} ${montserrat.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
