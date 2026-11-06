import { AppShell } from "@/components/shells";
import { requirePrincipal } from "@/lib/session";
import { unreadTotal } from "@/lib/chat";

export default async function MyLayout({ children }: { children: React.ReactNode }) {
  const p = await requirePrincipal("/my");
  const unread = await unreadTotal(p).catch(() => 0);
  return <AppShell principal={p} area="Client portal" nav={[{ href: "/my", label: "My enquiries" }, { href: "/my/messages", label: unread ? `Messages (${unread})` : "Messages" }, { href: "/my/bookings", label: "My bookings" }, { href: "/my/documents", label: "My documents" }, { href: "/my/rewards", label: "Rewards" }, { href: "/my/preferences", label: "Preferences" }, { href: "/enquire", label: "New enquiry" }]}>{children}</AppShell>;
}
