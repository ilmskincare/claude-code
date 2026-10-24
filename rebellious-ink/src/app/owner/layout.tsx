import { AppShell } from "@/components/shells";
import { redirect as redirectTo } from "next/navigation";
import { requireCapability } from "@/lib/session";
import { unreadTotal } from "@/lib/chat";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const p = await requireCapability("enquiries.view_all", "/owner");
  if (p.mustChangePassword) redirectTo("/account/password?first=1");
  const unread = await unreadTotal(p).catch(() => 0);
  return <AppShell principal={p} area="Owner command centre" nav={[{ href: "/owner", label: "Overview" }, { href: "/studio/chat", label: unread ? `Chat (${unread})` : "Chat" }, { href: "/owner/reports", label: "Reports" }, { href: "/owner/enquiries", label: "Enquiries" }, { href: "/owner/clients", label: "Clients" }, { href: "/owner/calendar", label: "Planner" }, { href: "/owner/rates", label: "Ask the desk" }, { href: "/owner/artists", label: "Artists & models" }, { href: "/owner/stock", label: "Stock" }, { href: "/owner/academy", label: "Apprentices" }, { href: "/owner/flash", label: "Flash" }, { href: "/owner/gumball", label: "Gumball" }, { href: "/owner/promotions", label: "Promotions" }, { href: "/owner/documents", label: "Documents" }, { href: "/owner/marketing", label: "Marketing" }, { href: "/owner/social", label: "Social" }, { href: "/owner/audit", label: "Audit log" }, { href: "/owner/settings", label: "Settings" }, { href: "/owner/mailbox", label: "Outbox" }]}>{children}</AppShell>;
}
