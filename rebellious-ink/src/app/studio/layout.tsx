import { redirect } from "next/navigation";
import { AppShell } from "@/components/shells";
import { requirePrincipal } from "@/lib/session";
import { can } from "@/lib/rbac";
import { unreadTotal } from "@/lib/chat";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const p = await requirePrincipal("/studio");
  if (!p.artistProfileId && !can(p, "enquiries.view_all")) redirect("/my");
  const unread = await unreadTotal(p).catch(() => 0);
  const nav = [{ href: "/studio", label: "Today" }, { href: "/studio/chat", label: unread ? `Chat (${unread})` : "Chat" }, { href: "/studio/enquiries", label: "My enquiries" }, { href: "/studio/diary", label: "My diary" }, { href: "/studio/hours", label: "My hours" }, { href: "/studio/earnings", label: "My earnings" }, { href: "/studio/portfolio", label: "My portfolio" }, { href: "/studio/flash", label: "My flash" }, { href: "/studio/profile", label: "Profile & rates" }, { href: "/studio/promotions", label: "My promotions" }, { href: "/studio/sales", label: "Retail sales" }, { href: "/studio/stock", label: "Studio stock" }];
  if (p.roles.includes("APPRENTICE")) nav.splice(1, 0, { href: "/studio/academy", label: "My training" });
  return <AppShell principal={p} area="Artist workspace" nav={nav}>{children}</AppShell>;
}
