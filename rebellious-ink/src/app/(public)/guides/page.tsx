import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Preparation and aftercare guides" };

export default async function GuidesPage() {
  const docs = await db.documentTemplateVersion.findMany({ where: { isCurrent: true, approvedAt: { not: null } }, orderBy: [{ kind: "asc" }, { title: "asc" }] });
  const groups = [["PREPARATION_GUIDE", "Preparation"], ["AFTERCARE_GUIDE", "Aftercare"], ["INFORMATION", "Information and policies"], ["CONSENT_FORM", "Consent forms (read before your appointment)"]] as const;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title="Client information library" intro="Branded, version-controlled guides you can read online, download as a PDF or receive by email with your booking. Each guide shows its version and review date." />
      {docs.length === 0 && <p className="opacity-80">Our guides are being finalised and will appear here shortly. Your artist will go through preparation and aftercare with you at your appointment.</p>}
      {groups.map(([kind, label]) => docs.some((d) => d.kind === kind) && (
        <section key={kind} className="mb-10">
          <h2 className="text-2xl font-bold mb-3">{label}</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {docs.filter((d) => d.kind === kind).map((d) => (
              <li key={d.id} className="card p-4"><Link href={`/guides/${d.templateKey}`} className="font-semibold text-lg underline-offset-4 hover:underline">{d.title}</Link><p className="hint mt-1">v{d.version} · review {d.reviewDate.toLocaleDateString("en-GB")}</p></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
