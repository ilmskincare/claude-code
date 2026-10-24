import { requirePrincipal } from "@/lib/session";
import { Empty } from "@/components/ui";
import { FlashManager } from "@/components/flash-manager";
export default async function StudioFlash() { const p = await requirePrincipal("/studio/flash"); if (!p.artistProfileId) return <Empty>No practitioner profile on this account.</Empty>; return <FlashManager artistId={p.artistProfileId} basePath="/studio/flash" canBulk={false} />; }
