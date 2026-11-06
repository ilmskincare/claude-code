-- Rebellious Ink document library, version 1 (23 documents).
-- Generated from src/content/documents.ts. Re-generate rather than hand-editing.
--
-- Idempotent: a document is inserted only if no DocumentTemplateVersion row with the same
-- "templateKey" exists, so it is safe to run more than once and it never overwrites a
-- version the studio has edited or approved.
-- Every row is a DRAFT: "approvedAt" and "approverName" stay NULL until the studio approves
-- the document in the app. The app shows a Draft banner until then.
-- Ids are deterministic text ('doc_v1_' + templateKey); the column is text, so any unique value works.
--
-- Run as a single transaction:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f prisma/sql/document-library-v1.sql

-- before-your-tattoo (PREPARATION_GUIDE)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_before-your-tattoo', 'before-your-tattoo', 1, 'PREPARATION_GUIDE'::"DocumentKind",
  $t$Before Your Tattoo$t$, $p$tattoo$p$, 'en-GB',
  $body$Thank you for booking with Rebellious Ink. This guide helps you arrive ready so your session goes smoothly. It is general preparation advice, not medical advice.

# Your booking
- Check your confirmation email. It shows your artist, date, time, the agreed design and placement plan, your booking reference and the deposit we hold.
- Your deposit is deducted from the final price. The remaining balance is payable on the day by card or cash.
- Need to move your appointment? Give us at least 48 hours' notice. Our Deposits, Cancellations and Refunds guide explains exactly how this works.

# The day before
- Get a good night's sleep and avoid alcohol. We will not tattoo anyone who appears intoxicated, and alcohol can increase bleeding.
- Eat a proper meal before you arrive and bring a sugary drink or snack for longer sessions.
- Drink water through the day. Well-hydrated skin takes ink more evenly.
- Keep the area moisturised in the days before, and avoid sunburn. Freshly burnt or peeling skin cannot be tattooed and we will need to rebook.
- Do not shave the area yourself unless we ask you to. Your artist will prepare the skin with a clean, single-use razor if needed.

# What to wear and bring
- Loose, comfortable clothing that gives easy access to the area and that you do not mind getting ink on.
- Photographic ID: a passport, photocard driving licence or PASS-accredited proof-of-age card. Tattooing anyone under 18 is illegal in the UK and we check every client, every time. Our Age and ID Policy has the detail.
- Headphones, a book or a charger if you want to relax during a long session.

# Health and medicines
> If you have a skin condition at the site, a bleeding disorder, take medicines that affect clotting or healing, are pregnant or breastfeeding, or have had a reaction to a tattoo before, please tell us before the day. Do not stop any prescribed medicine for a tattoo: ask your GP or pharmacist first.
- If you are unwell, have a cold sore, skin infection or broken skin near the area, let us know and we will rebook. Healing skin needs a healthy immune system.
- Tell your artist about allergies to inks, latex, adhesives or aftercare products. Our Allergies and Patch Tests guide explains more.
- Our Pregnancy and Medical Conditions guide lists the situations where we may decline or ask for your GP's advice first.
- We cannot tattoo over a mole. If you have noticed a mole that has changed, see your GP.

# On the day
- Arrive clean. Shower, and skip heavy moisturiser, fake tan or perfume on the area.
- Please arrive five to ten minutes early. Late arrival may shorten your session.
- You will complete a short health questionnaire and consent form, and we will check your ID before we start.
- Breaks are fine: just say. One guest may wait in reception; the treatment area is for clients only.
- Plan around healing: avoid swimming, saunas, sunbathing and heavy gym sessions for the first two to three weeks after your tattoo.

# Accessibility
We want everyone to feel welcome. If you have access needs, anxiety about the process or need a quieter environment, tell us when you book and we will plan for it.

> Practitioner to confirm: the list of accepted photographic ID, the lateness rule, and that the studio's practice is for the artist (not the client) to shave the area.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'before-your-tattoo'
);

-- before-your-piercing (PREPARATION_GUIDE)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_before-your-piercing', 'before-your-piercing', 1, 'PREPARATION_GUIDE'::"DocumentKind",
  $t$Before Your Piercing$t$, $p$piercing$p$, 'en-GB',
  $body$This guide covers what to expect before a piercing at Rebellious Ink. Your piercer will check your anatomy and suitability on the day. Not every piercing suits every body, and we will always tell you honestly.

# Age and ID
- Bring photographic ID. Our Age and ID Policy sets out the rules for each age group and each type of piercing.
- Online enquiries for piercing are currently for adults (18 and over). If you are under 18, please email the studio before you book so we can explain what is possible.

# Jewellery
- We pierce with implant-grade titanium or other suitable materials. Your piercer will explain the options, sizes and prices before you decide.
- Initial jewellery is deliberately longer to allow for swelling. A follow-up downsize appointment is usually needed after healing begins.
- If you know you react to certain metals, tell us. Our Allergies and Patch Tests guide explains more.

# Before you arrive
- Eat, hydrate and rest. Do not arrive under the influence of alcohol or drugs.
- Arrive clean. For oral piercings, brush your teeth and avoid strong-smelling food just before.
- Tell us about allergies (especially metals), skin conditions at the site, bleeding disorders, relevant medicines, pregnancy or anything else that might affect healing. Our Pregnancy and Medical Conditions guide lists what we ask about.
- You will complete a short health questionnaire and consent form, and we will check your ID before we start.

# Think about your life for the next few months
- Work or school dress codes, sports, helmets, headphones, face masks and sleeping position can all irritate a healing piercing.
- Swimming and submerging the piercing should be avoided during healing.
- Healing takes weeks to months, and some piercings take a year or more. Be ready for that commitment.

> Your piercer may decline or suggest a different placement if your anatomy or lifestyle makes a piercing unlikely to heal well. That is about keeping you safe, not about you.

Separate aftercare guides apply for ear and face, oral, navel, nipple and surface, and genital piercings. We will give you the one that matches your piercing.

> Practitioner to confirm: that the wording about online enquiries matches the live website setting for the minimum piercing age, and that implant-grade titanium is the studio's standard material.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'before-your-piercing'
);

-- before-your-consultation (PREPARATION_GUIDE)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_before-your-consultation', 'before-your-consultation', 1, 'PREPARATION_GUIDE'::"DocumentKind",
  $t$Before Your Consultation$t$, $p$general$p$, 'en-GB',
  $body$A consultation is a relaxed chat about your idea before you book. There is no pressure to go ahead. This short guide helps you get the most from it.

# Bring or send
- Reference images that show what you like. Style, colour and mood matter more than copying a picture exactly.
- A clear photo of the area, in good light. For a cover-up, a photo of the existing tattoo in daylight.
- For a piercing, a photo of the area and any jewellery you already like.
- A rough idea of size, colour or jewellery type, and your budget.

# Think about
- Placement. How visible do you want it to be at work, at the gym and in summer?
- How the design will age. Very fine detail and small text may soften over the years.
- Your dates. Tell us about holidays, events, sport and anything else that might clash with healing.

# Questions you might ask
- How long will this take, and how many sessions?
- How much will it cost, and what is the deposit?
- How will it look when healed?
- What should I avoid before and after?

# Age and ID
You must be 18 or over to be tattooed. We check photographic ID before any work starts. Rules for piercing depend on your age and the type of piercing: see our Age and ID Policy.

# Your information
We keep your enquiry, messages and reference images to plan your work. Our Privacy Notice explains how we use them. Health details are collected separately, on the day, and are kept private.

> Practitioner to confirm: whether consultations are free, whether they happen in person, by video or by message, and whether a deposit is taken at or after the consultation.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'before-your-consultation'
);

