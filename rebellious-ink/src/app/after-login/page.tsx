import { redirect } from "next/navigation";
import { requirePrincipal } from "@/lib/session";
import { can } from "@/lib/rbac";

/** Route each person to the right experience after sign-in. */
export default async function AfterLogin() {
  const p = await requirePrincipal();
  if (can(p, "studio.manage") || can(p, "enquiries.view_all")) redirect("/owner");
  if (p.artistProfileId) redirect("/studio");
  redirect("/my");
}
