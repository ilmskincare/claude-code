import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "700", "900"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Rebellious Ink", template: "%s · Rebellious Ink" },
  description: "Tattoo and piercing studio. Enquire, chat with your artist, agree a quote and book online.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#070807", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${cinzel.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