-- tattoo-aftercare (AFTERCARE_GUIDE)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_tattoo-aftercare', 'tattoo-aftercare', 1, 'AFTERCARE_GUIDE'::"DocumentKind",
  $t$Tattoo Aftercare$t$, $p$tattoo$p$, 'en-GB',
  $body$Your tattoo is a healing wound. Good aftercare protects your skin and the artwork. Follow the dressing instructions your artist documented for you: they override anything generic below.

# Your dressing
Your artist recorded which dressing was used and the removal time on your consent record and in your portal.
- Standard cling or absorbent dressing: remove after the time your artist told you, usually within a few hours. Do not re-wrap.
- Adhesive film dressing (for example a breathable second-skin film): can be left on for the period your artist stated, typically several days, unless it leaks, lifts or irritates. Remove it in a warm shower, peeling slowly and pulling the film back on itself rather than upwards.

# Cleaning
- Wash your hands before touching the tattoo.
- Gently wash with lukewarm water and a mild, fragrance-free soap. Do not scrub.
- Pat dry with clean disposable paper towel. Do not use a shared towel.
- Once the tattoo is dry, apply a thin layer of a suitable fragrance-free moisturiser if your artist advised one. Thin is better than thick. A tattoo that stays wet or sticky is being smothered.
- Do not use antiseptic creams, ointments or anything your artist has not recommended unless a doctor or pharmacist tells you to.

# What to avoid while healing (usually two to four weeks)
- Picking, scratching or peeling flakes and scabs.
- Swimming, baths, hot tubs, saunas and anything that soaks the tattoo.
- Direct sun and sunbeds. Once healed, use sunscreen to keep colours bright.
- Tight clothing and friction over the area, and letting pets sleep on it.
- Touching it with unwashed hands or letting others touch it.
- Heavy sweating and hard exercise in the first few days, and shaving over the area until it has healed.

# What is normal
Redness, mild swelling, oozing of ink and clear fluid in the first day or two, then flaking and itching. Colours look dull while a new layer of skin forms, then brighten. Some itching is normal. Keep your hands off it and gently moisturise instead.

! Seek prompt medical advice from your GP or NHS 111 if you notice spreading redness, increasing swelling, heat, worsening pain, pus, red streaks, a bad smell, a fever or you feel unwell. A rash, raised itchy bumps or blistering that appears in the tattoo and does not settle may be an allergic reaction: see your GP. Go to A&E or call 999 if you feel seriously ill. Tell them you had a tattoo and when. We cannot diagnose or prescribe, but please let us know too.

# Check in with us
Send a photo through your portal at about two weeks and when healed. Contact the studio with any concerns about how it is healing. Once it is fully healed, see our guide on Aftercare for Healed Work and Touch-ups.

> Practitioner to confirm: that the dressing, cleaning and moisturiser advice matches the products and method the studio actually uses, and the healing period the studio quotes.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'tattoo-aftercare'
);

-- piercing-aftercare-ear-face (AFTERCARE_GUIDE)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_piercing-aftercare-ear-face', 'piercing-aftercare-ear-face', 1, 'AFTERCARE_GUIDE'::"DocumentKind",
  $t$Piercing Aftercare: Ear and Face$t$, $p$piercing_ear_face$p$, 'en-GB',
  $body$Healing times vary: earlobes often take six to eight weeks, cartilage and most facial piercings several months to a year. Be patient and keep it simple.

# Cleaning
- Wash your hands before you touch the piercing.
- Clean once or twice a day with sterile saline wound wash (0.9% sodium chloride) from a sealed can or sachet. Spray or soak, then gently rinse away any crust.
- Pat dry with clean disposable paper towel or allow to air dry.
- Do not use alcohol, hydrogen peroxide, tea tree oil, ointments or anything not recommended by your piercer.
- Do not make up your own salt solution. The strength matters and home mixes are not sterile.

# Leave it alone
- Do not twist, turn or spin the jewellery. Movement damages healing tissue and pulls in bacteria.
- Avoid sleeping on the piercing. A travel pillow with a hole can help with ear piercings.
- Keep hair products, make-up, phones, face masks, glasses and headphones away from the area where you can. Snagging is a common cause of setbacks.
- Keep the jewellery in. Taking it out early can cause the hole to close or trap infection.
- Showers are fine. Avoid swimming pools, hot tubs, the sea and lakes while healing.

# Downsizing
Initial jewellery is longer to allow for swelling. Book a downsize check with your piercer when the swelling settles (often four to eight weeks). Jewellery that is too long catches and prolongs healing.

# What is normal
Some swelling, tenderness, redness and a whitish or pale yellow crust around the jewellery are normal in the early weeks. A small bump can appear later, often from irritation. Tell your piercer rather than treating it yourself.

! Signs that need medical advice: spreading redness, increasing pain or swelling, heat, thick yellow or green discharge, bleeding that will not stop, or feeling feverish or unwell. Contact your GP or NHS 111. Do not remove the jewellery for a suspected infection unless a clinician tells you to, as the hole can close over and trap infection. Call 999 if you feel seriously ill.

Contact the studio if you are unsure, if jewellery embeds or sinks, or if it is uncomfortable. We will always look and refer you on if needed.

> Practitioner to confirm: the healing times quoted for the piercings the studio offers, and the point at which the studio recommends the first downsize.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'piercing-aftercare-ear-face'
);

-- piercing-aftercare-oral (AFTERCARE_GUIDE)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_piercing-aftercare-oral', 'piercing-aftercare-oral', 1, 'AFTERCARE_GUIDE'::"DocumentKind",
  $t$Piercing Aftercare: Oral$t$, $p$piercing_oral$p$, 'en-GB',
  $body$This guide covers piercings of the tongue, lip, cheek and inside the mouth. The mouth heals quickly but carries a lot of bacteria, so cleaning and care matter. Healing usually takes several weeks to a few months, depending on the piercing. Your piercer will give you an estimate.

# The first few days
- Swelling is expected. A tongue piercing can swell a lot in the first few days. This is normal.
- Keep your head raised when you sleep for the first few nights.
- Let ice or very cold water melt slowly in your mouth to ease swelling.
- Eat soft, cool or lukewarm foods. Avoid hot drinks, spicy food and very hard or crunchy food while it is tender.

# Cleaning
- Rinse your mouth gently after eating, after drinking anything other than water and before bed. Use sterile saline or an alcohol-free mouthwash as your piercer advised.
- Brush your teeth as normal, gently around the jewellery. Use a new, soft toothbrush.
- On the outside of a lip piercing, clean with sterile saline wound wash from a sealed can or sachet and pat dry with clean paper towel.
- Wash your hands before touching the piercing, and touch it as little as possible.

# Avoid while healing
- Smoking and vaping. They slow healing and increase the risk of problems.
- Alcohol and alcohol-based mouthwash.
- Kissing and oral contact with another person, and sharing cutlery, cups or toothbrushes.
- Playing with the jewellery. Biting or clicking it against your teeth can chip teeth and damage gums.
- Chewing gum, pen tops, fingernails and anything else that goes in your mouth.

# Downsizing and long-term care
Initial jewellery is longer to allow for swelling. Book a downsize check with your piercer once the swelling has settled, so the jewellery does not rub your teeth or gums. Keep seeing your dentist and tell them about your piercing. Take jewellery out or use a guard for contact sport, as your piercer advises. Check the ball ends stay tight.

