import { requireCapability } from "@/lib/session";
import { FlashManager } from "@/components/flash-manager";
export default async function OwnerFlash() { await requireCapability("roster.manage"); return <FlashManager basePath="/owner/flash" canBulk />; }
