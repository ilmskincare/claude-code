import { AppShell } from "@/components/shells";
import { requirePrincipal } from "@/lib/session";

export default async function MyLayout({ children }: { children: React.ReactNode }) {
  const p = await requirePrincipal("/my");
  return <AppShell principal={p} area="Client portal" nav={[{ href: "/my", label: "My enquiries" }, { href: "/my/bookings", label: "My bookings" }, { href: "/my/documents", label: "My documents" }, { href: "/enquire", label: "New enquiry" }]}>{children}</AppShell>;
}
