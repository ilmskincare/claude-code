import { AppShell } from "@/components/shells";
import { requireCapability } from "@/lib/session";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const p = await requireCapability("enquiries.view_all", "/owner");
  return <AppShell principal={p} area="Owner command centre" nav={[{ href: "/owner", label: "Overview" }, { href: "/owner/enquiries", label: "Enquiries" }, { href: "/owner/calendar", label: "Planner" }, { href: "/owner/artists", label: "Artists & models" }, { href: "/owner/stock", label: "Stock" }, { href: "/owner/academy", label: "Apprentices" }, { href: "/owner/audit", label: "Audit log" }, { href: "/owner/settings", label: "Settings" }, { href: "/owner/mailbox", label: "Outbox" }]}>{children}</AppShell>;
}