! Call 999 or go to A&E if you have difficulty breathing or swallowing, or if your tongue or lips swell so much that your airway feels affected. Contact your GP or NHS 111 for spreading redness, increasing pain, heat, pus, a bad taste that will not go, fever or feeling unwell. Do not remove jewellery for a suspected infection unless a clinician tells you to.

# What is normal
Swelling, tenderness, a pale or yellow-white coating around the piercing and a little bleeding in the first days are normal. A slight lisp usually settles as the swelling goes down.

> Practitioner to confirm: the healing times quoted for each oral piercing, whether the studio advises saline or an alcohol-free mouthwash (or both), when the studio recommends the first downsize, and the advice on contact sport and X-rays.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'piercing-aftercare-oral'
);

-- piercing-aftercare-navel-nipple-surface (AFTERCARE_GUIDE)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_piercing-aftercare-navel-nipple-surface', 'piercing-aftercare-navel-nipple-surface', 1, 'AFTERCARE_GUIDE'::"DocumentKind",
  $t$Piercing Aftercare: Navel, Nipple and Surface$t$, $p$piercing_body$p$, 'en-GB',
  $body$Body piercings often heal slowly. A navel piercing commonly takes six to twelve months, and nipple piercings can take several months to a year. Surface piercings sit under a thin layer of skin and need extra patience. Your piercer will give you an estimate for your piercing.

# Cleaning
- Wash your hands before you touch the piercing.
- Clean once or twice a day with sterile saline wound wash (0.9% sodium chloride) from a sealed can or sachet. Spray or soak, then gently rinse away any crust.
- Pat dry with clean disposable paper towel. Do not use a shared towel.
- Do not use alcohol, hydrogen peroxide, ointments or anything not recommended by your piercer.
- Showers are fine. Avoid baths, swimming pools, hot tubs, the sea and lakes while healing.

# Reduce pressure and friction
- Wear loose, soft, breathable clothing over the area. Avoid tight waistbands, belts, bras, straps and rough fabric.
- Do not sleep on the piercing if you can help it. Sleeping on your back or side can help.
- Cover the piercing with a clean protective pad for sport, if your piercer advises it. Do not use plasters or dressings that trap moisture unless advised.
- Do not twist, turn or spin the jewellery. Do not pick at crusts.

# Surface piercings
Surface piercings are more likely to move, grow out or be pushed out by the body. Watch for the skin over the bar becoming thin, shiny or tight, or the jewellery moving closer to the surface. If that happens, contact your piercer promptly. Do not leave it for weeks.

# Downsizing
Initial jewellery is longer to allow for swelling. Book a downsize check when the swelling settles. Jewellery that stays too long catches on clothing and slows healing.

# Pregnancy and breastfeeding
Your body changes during pregnancy. Tell your midwife or GP about any piercing. Navel and nipple jewellery may need to be changed or removed as your body changes. Talk to your piercer or your midwife or health visitor about nipple piercings and breastfeeding.

! Signs that need medical advice: spreading redness, increasing pain or swelling, heat, thick yellow or green discharge, bleeding that will not stop, or feeling feverish or unwell. Contact your GP or NHS 111. Do not remove the jewellery for a suspected infection unless a clinician tells you to. Call 999 if you feel seriously ill.

# What is normal
Swelling, tenderness, redness around the hole and a pale crust on the jewellery are normal in the early weeks. Healing can have good and bad days. Contact the studio if you are unsure.

> Practitioner to confirm: the healing times quoted for each piercing the studio offers, the studio's advice on nipple piercings and breastfeeding, and whether pads or dressings are ever advised for sport.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'piercing-aftercare-navel-nipple-surface'
);

-- piercing-aftercare-genital (AFTERCARE_GUIDE)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_piercing-aftercare-genital', 'piercing-aftercare-genital', 1, 'AFTERCARE_GUIDE'::"DocumentKind",
  $t$Piercing Aftercare: Genital$t$, $p$piercing_genital$p$, 'en-GB',
  $body$This guide covers piercings of the genital area. It is written plainly and clinically. Healing time depends on the site. It can be a few weeks for some piercings and several months for others. Your piercer will give you an estimate for yours.

# Cleaning
- Wash your hands before you touch the piercing.
- Once or twice a day, rinse or soak with sterile saline wound wash (0.9% sodium chloride) from a sealed can or sachet. Rinse away any crust gently and pat dry with clean disposable paper towel.
- Showers are better than baths. Avoid baths, swimming pools, hot tubs, the sea and lakes while healing.
- Do not use soap directly on the piercing, antiseptics, alcohol, ointments or anything not recommended by your piercer.
- Do not twist or turn the jewellery.

# Clothing and hygiene
- Wear loose, clean, breathable underwear, preferably cotton, and change it daily. Avoid tight clothing and rough fabric.
- Tell your piercer about any jewellery that catches on clothing.
- If you have periods, change pads or tampons regularly and keep the area clean.
- Pass urine as normal. Rinse with clean water afterwards if you need to.

# Sexual contact
- Do not have sexual contact of any kind, including oral contact, fingers and sex toys, until your piercer tells you it is safe. Your piercer will give you a timeframe.
- Once you restart, use barrier protection every time while healing. Keep the area clean before and after. Be gentle and stop if it hurts.
- Keep your regular sexual health checks. You can get free, confidential advice from an NHS sexual health clinic.

# Downsizing and long-term care
Initial jewellery is longer to allow for swelling. Book a downsize check when the swelling settles. Tell any midwife, doctor or nurse about the piercing before a medical examination, childbirth or surgery. Jewellery may need to be changed or removed.

! Contact your GP or NHS 111 for spreading redness, increasing pain or swelling, heat, thick yellow or green discharge, bleeding that will not stop, a fever, feeling unwell, or any difficulty passing urine. Do not remove the jewellery for a suspected infection unless a clinician tells you to. Call 999 if you feel seriously ill.

# What is normal
Swelling, tenderness, a little spotting and a pale crust on the jewellery are normal in the first days and weeks. Contact the studio if you are unsure. We will always take you seriously and keep your information private.

> Practitioner to confirm: the healing time and the date after which sexual contact is advised for each genital piercing the studio offers, the cleaning method for each (soak or rinse), the advice on childbirth, and the studio's insurer and local authority conditions for genital piercing.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'piercing-aftercare-genital'
);

-- aftercare-for-healed-work-and-touch-ups (AFTERCARE_GUIDE)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_aftercare-for-healed-work-and-touch-ups', 'aftercare-for-healed-work-and-touch-ups', 1, 'AFTERCARE_GUIDE'::"DocumentKind",
  $t$Aftercare for Healed Work and Touch-ups$t$, $p$general$p$, 'en-GB',
  $body$Once your tattoo or piercing has healed, a little long-term care keeps it looking its best. This guide also explains touch-ups.

# Healed tattoos
- Keep skin moisturised. Healthy, hydrated skin shows tattoos best.
- Use sunscreen of SPF 30 or higher with a 4 or 5 star UVA rating on a healed tattoo. Sun is the biggest cause of fading.
- Avoid sunbeds.
- Tattoos soften and change as your body does. Weight change, pregnancy, sun and ageing all affect how they look.
- Check your skin regularly, including tattooed skin. Tattoo ink can make it harder to spot changes in a mole or patch. See your GP if you notice a change.

# Touch-ups
- A touch-up is a small correction once your tattoo has fully healed. It is normal for some areas to heal lighter, patchy or softer than expected.
- Please wait until your tattoo has fully healed, which is usually at least four to eight weeks, before asking for one. Send us a healed photo first so your artist can see what is needed.
- Touch-ups are booked like any other appointment. Tell us if the need for a touch-up came from your tattoo not healing as it should, and we will look at it with you.
- Large changes or reworking are a new piece of work and are priced as one.

