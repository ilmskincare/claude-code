import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export default async function ThanksPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const r = await db.bookingRequest.findUnique({ where: { reference }, include: { artist: true } });
  if (!r) notFound();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-acid-deep uppercase tracking-[.3em] text-sm">Enquiry received</p>
      <h1 className="text-4xl font-bold mt-3">Thank you</h1>
      <p className="mt-4 text-lg">Your reference is</p>
      <p className="display text-3xl font-bold mt-1" data-testid="enquiry-reference">{r.reference}</p>
      <p className="mt-6 opacity-85">We have emailed this to you. {r.artist ? `${r.artist.displayName} will` : "The studio will"} reply in your private thread, usually within a few working days.</p>
      <div className="mt-8 flex justify-center gap-3"><Link href="/login" className="btn btn-primary">Sign in to your portal</Link><Link href="/guides" className="btn btn-secondary">Read the preparation guides</Link></div>
    </div>
  );
}
