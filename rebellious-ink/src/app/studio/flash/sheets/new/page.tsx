import { requirePrincipal } from "@/lib/session";
import { PageHeader, BackLink, Empty } from "@/components/ui";
import { SheetUploadForm } from "@/components/design-forms";
export default async function NewMySheet() { const p = await requirePrincipal("/studio/flash/sheets/new"); if (!p.artistProfileId) return <Empty>No practitioner profile on this account.</Empty>; return (<><BackLink href="/studio/flash">My flash</BackLink><PageHeader title="Upload a flash sheet" intro="Upload the whole sheet, then drag a box over each design to make it bookable." /><SheetUploadForm artists={[]} fixedArtistId={p.artistProfileId} /></>); }