# Healed piercings
- A healed piercing can still close up, sometimes within hours or days. If you take jewellery out for a long period, it may close.
- Have a piercer change or fit jewellery for you if it is a recent or cartilage piercing, or if you are unsure.
- Keep jewellery clean with mild soap and water in the shower, rinse well and pat dry.
- Check threaded ends regularly and keep them tight.
- A healed piercing can become irritated or infected at any time, for example after a knock or a change of jewellery. The signs are the same as for a new piercing.

! Seek medical advice from your GP or NHS 111 for spreading redness, increasing swelling, heat, worsening pain, pus, red streaks, a fever or feeling unwell, at any time. Call 999 if you feel seriously ill.

# Laser and removal
If you are thinking about laser removal or lightening, speak to a specialist laser clinic. We can advise on how this may affect a cover-up, but we do not offer removal.

> Practitioner to confirm: the studio's touch-up policy (whether there is a free window after healing, and for how long), the earliest point at which a touch-up is booked, whether the studio offers jewellery changes by appointment, and that the studio does not offer laser removal.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'aftercare-for-healed-work-and-touch-ups'
);

-- first-tattoo-what-to-expect (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_first-tattoo-what-to-expect', 'first-tattoo-what-to-expect', 1, 'INFORMATION'::"DocumentKind",
  $t$Your First Tattoo: What to Expect$t$, $p$tattoo$p$, 'en-GB',
  $body$Nervous? Everyone was once. Here is how a session at Rebellious Ink usually runs.

# 1. Consultation and design
You will have chatted with your artist through your portal about size, placement, style and references. Many artists show the final design on the day. Small changes are normal, big ones may need another session.

# 2. Consent and checks
Before anything happens you will complete a short suitability questionnaire and a consent form, and we will check your photographic ID. You must be 18 or over. You can ask to discuss any answer privately. You can change your mind at any point, including right up to the moment we start.

# 3. Stencil placement
Your artist cleans the area, may shave it, and applies a stencil. Look in the mirror, move around and speak up if the position is not right. Nothing is permanent yet.

# 4. The session
Expect a scratching or buzzing sensation. Some areas are more sensitive than others. Ask for breaks, water and snacks whenever you need them. Your artist uses sterile single-use needles and barrier-covered equipment. Our Infection Control Statement explains what you will see.

# 5. Dressing and aftercare
Your artist will dress the tattoo and tell you exactly which dressing was used and when to remove it. You will receive our Tattoo Aftercare guide by email and in your portal.

# 6. Settling up and follow-up
Pay the balance, book any further sessions and feel free to send a healed photo in a few weeks. We love seeing them.

> Questions to ask your artist: How long will this take? How will it look healed? What should I avoid for the next two weeks? When is the best time to send a healed photo?

> Practitioner to confirm: that the process described matches how the studio runs a session, including whether the artist or the client may shave the area.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'first-tattoo-what-to-expect'
);

-- cover-ups-and-larger-projects (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_cover-ups-and-larger-projects', 'cover-ups-and-larger-projects', 1, 'INFORMATION'::"DocumentKind",
  $t$Cover-ups and Larger Projects$t$, $p$tattoo$p$, 'en-GB',
  $body$Cover-ups, reworks and large pieces work differently from a single-session tattoo. This guide sets honest expectations.

# Estimates, not promises
- Multi-session work is quoted as an estimate. The number of sessions can change as the design develops and as we see how your skin heals.
- Each session has its own deposit and booking reference, and the same cancellation terms. See our Deposits, Cancellations and Refunds guide.
- We will tell you if the final price is likely to differ from the estimate before we go ahead, and we will not add charges you have not agreed to.

# Design uncertainty is normal
- A cover-up must be larger and usually darker than the existing tattoo. Your artist will show you what is realistic. Some tattoos need lightening by laser before a cover-up is possible. We will say so.
- Scar tissue takes ink unpredictably. We may test a small area first.
- Bring a clear daylight photo of the existing tattoo to your consultation.

# Healed results and records
- With your permission we photograph each stage so you and your artist can track progress. Those photographs stay private unless you separately agree to publication.
- Final judgement on a large piece is only possible once it has fully healed, often two to three months after the last session.

# Looking after yourself
- Large sessions are tiring. Eat well, rest, and bring snacks and water.
- Each session adds to the healing your skin has to do. Your artist may suggest a gap between sessions on the same area.

> Keep healing sessions at least four to six weeks apart unless your artist advises otherwise.

> Practitioner to confirm: the gap between sessions on the same area, and how the studio handles a price that goes above the estimate.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'cover-ups-and-larger-projects'
);

-- when-to-contact-us (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_when-to-contact-us', 'when-to-contact-us', 1, 'INFORMATION'::"DocumentKind",
  $t$When to Contact Us / When to Seek Medical Help$t$, $p$all$p$, 'en-GB',
  $body$Most tattoos and piercings heal without problems. Knowing who to contact makes everything simpler.

# Contact the studio when
- You are unsure whether what you are seeing is normal healing.
- Your dressing has come off early or you have lost your aftercare instructions.
- Jewellery feels wrong, is too tight, has embedded or needs downsizing.
- You have questions about touch-ups, healed photos or your next session.
- You are unhappy with your experience. See our Complaints and Feedback guide.

# Seek medical help when
! Spreading redness, swelling that is getting worse, heat, increasing pain, pus, red streaks, a bad smell, fever, chills or feeling unwell can be signs of infection. Contact your GP or NHS 111. Go to A&E or call 999 if you are seriously unwell, have difficulty breathing or swallowing (especially after an oral piercing), or have an allergic reaction with swelling of the face, lips or throat.

> We are a tattoo and piercing studio, not a clinic. We cannot diagnose, prescribe or treat infections. Telling us helps us look after you and improve our care, but please contact a health professional first if you are worried.

# If you see a doctor or nurse
- Tell them you had a tattoo or piercing, when you had it and what you have been doing to look after it.
- Do not remove piercing jewellery for a suspected infection unless a clinician tells you to.
- Please let us know afterwards if you are happy to. It helps us look after other clients.

# Useful contacts
- Rebellious Ink: thedesk@rebelliousink.tattoo.
- NHS 111 (phone or 111.nhs.uk) for urgent advice that is not an emergency.
- Your GP surgery.
- 999 or A&E in an emergency.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'when-to-contact-us'
);

-- healed-photo-and-review (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_healed-photo-and-review', 'healed-photo-and-review', 1, 'INFORMATION'::"DocumentKind",
  $t$Healed Photo and Review Guide$t$, $p$all$p$, 'en-GB',
  $body$We would love to see how your work has settled. This is completely optional.

# Sending a healed photo
- Wait until the tattoo or piercing is fully healed, usually four to eight weeks for tattoos.
- Natural daylight, no filters, and the whole piece in frame.
- Upload it through your portal. It stays private to you and your artist unless you tell us otherwise.
- If you think something is not healing properly, send a photo sooner. We would rather look early.

# Permission to share
Sharing your photo on our portfolio or social media is a separate choice. You can say yes to one and no to another, and you can change your mind later. Anything already published may remain in circulation elsewhere, but we will take it down from our own channels. Before a photo is shared we will check that it does not show your face, name or other identifying details unless you have said that is fine.

# Leaving a review
An honest review helps other people choose a studio. If anything was not right, we would rather hear it directly so we can fix it. We do not write or pay for reviews, and we do not ask for positive reviews only.

> Practitioner to confirm: that the studio does not offer incentives for reviews, and the process for removing a shared photo.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'healed-photo-and-review'
);

