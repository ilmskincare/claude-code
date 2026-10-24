import { PublicShell } from "@/components/shells";
import { StudioPromotionBanner } from "@/components/promotion-ribbon";
import { livePromotions } from "@/lib/promotions";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { studio } = await livePromotions();
  return <PublicShell banner={<StudioPromotionBanner promotions={studio} />}>{children}</PublicShell>;
}
