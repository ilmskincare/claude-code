"use client";
import { useActionState, useState } from "react";
import { submitEnquiry } from "@/app/actions/enquiry";
import { Alert } from "@/components/ui";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ZONES = ["Upper arm", "Forearm", "Hand", "Shoulder", "Chest", "Upper back", "Lower back", "Ribs", "Stomach", "Thigh", "Calf", "Shin", "Foot", "Neck", "Head/face", "Ear", "Nose", "Lip/oral", "Navel", "Other"];

export function EnquiryForm({ artists, preselected, referralCode, initialDescription }: { artists: { slug: string; displayName: string; kind: string }[]; preselected: string; referralCode?: string; initialDescription?: string }) {
  const [state, action, pending] = useActionState(submitEnquiry, undefined);
  const [category, setCategory] = useState("TATTOO");
  const isTattoo = ["TATTOO", "FLASH", "MULTI_SESSION_PROJECT"].includes(category);
  return (
    <form action={action} className="space-y-8" encType="multipart/form-data" noValidate>
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      <fieldset className="card p-6 space-y-4">
        <legend className="text-xl font-bold px-2">About you</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="field" htmlFor="name">Full name</label><input id="name" name="name" className="input" required autoComplete="name" /></div>
          <div><label className="field" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" required autoComplete="email" /><p className="hint">We send your reference and replies here, and you sign in with it.</p></div>
          <div><label className="field" htmlFor="phone">Phone (optional)</label><input id="phone" name="phone" type="tel" className="input" autoComplete="tel" /></div>
          <div><label className="field" htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" className="input" /><p className="hint">Tattooing under-18s is illegal in the UK. We check photographic ID on the day.</p></div>
        </div>
        <label className="flex gap-3 items-start"><input type="checkbox" name="declaredOver18" className="mt-1 size-5" required /><span>I confirm I am 18 or over.</span></label>
      </fieldset>

      <fieldset className="card p-6 space-y-4">
        <legend className="text-xl font-bold px-2">What would you like?</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="field" htmlFor="category">Service</label>
            <select id="category" name="category" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="TATTOO">Tattoo</option><option value="CONSULTATION">Consultation first</option><option value="PIERCING">Piercing</option><option value="FLASH">Flash design</option><option value="MULTI_SESSION_PROJECT">Larger multi-session project</option>
            </select></div>
          <div><label className="field" htmlFor="artistSlug">Artist</label>
            <select id="artistSlug" name="artistSlug" className="select" defaultValue={preselected}>
              <option value="">Match me with an artist</option>
              {artists.map((a) => <option key={a.slug} value={a.slug}>{a.displayName}{a.kind === "PIERCER" ? " (piercer)" : a.kind === "APPRENTICE" ? " (apprentice, supervised)" : ""}</option>)}
            </select></div>
          <div><label className="field" htmlFor="bodyMapZone">Body placement</label><select id="bodyMapZone" name="bodyMapZone" className="select" defaultValue=""><option value="">Choose…</option>{ZONES.map((z) => <option key={z}>{z}</option>)}</select></div>
          <div><label className="field" htmlFor="placement">Placement detail</label><input id="placement" name="placement" className="input" placeholder="e.g. outer left forearm, wrapping" /></div>
          {isTattoo && <>
            <div><label className="field" htmlFor="sizeCm">Approximate size (cm, longest edge)</label><input id="sizeCm" name="sizeCm" type="number" min={1} max={200} className="input" /></div>
            <div><label className="field" htmlFor="style">Style</label><input id="style" name="style" className="input" placeholder="e.g. fine line, traditional, blackwork, realism" /></div>
            <div><label className="field" htmlFor="colour">Colour</label><select id="colour" name="colour" className="select" defaultValue="undecided"><option value="black_and_grey">Black and grey</option><option value="colour">Colour</option><option value="undecided">Not sure yet</option></select></div>
            <div><label className="field" htmlFor="budgetBand">Budget band</label><select id="budgetBand" name="budgetBand" className="select" defaultValue=""><option value="">Prefer not to say</option><option>Under £100</option><option>£100–£250</option><option>£250–£500</option><option>£500–£1,000</option><option>£1,000+</option></select></div>
          </>}
        </div>
        {isTattoo && <div className="flex flex-wrap gap-6"><label className="flex gap-2 items-center"><input type="checkbox" name="isCoverUp" className="size-5" />Cover-up of an existing tattoo</label><label className="flex gap-2 items-center"><input type="checkbox" name="hasScarConcern" className="size-5" />Scar tissue in the area (optional to tell us)</label></div>}
        <div><label className="field" htmlFor="description">Describe your idea</label><textarea id="description" name="description" className="textarea" rows={5} required minLength={10} defaultValue={initialDescription ?? ""} placeholder="What it is, what it means to you, anything you definitely do or don't want." /></div>
        <div><label className="field" htmlFor="references">Reference images (up to 6, JPEG/PNG/WEBP/HEIC, 15 MB each)</label><input id="references" name="references" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="input" capture="environment" /><p className="hint">Private to you and your artist. Never published.</p></div>
      </fieldset>

      <fieldset className="card p-6 space-y-4">
        <legend className="text-xl font-bold px-2">Availability and access</legend>
        <div><span className="field">Preferred days</span><div className="flex flex-wrap gap-3">{DAYS.map((d) => <label key={d} className="flex gap-2 items-center"><input type="checkbox" name="preferredDays" value={d} className="size-5" />{d}</label>)}</div></div>
        <div><label className="field" htmlFor="availabilityNote">Anything about timing?</label><input id="availabilityNote" name="availabilityNote" className="input" placeholder="e.g. weekends only, after 4pm, before my holiday in June" /></div>
        <div><label className="field" htmlFor="accessNeeds">Reasonable adjustments or access needs (optional)</label><textarea id="accessNeeds" name="accessNeeds" className="textarea" rows={2} placeholder="Step-free access, a quieter time, breaks, an interpreter, anything that helps." /></div>
      </fieldset>

      <fieldset className="card p-6 space-y-3">
        <legend className="text-xl font-bold px-2">Privacy</legend>
        <label className="flex gap-3 items-start"><input type="checkbox" name="privacyAccepted" className="mt-1 size-5" required /><span>I have read the <a href="/privacy" className="underline" target="_blank">privacy notice</a> and understand my enquiry, references and messages are used to plan and provide my tattoo or piercing.</span></label>
        <label className="flex gap-3 items-start"><input type="checkbox" name="marketingOptIn" className="mt-1 size-5" /><span>Email me studio news, flash days and offers. Optional, one-click unsubscribe, and we never share or sell your details with anyone else.</span></label>
        <p className="hint">Photography and social media use are separate choices made at your appointment. Nothing is ticked for you.</p>
        <div><label className="field" htmlFor="referralCode">Referral code (optional)</label><input id="referralCode" name="referralCode" className="input uppercase" defaultValue={referralCode ?? ""} placeholder="e.g. CASE-3F2A" maxLength={20} /><p className="hint">Got a code from a friend? You both get studio credit once your first appointment is complete.</p></div>
      </fieldset>
      <input type="hidden" name="source" value="WEBSITE" />
      <button className="btn btn-primary w-full justify-center text-lg" disabled={pending}>{pending ? "Sending…" : "Send my enquiry"}</button>
    </form>
  );
}
