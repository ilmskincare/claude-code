import { PublicShell } from "@/components/shells";
import { StudioPromotionBanner } from "@/components/promotion-ribbon";
import { livePromotions } from "@/lib/promotions";
import { gumballSettings } from "@/lib/gumball";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [{ studio }, gumball] = await Promise.all([livePromotions(), gumballSettings()]);
  return <PublicShell gumball={gumball.enabled} banner={<StudioPromotionBanner promotions={studio} />}>{children}</PublicShell>;
}
