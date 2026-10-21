import { db } from "@/lib/db";
import { EnquiryForm } from "./enquiry-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Make an enquiry" };

export default async function EnquirePage({ searchParams }: { searchParams: Promise<{ artist?: string; ref?: string; design?: string }> }) {
  const { artist, ref, design } = await searchParams;
  const flashDesign = design ? await db.design.findUnique({ where: { id: design }, include: { artist: { select: { slug: true, displayName: true } } } }) : null;
  const artists = await db.artistProfile.findMany({ where: { isPublished: true, acceptsEnquiries: true }, select: { slug: true, displayName: true, kind: true }, orderBy: { displayName: "asc" } });
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title="Tell us what you have in mind" intro="Takes about five minutes. You will get a reference number by email and your artist will reply in your private thread. Nothing is booked or paid until you have agreed a quote." />
      <EnquiryForm artists={artists} preselected={flashDesign?.artist.slug ?? artist ?? ""} referralCode={ref} initialDescription={flashDesign ? `Quote request for flash design "${flashDesign.title}" by ${flashDesign.artist.displayName} (design ${flashDesign.id}). Placement: ` : undefined} />
    </div>
  );
}
