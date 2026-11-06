import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { getCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, cart] = await Promise.all([getSettings(), getCart()]);
  return (
    <>
      <AnnouncementBar text={settings.announcement} />
      <Header cartCount={cart.count} />
      <main id="main" className="flex-1 w-full">
        {children}
      </main>
      <Footer settings={settings} />
    </>
  );
}