-- age-and-id-policy (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_age-and-id-policy', 'age-and-id-policy', 1, 'INFORMATION'::"DocumentKind",
  $t$Age and ID Policy$t$, $p$general$p$, 'en-GB',
  $body$We check photographic ID for every client, every time, whatever you look like. This is how we keep young people safe and stay within the law.

# Tattoos: 18 and over, no exceptions
- It is illegal to tattoo anyone under 18 in the UK (Tattooing of Minors Act 1969).
- A parent or guardian cannot give consent for a tattoo. We cannot make exceptions.
- If you are not able to show valid photographic ID on the day, we cannot tattoo you and your deposit terms apply.

# Piercing: our policy
- 18 and over: you can be pierced without a parent present, once your ID is checked.
- 16 and 17: only where our local council's rules allow it. A parent or guardian must sign our Parental Consent for Piercing form and show their own ID. We may ask them to stay for the piercing.
- Under 16: ear and body piercing only with a parent or guardian present throughout the whole appointment. They must sign the Parental Consent for Piercing form.
- Intimate piercings (genital and nipple piercing): never under 18.
- Your piercer can always say no, whatever your age, if they think it is not safe or in your best interests.

# Accepted photographic ID
- Passport.
- Photocard driving licence.
- A proof-of-age card with the PASS hologram.
- A parent or guardian must also show photographic ID, and bring evidence of parental responsibility, such as the young person's birth certificate or a court order.

# Your ID and your privacy
We look at your ID to check your name, photo and date of birth. We do not keep a copy. We record that the check was made and the date of birth. Our Privacy Notice explains more.

> Practitioner to confirm: the local council's byelaws on the minimum age for each type of piercing, any minimum age below which the studio will not pierce at all, whether the studio treats nipple piercing as intimate, the list of accepted ID, and what evidence of parental responsibility the studio accepts. Note that the online enquiry form and the minimum piercing age setting (piercing.minimumAge) currently accept adults only. This policy cannot take effect until the studio changes both.

> Practitioner to confirm: if any client works or lives in Wales, the Public Health (Wales) Act 2017 has its own rules on intimate piercing of under-18s. Check which regime applies to the studio.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'age-and-id-policy'
);

-- deposits-cancellations-and-refunds (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_deposits-cancellations-and-refunds', 'deposits-cancellations-and-refunds', 1, 'INFORMATION'::"DocumentKind",
  $t$Deposits, Cancellations and Refunds$t$, $p$general$p$, 'en-GB',
  $body$This guide explains how deposits work at Rebellious Ink. It matches the terms shown on your quote before you pay.

# What your deposit is
- Your deposit holds your appointment. While it is held, we turn away other clients for that time.
- The deposit is deducted from the final price. It is never an extra charge.
- You pay the rest on the day by card or cash.
- Your booking confirmation shows the deposit amount in pounds and your booking reference.

# Moving your appointment
- Give us at least 48 hours' notice and you can move your appointment once, free of charge. Your deposit carries over to the new date.
- If you need to move it again, or give less than 48 hours' notice, we may keep the deposit. Contact us and we will talk it through.

# Cancelling
- If you cancel with at least 48 hours' notice and do not want to rebook, we will refund your deposit.
- If you cancel with less than 48 hours' notice, or do not attend, we keep the deposit. It covers the time we held for you and could not offer to anyone else.
- If you are very unwell, or something serious has happened, tell us. We will always listen.

# If we cancel or have to move your appointment
- If we cancel, we will tell you as soon as we can. We will offer you a new date or a full refund of your deposit, whichever you prefer.
- We will never keep a deposit when we are the ones who cancel.
- We will not charge you for anything because we moved the appointment.

# How refunds work
- We refund to the way you paid: the same card, or the bank account you paid from.
- We aim to refund within 14 days of agreeing it. Your bank may take a few more days to show it.
- We will email you when the refund has been made.

# Your legal rights
Your legal rights are not affected by anything in this guide. Under the Consumer Rights Act 2015, we must carry out our service with reasonable care and skill. If we do not, you are entitled to ask us to put it right or, if that is not possible, to a price reduction. If you think something in these terms is unfair, please tell us.

> Practitioner to confirm: the quote terms state that deposits are non-refundable if you cancel with less than 48 hours' notice or do not attend, and allow one free reschedule with 48 hours' notice. They do not say what happens on a cancellation with more than 48 hours' notice. This draft says the deposit is refunded. Confirm that is the studio's decision.

> Practitioner to confirm: take advice on whether the 14-day cancellation right under the Consumer Contracts Regulations 2013 applies to appointments booked online, and whether the deposit amount is a fair reflection of the studio's likely loss. Update this guide and the quote terms to match.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'deposits-cancellations-and-refunds'
);

-- complaints-and-feedback (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_complaints-and-feedback', 'complaints-and-feedback', 1, 'INFORMATION'::"DocumentKind",
  $t$Complaints and Feedback$t$, $p$general$p$, 'en-GB',
  $body$We want you to be happy with your work and your experience. If we get something wrong, we want to hear about it and put it right.

# Step 1: tell us
- Email thedesk@rebelliousink.tattoo, or speak to us in the studio.
- Tell us what happened, when, and what you would like us to do. Include your booking reference if you have it, and photos if they help.
- If it is about your health, please see your GP or call NHS 111 first, then tell us.

# Step 2: what we will do
- We will acknowledge your complaint within two working days.
- We will look into it properly and talk to the people involved.
- We aim to send you a full reply within 14 days. If it will take longer, we will tell you why and when to expect an answer.
- We will say what we found, what we will do about it, and whether we are offering a correction, a touch-up, a price reduction or a refund.

# Step 3: ask the owner to review
If you are not happy with the reply, ask for it to be reviewed by the studio owner. We will reply within 14 days.

# Step 4: outside the studio
If we cannot settle it, you can take it further.
- Your local council's environmental health team deals with hygiene, safety and whether the studio is meeting its registration or licence conditions. Find your local council at gov.uk.
- Trading Standards deals with contracts, refunds, pricing and unfair terms. The Citizens Advice consumer service passes concerns to Trading Standards.
- The Information Commissioner's Office (ico.org.uk) deals with complaints about how your personal data is used.

# Feedback
Compliments and ideas are just as welcome. Email thedesk@rebelliousink.tattoo, or leave a review. Our Healed Photo and Review Guide explains more.

# Your rights
Using this process does not affect your legal rights.

> Practitioner to confirm: the timescales above (two working days to acknowledge, 14 days to reply), who reviews complaints for the owner, whether the studio belongs to an approved alternative dispute resolution scheme (if so, name it here), and how complaints are recorded and kept.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'complaints-and-feedback'
);

