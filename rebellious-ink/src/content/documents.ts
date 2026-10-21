/**
 * Rebellious Ink Client Information Library — seed content (version 1).
 * Each entry becomes a DocumentTemplateVersion row. Wording is drafted from
 * UKHSA/CIEH tattoo & piercing guidance, NHS infected-piercing advice and APP
 * aftercare principles, and MUST be approved by the studio's qualified
 * practitioners before it is issued to real clients (approvedAt stays null until then).
 *
 * Lightweight markup: "# " h2, "- " bullet, "> " callout, "! " urgent callout, blank line = paragraph break.
 */
export type SeedDocument = {
  templateKey: string;
  kind: "PREPARATION_GUIDE" | "AFTERCARE_GUIDE" | "INFORMATION";
  title: string;
  procedureType: string;
  bodyMarkdown: string;
};

export const SEED_DOCUMENTS: SeedDocument[] = [
  {
    templateKey: "before-your-tattoo",
    kind: "PREPARATION_GUIDE",
    title: "Before Your Tattoo",
    procedureType: "tattoo",
    bodyMarkdown: `Thank you for booking with Rebellious Ink. This guide helps you arrive ready so your session goes smoothly. It is general preparation advice, not medical advice.

# Your booking
- Check your confirmation email: it shows your artist, date, time, the agreed design and placement plan, your booking reference and the deposit we hold.
- Your deposit is deducted from the final price. The remaining balance is payable on the day by card or cash.
- Need to move your appointment? Give us at least 48 hours' notice so we can offer the slot to someone else and keep your deposit on file.

# The day before
- Get a good night's sleep and avoid alcohol. We will not tattoo anyone who appears intoxicated, and alcohol can increase bleeding.
- Eat a proper meal before you arrive and bring a sugary drink or snack for longer sessions.
- Drink water through the day. Well-hydrated skin takes ink more evenly.
- Avoid sunburn on the area. Freshly burnt or peeling skin cannot be tattooed and we will need to rebook.

# What to wear and bring
- Loose, comfortable clothing that gives easy access to the area and that you do not mind getting ink on.
- Photographic ID (passport, driving licence or PASS card). Tattooing anyone under 18 is illegal in the UK and we check every client.
- Headphones, a book or a charger if you want to relax during a long session.

# Health and medicines
> If you have a skin condition at the site, a bleeding disorder, take medicines that affect clotting or healing, are pregnant or breastfeeding, or have had a reaction to a tattoo before, please tell us before the day. Do not stop any prescribed medicine for a tattoo: ask your GP or pharmacist first.
- If you are unwell, have a cold sore, skin infection or broken skin near the area, let us know and we will rebook. Healing skin needs a healthy immune system.
- Tell your artist about allergies to inks, latex, adhesives or aftercare products.

# On the day
- Arrive clean. Shower, and skip heavy moisturiser, fake tan or perfume on the area.
- Please arrive five to ten minutes early. Late arrival may shorten your session.
- Breaks are fine: just say. One guest may wait in reception; the treatment area is for clients only.
- Plan around healing: avoid swimming, saunas, sunbathing and heavy gym sessions for the first two to three weeks after your tattoo.

# Accessibility
We want everyone to feel welcome. If you have access needs, anxiety about the process or need a quieter environment, tell us when you book and we will plan for it.`,
  },
  {
    templateKey: "before-your-piercing",
    kind: "PREPARATION_GUIDE",
    title: "Before Your Piercing",
    procedureType: "piercing",
    bodyMarkdown: `This guide covers what to expect before a piercing at Rebellious Ink. Your piercer will check your anatomy and suitability on the day: not every piercing suits every body, and we will always tell you honestly.

# Age and ID
- Bring photographic ID. Our current policy is 18+ for all piercings until our reviewed under-18 policy is published.
- Where a piercing is legally available to under-18s with a parent or guardian present, we will tell you in advance what is required.

# Jewellery
- We pierce with implant-grade titanium or other suitable materials. Your piercer will explain the options, sizes and prices before you decide.
- Initial jewellery is deliberately longer to allow for swelling. A follow-up downsize appointment is usually needed after healing begins.

# Before you arrive
- Eat, hydrate and rest. Do not arrive under the influence of alcohol or drugs.
- Arrive clean. For oral piercings, brush your teeth and bring a fresh mouth.
- Tell us about allergies (especially metals), skin conditions at the site, bleeding disorders, relevant medicines, pregnancy or anything else that might affect healing.

# Think about your life for the next few months
- Work or school dress codes, sports, helmets, headphones and sleeping position can all irritate a healing piercing.
- Swimming and submerging the piercing should be avoided during healing.

> Your piercer may decline or suggest a different placement if your anatomy or lifestyle makes a piercing unlikely to heal well. That is about keeping you safe, not about you.

Separate addenda apply for ear and cartilage, facial, oral and body or surface piercings. Ask for the one that matches your piercing.`,
  },
  {
    templateKey: "first-tattoo-what-to-expect",
    kind: "INFORMATION",
    title: "Your First Tattoo: What to Expect",
    procedureType: "tattoo",
    bodyMarkdown: `Nervous? Everyone was once. Here is how a session at Rebellious Ink usually runs.

# 1. Consultation and design
You will have chatted with your artist through your portal about size, placement, style and references. Many artists show the final design on the day; small changes are normal, big ones may need another session.

# 2. Consent and checks
Before anything happens you will complete a short suitability questionnaire and a consent form on a tablet, and we will check your photographic ID. You can ask to discuss any answer privately.

# 3. Stencil placement
Your artist cleans the area, may shave it, and applies a stencil. Look in the mirror, move around and speak up if the position is not right. Nothing is permanent yet.

# 4. The session
Expect a scratching or buzzing sensation. Some areas are more sensitive than others. Ask for breaks, water and snacks whenever you need them. Your artist uses sterile single-use needles and barrier-covered equipment.

# 5. Dressing and aftercare
Your artist will dress the tattoo and tell you exactly which dressing was used and when to remove it. You will receive our Tattoo Aftercare guide by email and in your portal.

# 6. Settling up and follow-up
Pay the balance, book any further sessions and feel free to send a healed photo in a few weeks. We love seeing them.

> Questions to ask your artist: How long will this take? How will it look healed? What should I avoid for the next two weeks? When is the best time to send a healed photo?`,
  },
  {
    templateKey: "cover-ups-and-larger-projects",
    kind: "INFORMATION",
    title: "Cover-ups and Larger Projects",
    procedureType: "tattoo",
    bodyMarkdown: `Cover-ups, reworks and large pieces work differently from a single-session tattoo. This guide sets honest expectations.

# Estimates, not promises
- Multi-session work is quoted as an estimate. The number of sessions can change as the design develops and as we see how your skin heals.
- Each session has its own deposit and booking reference, and the same cancellation terms.

# Design uncertainty is normal
- A cover-up must be larger and usually darker than the existing tattoo. Your artist will show you what is realistic. Some tattoos need lightening by laser before a cover-up is possible; we will say so.
- Scar tissue takes ink unpredictably. We may test a small area first.

# Healed results and records
- With your permission we photograph each stage so you and your artist can track progress. Those photographs stay private unless you separately agree to publication.
- Final judgement on a large piece is only possible once it has fully healed, often two to three months after the last session.

> Keep healing sessions at least four to six weeks apart unless your artist advises otherwise.`,
  },
  {
    templateKey: "tattoo-aftercare",
    kind: "AFTERCARE_GUIDE",
    title: "Tattoo Aftercare",
    procedureType: "tattoo",
    bodyMarkdown: `Your tattoo is a healing wound. Good aftercare protects your skin and the artwork. Follow the dressing instructions your artist documented for you: they override anything generic below.

# Your dressing
Your artist recorded which dressing was used and the removal time on your consent record and in your portal.
- Standard cling or absorbent dressing: remove after the time your artist told you, usually within a few hours. Do not re-wrap.
- Adhesive film dressing (for example a breathable second-skin film): can be left on for the period your artist stated, typically several days, unless it leaks, lifts or irritates. Remove it in a warm shower, peeling slowly and pulling the film back on itself rather than upwards.

# Cleaning
- Wash your hands before touching the tattoo.
- Gently wash with lukewarm water and a mild, fragrance-free soap. Do not scrub.
- Pat dry with clean disposable paper towel. Do not use a shared towel.
- Once the tattoo is dry, apply a thin layer of a suitable fragrance-free moisturiser if your artist advised one. Thin is better than thick.

# What to avoid while healing (usually two to four weeks)
- Picking, scratching or peeling flakes and scabs.
- Swimming, baths, hot tubs, saunas and anything that soaks the tattoo.
- Direct sun and sunbeds. Once healed, use sunscreen to keep colours bright.
- Tight clothing and friction over the area, and letting pets sleep on it.
- Touching it with unwashed hands or letting others touch it.

# What is normal
Redness, mild swelling, oozing of ink and clear fluid in the first day or two, then flaking and itching. Colours look dull while a new layer of skin forms, then brighten.

! Seek prompt medical advice from your GP or NHS 111 if you notice spreading redness, increasing swelling, heat, worsening pain, pus, red streaks, a bad smell, a fever or you feel unwell. Go to A&E or call 999 if you feel seriously ill. Tell them you had a tattoo and when. We cannot diagnose or prescribe, but please let us know too.

# Check in with us
Send a photo through your portal at about two weeks and when healed. Contact the studio with any concerns about how it is healing.`,
  },
  {
    templateKey: "piercing-aftercare-ear-face",
    kind: "AFTERCARE_GUIDE",
    title: "Piercing Aftercare: Ear and Face",
    procedureType: "piercing_ear_face",
    bodyMarkdown: `Healing times vary: earlobes often take six to eight weeks, cartilage and most facial piercings several months to a year. Be patient and keep it simple.

# Cleaning
- Wash your hands before you touch the piercing.
- Clean once or twice a day with sterile saline wound wash (0.9% sodium chloride) from a sealed can or sachet. Spray or soak, then gently rinse away any crust.
- Pat dry with clean disposable paper towel or allow to air dry.
- Do not use alcohol, hydrogen peroxide, tea tree oil, ointments or anything not recommended by your piercer.

# Leave it alone
- Do not twist, turn or spin the jewellery. Movement damages healing tissue and pulls in bacteria.
- Avoid sleeping on the piercing. A travel pillow with a hole can help with ear piercings.
- Keep hair products, make-up, phones and headphones away from the area where you can.
- Keep the jewellery in. Taking it out early can cause the hole to close or trap infection.

# Downsizing
Initial jewellery is longer to allow for swelling. Book a downsize check with your piercer when the swelling settles (often four to eight weeks). Jewellery that is too long catches and prolongs healing.

# What is normal
Some swelling, tenderness, redness and a whitish or pale yellow crust around the jewellery are normal in the early weeks.

! Signs that need medical advice: spreading redness, increasing pain or swelling, heat, thick yellow or green discharge, bleeding that will not stop, or feeling feverish or unwell. Contact your GP or NHS 111. Do not remove the jewellery for a suspected infection unless a clinician tells you to, as the hole can close over and trap infection. Call 999 if you feel seriously ill.

Contact the studio if you are unsure, if jewellery embeds or sinks, or if it is uncomfortable. We will always look and refer you on if needed.`,
  },
  {
    templateKey: "when-to-contact-us",
    kind: "INFORMATION",
    title: "When to Contact Us / When to Seek Medical Help",
    procedureType: "all",
    bodyMarkdown: `Most tattoos and piercings heal without problems. Knowing who to contact makes everything simpler.

# Contact the studio when
- You are unsure whether what you are seeing is normal healing.
- Your dressing has come off early or you have lost your aftercare instructions.
- Jewellery feels wrong, is too tight, has embedded or needs downsizing.
- You have questions about touch-ups, healed photos or your next session.

# Seek medical help when
! Spreading redness, swelling that is getting worse, heat, increasing pain, pus, red streaks, a bad smell, fever, chills or feeling unwell can be signs of infection. Contact your GP or NHS 111. Go to A&E or call 999 if you are seriously unwell, have difficulty breathing or swallowing (especially after an oral piercing), or have an allergic reaction with swelling of the face, lips or throat.

> We are a tattoo and piercing studio, not a clinic. We cannot diagnose, prescribe or treat infections. Telling us helps us look after you and improve our care, but please contact a health professional first if you are worried.

# Useful contacts
- NHS 111 (phone or 111.nhs.uk) for urgent advice that is not an emergency.
- Your GP surgery.
- 999 or A&E in an emergency.`,
  },
  {
    templateKey: "healed-photo-and-review",
    kind: "INFORMATION",
    title: "Healed Photo and Review Guide",
    procedureType: "all",
    bodyMarkdown: `We would love to see how your work has settled. This is completely optional.

# Sending a healed photo
- Wait until the tattoo or piercing is fully healed, usually four to eight weeks for tattoos.
- Natural daylight, no filters, and the whole piece in frame.
- Upload it through your portal. It stays private to you and your artist unless you tell us otherwise.

# Permission to share
Sharing your photo on our portfolio or social media is a separate choice. You can say yes to one and no to another, and you can change your mind later. Anything already published may remain in circulation elsewhere, but we will take it down from our own channels.

# Leaving a review
An honest review helps other people choose a studio. If anything was not right, we would rather hear it directly so we can fix it.`,
  },
];
