import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { BrandedDocument } from "@/components/branded-document";

export default async function GuidePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const d = await db.documentTemplateVersion.findFirst({ where: { templateKey: key, isCurrent: true } });
  if (!d) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="no-print flex flex-wrap gap-2 mb-4 items-center"><Link href="/guides" className="underline">← All guides</Link><span className="flex-1" /><a href={`/guides/${key}/pdf`} className="btn btn-secondary">Download PDF</a></div>
      <BrandedDocument doc={d} />
    </div>
  );
}