-- privacy-notice-short (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_privacy-notice-short', 'privacy-notice-short', 1, 'INFORMATION'::"DocumentKind",
  $t$Privacy Notice: Short Version$t$, $p$general$p$, 'en-GB',
  $body$This is a short, plain summary of how Rebellious Ink uses your personal information. The full privacy notice is on our website, and it is the one that applies if there is any difference.

# Who we are
Rebellious Ink is the data controller for client records. Independent artists who rent a chair may handle their own client lists. Your booking confirmation will say if that applies to you.

# What we collect and why
- Contact details, enquiry, reference images and messages, to plan and provide your tattoo or piercing.
- Your date of birth and the result of the ID check, because the law says we must not tattoo anyone under 18 and to follow our age policy. We do not keep a copy of your ID.
- Your health answers, which are sensitive data. We ask for your explicit consent. We keep them separately, with restricted access.
- Payment records. Card details are handled by our payment provider and never stored by us.
- Photographs, portfolio publication and marketing: only if you opt in separately. You can change your mind at any time.

# Who sees it
- Your artist, the desk and the studio owners can see your messages, so we can check your enquiry is answered properly.
- A few companies handle data on our behalf to run our service, such as hosting, email delivery and card payments. They may not use it for anything else.
- We never sell or share your details with anyone else for their own marketing.

# Your rights
You can ask for a copy of your data, to correct it, to delete it where the law allows, and to withdraw consent. You can do most of this in your portal, or by emailing the studio. If you are not happy, you can complain to the Information Commissioner's Office at ico.org.uk.

# How long we keep it
We keep consent and treatment records for as long as our insurer and local council require. Enquiries that do not go ahead are deleted after 12 months.

> Practitioner to confirm: the legal name of the controller, the retention periods for consent and treatment records (these are still to be published), the ICO registration, and that this summary matches the privacy page on the website.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'privacy-notice-short'
);

-- allergies-and-patch-tests (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_allergies-and-patch-tests', 'allergies-and-patch-tests', 1, 'INFORMATION'::"DocumentKind",
  $t$Allergies and Patch Tests$t$, $p$general$p$, 'en-GB',
  $body$Most people heal without any reaction. A few people are sensitive to tattoo pigments, jewellery metals or the products used around a procedure. This guide explains what to tell us and when we may offer a patch test.

# What to tell us before you book
- Any previous reaction to a tattoo or a piercing, including itching, a raised rash or blisters that lasted.
- Allergies to metals, especially nickel. If cheap jewellery makes your skin red or itchy, tell us.
- Allergies to latex, adhesives, plasters, antiseptics, numbing products or aftercare products.
- Eczema, dermatitis, psoriasis or very sensitive skin, especially at the site.
- Any allergy that has needed medical treatment.

# Tattoo pigments
- Some pigments, particularly some reds and other colours, are more likely to cause a reaction in some people. A reaction can appear weeks, months or even years later.
- A reaction can show as itching, a raised or bumpy rash, flaking or swelling in the tattoo, often in one colour.
- If this happens, see your GP, and tell us.

# Piercing jewellery
- We use implant-grade titanium or another suitable material, and we can offer alternatives if you are sensitive.
- Nickel allergy is common. Tell us before you choose jewellery.

# Patch tests
- A patch test puts a tiny amount of a product on the skin, to see if it causes a reaction.
- Patch tests cannot always predict how your skin will react to ink placed under the skin. They are not a guarantee.
- We may offer a patch test for a product such as an adhesive or a stencil product if you tell us you are sensitive. A test for pigment may be offered at your artist's discretion. Please ask when you book, because a test needs time before your appointment.
- If you have a significant allergy, your GP or a pharmacist can advise on testing.

! Call 999 if you have swelling of the lips, tongue or throat, difficulty breathing or feel faint after any procedure. For a rash or itching that does not settle, contact your GP or NHS 111.

> Practitioner to confirm: whether the studio offers patch tests, for which products, how far in advance, and whether the studio charges for them. Also confirm the studio's wording on pigment reactions and any insurer conditions about patch testing.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'allergies-and-patch-tests'
);

-- pregnancy-and-medical-conditions (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_pregnancy-and-medical-conditions', 'pregnancy-and-medical-conditions', 1, 'INFORMATION'::"DocumentKind",
  $t$Pregnancy and Medical Conditions$t$, $p$general$p$, 'en-GB',
  $body$Some health conditions and medicines can affect how safe a tattoo or piercing is, or how well it heals. Your practitioner will ask about your health in private. This guide explains when we may say no, or ask you to speak to your GP first.

# What to expect
- You will answer a short health questionnaire. We ask so we can look after you, not to judge.
- Your answers are kept private and stored separately.
- Answering yes to a question does not always mean we will say no. We may ask for more information, or for advice from your GP or specialist.
- We follow the same infection control precautions for every client, so you do not need to tell us about infections or conditions for our protection. Please tell us anything that could affect your safety or healing.

# Pregnancy and breastfeeding
- We do not tattoo or pierce clients who are pregnant. There is not enough evidence on the effects, and the body changes a lot.
- If you are breastfeeding, we may decline or suggest waiting. We will not do nipple piercing.
- If you think you might be pregnant, please tell us.

# We will usually ask for your GP's or specialist's advice first
- Blood-thinning medicines (such as warfarin) and bleeding or clotting disorders.
- Diabetes. Healing may be slower and infection more likely, so we need your condition to be well controlled.
- A weakened immune system, including from chemotherapy, steroids or other immunosuppressant medicine, and conditions such as lupus.
- Heart conditions or heart valve problems, especially for oral piercings.
- Surgery or treatment in the last few months, or planned soon.
- Epilepsy or fainting. We can plan ahead, but we need to know.

# We may need to wait or decline
- A history of keloid or very raised scars.
- Isotretinoin (for acne). Skin is fragile while taking it and for a time afterwards.
- Skin infections, sunburn, rashes or broken skin at the site.
- Being unwell, with a fever, cold or flu, or recent vaccinations that make you feel poorly.
- Being under the influence of alcohol or drugs.

# Talk to us
If you are unsure whether something affects you, ask. We would rather talk it through before your appointment. We will never ask you to stop taking a prescribed medicine. Always talk to your GP or pharmacist about that.

! If you feel unwell after a procedure, or notice signs of infection, contact your GP or NHS 111. Call 999 in an emergency.

> Practitioner to confirm: the studio's own decision on each condition above, in particular the waiting time after isotretinoin and after surgery, how the studio treats well-controlled diabetes, whether it will tattoo or pierce at all during pregnancy (this draft says it will not), whether it will pierce while a client is breastfeeding (other than nipple piercing), and what insurer conditions apply. Review the list with the studio's insurer.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'pregnancy-and-medical-conditions'
);

-- infection-control-statement (INFORMATION)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_infection-control-statement', 'infection-control-statement', 1, 'INFORMATION'::"DocumentKind",
  $t$Infection Control Statement$t$, $p$general$p$, 'en-GB',
  $body$Your safety comes first. This is what you can expect to see when you have a tattoo or piercing at Rebellious Ink. You are welcome to ask questions at any time.

# Needles and sharp items
- Needles and tattoo cartridges are single-use. They come in sealed sterile packs.
- Your practitioner opens the sterile pack in front of you.
- Used needles go straight into a sharps container. They are never reused.
- Razors and other sharp items are single-use too.

# Equipment and surfaces
- Your practitioner washes or sanitises their hands, and wears fresh disposable gloves for your procedure. They change them whenever needed.
- Surfaces and equipment that cannot be cleaned between clients are covered with a fresh barrier.
- Treatment areas are cleaned between every client.
- Ink goes into single-use caps. Fresh ink is poured for you and thrown away after.

# Sterilisation
- Reusable instruments are cleaned, then sterilised in an autoclave (a steam steriliser).
- We keep a log of each autoclave cycle. You can ask to see it.
- Piercing jewellery is either supplied sterile and opened in front of you, or sterilised in our autoclave.

# Waste
- Sharps go into approved sharps containers.
- Other clinical waste is collected by a registered waste carrier.

# Registration and display
- Our council registration certificate (or licence) is on display in the studio.
- Practitioners are registered with the local council, and you can ask to see their details.
- The studio is inspected by the local council's environmental health team.

# Everyone is treated the same
We use the same precautions for every client, every time. This is called standard infection control precautions.

# If something does not look right
Please say so. You can stop at any time. If you are still not happy, our Complaints and Feedback guide explains what to do.

