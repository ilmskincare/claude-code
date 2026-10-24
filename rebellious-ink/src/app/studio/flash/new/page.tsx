import { requirePrincipal } from "@/lib/session";
import { flashSettings } from "@/lib/flash";
import { PageHeader, BackLink, Empty } from "@/components/ui";
import { DesignForm } from "@/components/design-forms";
export default async function NewMyDesign() {
  const p = await requirePrincipal("/studio/flash/new"); if (!p.artistProfileId) return <Empty>No practitioner profile on this account.</Empty>;
  const s = await flashSettings();
  return (<><BackLink href="/studio/flash">My flash</BackLink><PageHeader title="Add a design" /><DesignForm artists={[]} fixedArtistId={p.artistProfileId} defaults={{ small: s.smallPence, palm: s.palmPence, apprenticeSmall: s.apprenticeSmallPence, apprenticePalm: s.apprenticePalmPence }} palmEnabled={s.palmEnabled} /></>);
}
