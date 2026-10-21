import { redirect } from "next/navigation";
import { AppShell } from "@/components/shells";
import { requirePrincipal } from "@/lib/session";
import { can } from "@/lib/rbac";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const p = await requirePrincipal("/studio");
  if (!p.artistProfileId && !can(p, "enquiries.view_all")) redirect("/my");
  return <AppShell principal={p} area="Artist workspace" nav={[{ href: "/studio", label: "Today" }, { href: "/studio/enquiries", label: "My enquiries" }, { href: "/studio/diary", label: "My diary" }, { href: "/studio/earnings", label: "My earnings" }, { href: "/studio/portfolio", label: "My portfolio" }]}>{children}</AppShell>;
}