> Practitioner to confirm: every statement above matches how the studio actually works, and delete any that does not. In particular confirm the sterilisation method and autoclave log arrangements, whether jewellery is bought in sterile or sterilised in the studio, the sharps container standard, the waste carrier arrangements, how practitioners' registration and training are shown, and the frequency of council inspection. Do not add claims about practitioners' vaccinations or training unless they are true and recorded.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'infection-control-statement'
);

-- tattoo-consent-form (CONSENT_FORM)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_tattoo-consent-form', 'tattoo-consent-form', 1, 'CONSENT_FORM'::"DocumentKind",
  $t$Tattoo Consent Form$t$, $p$tattoo$p$, 'en-GB',
  $body$Please read this form carefully and ask us about anything you do not understand. Initial each statement, answer every question, then sign. You can change your mind at any point. If you prefer to discuss any answer in private, tell your artist.

# Your details
Full name: ______________________________

Date of birth: ______ / ______ / ____________

Email: ______________________________

Telephone: ______________________________

Booking reference: ______________________________

Design and placement: ______________________________

# Declarations
1. I confirm that I am 18 years old or over. (Initials: ______)

2. I have shown my artist valid photographic ID, and it matches the name and date of birth above. (Initials: ______)

3. I understand that the studio will not tattoo anyone under 18, and that nobody else can give consent for me. (Initials: ______)

4. I am not under the influence of alcohol or drugs. (Initials: ______)

5. I have answered the health questions below honestly and completely, and I have told my artist about any medicine I take. (Initials: ______)

6. I have seen the design and the stencil placement, and I am happy with both. I understand that I can ask for changes before the tattoo starts. (Initials: ______)

7. I understand that a tattoo is permanent. Removal is difficult, can be expensive and may not be complete. (Initials: ______)

8. My artist has explained the risks, including infection, an allergic reaction to ink, scarring, keloid scars, colours healing differently from how they look at first, uneven or patchy healing, and pain. (Initials: ______)

9. I understand that every tattoo heals differently, and that my skin, my aftercare and my own health affect the result. (Initials: ______)

10. I have seen new, sterile, single-use needles opened for my tattoo, or I have been told I can ask to see them. (Initials: ______)

11. I have received written aftercare instructions, and my artist has explained how and when to remove the dressing. I will follow them, and I will contact the studio, my GP or NHS 111 if I am worried about healing. (Initials: ______)

12. I understand that I can ask to stop at any time. (Initials: ______)

13. I have read the Deposits, Cancellations and Refunds guide. I understand that this form does not affect my legal rights. (Initials: ______)

14. I have been told how the studio uses my personal information, and where to find the Privacy Notice. (Initials: ______)

# Photographs
Circle Yes or No for each. You can change your mind later, and this does not affect your tattoo.
- Photographs of my tattoo for my private record, and to help my artist check healing. Yes / No
- Photographs shared on the studio portfolio or website. Yes / No
- Photographs shared on the studio social media. Yes / No

# Health history
Please circle Yes or No. If you answer Yes to any question, tell your artist. It does not always mean that we will say no.
- Are you pregnant, breastfeeding or trying to conceive? Yes / No
- Do you have a bleeding or clotting disorder, or do you take blood-thinning medicine? Yes / No
- Do you have diabetes? Yes / No
- Do you have a heart condition or heart valve problem? Yes / No
- Do you have epilepsy, or do you faint easily? Yes / No
- Do you have a weakened immune system, or take medicine that lowers it (including steroids, or chemotherapy)? Yes / No
- Do you have a history of keloid or very raised scars? Yes / No
- Do you have a skin condition, such as eczema, psoriasis or dermatitis? Yes / No
- Do you have sunburn, a rash, a cold sore, an infection or broken skin at the tattoo site? Yes / No
- Are you taking, or have you recently stopped taking, isotretinoin (acne medicine)? Yes / No
- Have you had surgery or hospital treatment in the last six months? Yes / No
- Are you allergic to latex, adhesives, metals, antiseptics or pigments, or have you reacted to a tattoo before? Yes / No
- Are you unwell today, with a fever, cold or flu? Yes / No
- Have you eaten today? Yes / No
- Is there anything else we should know? Yes / No

If you answered Yes to anything, please give details: ______________________________

# Your signature
Client signature: ______________________________

Date: ______ / ______ / ____________

# Practitioner section
Practitioner name: ______________________________

Licence or registration number: ______________________________

Registering council: ______________________________

ID checked (type and expiry): ______________________________

Area tattooed: ______________________________

Needle or cartridge lot number: ______________________________

Pigment batch numbers: ______________________________

Dressing used and removal advice: ______________________________

Aftercare given (written and verbal): Yes / No

Practitioner signature: ______________________________

Date: ______ / ______ / ____________

> Practitioner to confirm: the studio's tablet consent form is the main record. Use this paper version when the tablet is not available, or to print for the client. Paper health answers are sensitive information, so confirm how and where they are stored, for how long, and who may see them. Confirm the health questions, the isotretinoin question and the photograph options with the insurer, and confirm the registering council and the number fields required by local byelaws.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'tattoo-consent-form'
);

-- piercing-consent-form (CONSENT_FORM)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_piercing-consent-form', 'piercing-consent-form', 1, 'CONSENT_FORM'::"DocumentKind",
  $t$Piercing Consent Form$t$, $p$piercing$p$, 'en-GB',
  $body$Please read this form carefully and ask us about anything you do not understand. Initial each statement, answer every question, then sign. You can change your mind at any point. If you prefer to discuss any answer in private, tell your piercer. If you are under 18, you also need the Parental Consent for Piercing form.

# Your details
Full name: ______________________________

Date of birth: ______ / ______ / ____________

Email: ______________________________

Telephone: ______________________________

Booking reference: ______________________________

Piercing requested and placement: ______________________________

# Declarations
1. I confirm that I am 18 years old or over, or that I am under 18 and my parent or guardian has signed the Parental Consent for Piercing form. (Initials: ______)

2. I have shown my piercer valid photographic ID, and it matches the name and date of birth above. (Initials: ______)

3. I am not under the influence of alcohol or drugs. (Initials: ______)

4. I have answered the health questions below honestly and completely, and I have told my piercer about any medicine I take. (Initials: ______)

5. My piercer has checked the placement with me, and I am happy with it. I understand that my piercer may change the placement or decline if it is unlikely to heal well. (Initials: ______)

6. My piercer has explained the risks, including infection, swelling, bleeding, scarring, keloid scars, an allergic reaction to jewellery, jewellery moving or being pushed out by the body, nerve damage, and the piercing closing if jewellery is removed. For oral piercings this includes damage to teeth and gums and swelling that can affect breathing. (Initials: ______)

7. I understand that healing takes weeks to months, and that some piercings take a year or more. My own health and aftercare affect the result. (Initials: ______)

8. I have chosen my jewellery after discussing the material and size. I understand that the first jewellery is longer to allow for swelling, and that I will need to return for it to be changed (downsized). (Initials: ______)

9. I have seen sterile, single-use needles and sterile jewellery opened for my piercing, or I have been told I can ask to see them. (Initials: ______)

10. I have received written aftercare instructions, and my piercer has explained them. I will follow them, and I will contact the studio, my GP or NHS 111 if I am worried about healing. (Initials: ______)

11. I understand that I should not remove the jewellery for a suspected infection unless a clinician advises it. (Initials: ______)

12. I understand that I can ask to stop at any time. (Initials: ______)

13. I have read the Deposits, Cancellations and Refunds guide. I understand that this form does not affect my legal rights. (Initials: ______)

14. I have been told how the studio uses my personal information, and where to find the Privacy Notice. (Initials: ______)

# Photographs
Circle Yes or No for each. You can change your mind later, and this does not affect your piercing.
- Photographs of my piercing for my private record, and to help my piercer check healing. Yes / No
- Photographs shared on the studio portfolio or website. Yes / No
- Photographs shared on the studio social media. Yes / No

# Health history
Please circle Yes or No. If you answer Yes to any question, tell your piercer. It does not always mean that we will say no.
- Are you pregnant, breastfeeding or trying to conceive? Yes / No
- Do you have a bleeding or clotting disorder, or do you take blood-thinning medicine? Yes / No
- Do you have diabetes? Yes / No
- Do you have a heart condition or heart valve problem? Yes / No
- Do you have epilepsy, or do you faint easily? Yes / No
- Do you have a weakened immune system, or take medicine that lowers it (including steroids, or chemotherapy)? Yes / No
- Do you have a history of keloid or very raised scars? Yes / No
- Do you have a skin condition, such as eczema, psoriasis or dermatitis, at the piercing site? Yes / No
- Do you have a rash, a cold sore, an infection or broken skin at the piercing site? Yes / No
- Are you allergic to metals (especially nickel), latex, adhesives or antiseptics, or have you reacted to a piercing before? Yes / No
- For an oral piercing: do you have gum disease, braces or current dental problems? Yes / No
- Have you had surgery or hospital treatment in the last six months? Yes / No
- Are you taking, or have you recently stopped taking, isotretinoin (acne medicine)? Yes / No
- Are you unwell today, with a fever, cold or flu? Yes / No
- Have you eaten today? Yes / No
- Is there anything else we should know? Yes / No

If you answered Yes to anything, please give details: ______________________________

# Your signature
Client signature: ______________________________

Date: ______ / ______ / ____________

# Practitioner section
Practitioner name: ______________________________

Licence or registration number: ______________________________

Registering council: ______________________________

ID checked (type and expiry): ______________________________

Piercing and site: ______________________________

Needle lot number: ______________________________

Jewellery: material, size and lot number: ______________________________

Aftercare given (written and verbal): Yes / No

Practitioner signature: ______________________________

Date: ______ / ______ / ____________

> Practitioner to confirm: the studio's tablet consent form is the main record. Use this paper version when the tablet is not available, or to print for the client. Paper health answers are sensitive information, so confirm how and where they are stored, for how long, and who may see them. Confirm the health questions, the isotretinoin question and the photograph options with the insurer. For genital piercing, check whether the studio's insurer or local authority needs extra wording or records. Confirm the registering council and the number fields required by local byelaws.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'piercing-consent-form'
);

-- minor-piercing-parental-consent (CONSENT_FORM)
INSERT INTO "DocumentTemplateVersion"
  ("id", "templateKey", "version", "kind", "title", "procedureType", "locale", "bodyMarkdown", "ownerName", "approverName", "approvedAt", "issueDate", "reviewDate", "isCurrent", "createdAt")
SELECT
  'doc_v1_minor-piercing-parental-consent', 'minor-piercing-parental-consent', 1, 'CONSENT_FORM'::"DocumentKind",
  $t$Parental Consent for Piercing (Under 18)$t$, $p$piercing$p$, 'en-GB',
  $body$This form is only for piercing. We never tattoo anyone under 18, and a parent or guardian cannot give consent for a tattoo. Both the young person and their parent or guardian must read and complete this form. See our Age and ID Policy for the rules.

# The young person
Full name: ______________________________

Date of birth: ______ / ______ / ____________

Piercing requested and placement: ______________________________

Booking reference: ______________________________

# The parent or guardian
Full name: ______________________________

Relationship to the young person: ______________________________

Address: ______________________________

Telephone: ______________________________

Email: ______________________________

# Declarations
1. I confirm that I am the parent or legal guardian of the young person named above, and that I have parental responsibility for them. (Initials: ______)

2. I have shown my own valid photographic ID, and evidence of my parental responsibility. (Initials: ______)

3. The young person has shown photographic ID or a proof-of-age card. (Initials: ______)

4. I consent to the young person having the piercing named above. The young person has told me that they want it. (Initials: ______)

5. I will be present throughout the appointment if the young person is under 16, or if the piercer asks me to stay. (Initials: ______)

6. The piercing is not an intimate piercing. I understand that the studio will not carry out intimate piercings on anyone under 18. (Initials: ______)

7. The piercer has explained the risks to both of us, including infection, swelling, bleeding, scarring, an allergic reaction to jewellery, the jewellery moving or being pushed out, and the piercing closing if jewellery is removed. (Initials: ______)

8. I understand that healing takes weeks to months. I have received the written aftercare instructions, and I will help the young person follow them and seek help from the studio, a GP or NHS 111 if needed. (Initials: ______)

9. I understand that the piercer can decline or stop at any time, and that either of us can stop the appointment at any time. (Initials: ______)

10. I have been told how the studio uses personal information about us, and where to find the Privacy Notice. (Initials: ______)

# Health history
Please complete this together. Circle Yes or No. If you answer Yes to any question, tell the piercer. It does not always mean that we will say no.
- Does the young person have a bleeding or clotting disorder, or take blood-thinning medicine? Yes / No
- Does the young person have diabetes? Yes / No
- Does the young person have a heart condition or heart valve problem? Yes / No
- Does the young person have epilepsy, or faint easily? Yes / No
- Does the young person have a weakened immune system, or take medicine that lowers it? Yes / No
- Does the young person have a history of keloid or very raised scars? Yes / No
- Does the young person have a skin condition, such as eczema, psoriasis or dermatitis, or a rash, infection or broken skin at the piercing site? Yes / No
- Is the young person allergic to metals (especially nickel), latex, adhesives or antiseptics, or have they reacted to a piercing before? Yes / No
- For an oral piercing: does the young person have gum disease, braces or current dental problems? Yes / No
- Is the young person taking, or have they recently stopped taking, isotretinoin (acne medicine)? Yes / No
- Is the young person unwell today, with a fever, cold or flu? Yes / No
- Has the young person eaten today? Yes / No
- Is there anything else we should know? Yes / No

If you answered Yes to anything, please give details: ______________________________

# Signatures
Young person signature: ______________________________

Parent or guardian signature: ______________________________

Date: ______ / ______ / ____________

# Practitioner section
Practitioner name: ______________________________

Licence or registration number: ______________________________

Registering council: ______________________________

Young person's ID checked (type and expiry): ______________________________

Parent or guardian ID and evidence of parental responsibility checked (type): ______________________________

Piercing and site: ______________________________

Needle lot number: ______________________________

Jewellery: material, size and lot number: ______________________________

Aftercare given (written and verbal): Yes / No

Practitioner signature: ______________________________

Date: ______ / ______ / ____________

> Practitioner to confirm: the local council's byelaws on the minimum age for each type of piercing and whether the parent or guardian must stay throughout for 16 and 17 year olds (this draft requires it for under 16s, and when the piercer asks), the list of acceptable evidence of parental responsibility, and the studio's decision on which piercings count as intimate. Note that the website enquiry form and the minimum piercing age setting currently accept adults only. Check insurer conditions for piercing young people, and how paper health answers are stored.

Questions? Email thedesk@rebelliousink.tattoo. For anything medical, contact NHS 111 or your GP. In an emergency, call 999.$body$,
  'Studio owner', NULL, NULL, CURRENT_DATE, (CURRENT_DATE + interval '6 months')::date, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentTemplateVersion" WHERE "templateKey" = 'minor-piercing-parental-consent'
);
