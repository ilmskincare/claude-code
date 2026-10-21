/**
 * Apprentice skills catalogue v2: the studio's staged apprenticeship, cross-checked against a
 * comprehensive US studio syllabus (prerequisites and five stages) and adapted to UK practice
 * (council registration, UK infection-control training, NHS hepatitis B vaccination, 18+ law,
 * COSHH, the studio's own policies). Seeded as Skill rows by key; existing v1 keys are kept so
 * progress already recorded is not lost. The owner can edit titles and flags later.
 *
 * isCore = required for junior-artist sign-off. evidenceType says what proves it.
 */
export type SeedSkill = { key: string; area: string; stage: number; title: string; description: string; isCore?: boolean; evidenceType?: "observation" | "written" | "certificate" | "practical" | "portfolio" };

export const STAGE_LABELS: Record<number, string> = {
  0: "Prerequisites: before the apprenticeship starts",
  1: "Stage 1: safety, cleaning, front of house, documentation, drawing",
  2: "Stage 2: deeper hygiene, observation, set-ups, stencils, supplies",
  3: "Stage 3: basic tattooing, machines, bedside manner",
  4: "Stage 4: intermediate tattooing and running your own work",
  5: "Stage 5: completion and continuing development",
};

export const SKILL_AREAS: Record<string, string> = {
  prereq_certs: "Certificates, vaccination and registration",
  prereq_written: "Written prerequisites and reading",
  prereq_portfolio: "Portfolio and digital tools",
  prereq_tests: "Studio knowledge tests",
  hygiene: "Hygiene and infection prevention",
  cleaning: "Cleaning and studio upkeep",
  client_service: "Client service and consultation",
  documentation: "Written documentation and reading",
  drawing: "Drawing and flash",
  sterilisation: "Sterilisation, waste and PPE",
  observation: "Observation, set-ups, break-downs and stencils",
  supplies: "Supplies, equipment and promotion",
  fundamentals: "Tattoo fundamentals",
  equipment: "Machines, tubes and needles",
  linework: "Linework",
  shading: "Shading and value",
  colour: "Colour theory and packing",
  stencil: "Stencil and placement",
  design: "Design and composition",
  anatomy: "Anatomy and skin",
  bedside: "Bedside manner",
  operations: "Studio operations",
  photography: "Photography and ethics",
  aftercare: "Aftercare and follow-up",
  communication: "Booking communication",
  business: "Pricing, time and professional practice",
  portfolio: "Portfolio building",
  completion: "Completion",
};

const S = (key: string, area: string, stage: number, title: string, description: string, opts: { isCore?: boolean; evidenceType?: SeedSkill["evidenceType"] } = {}): SeedSkill => ({ key, area, stage, title, description, ...opts });

export const SEED_SKILLS: SeedSkill[] = [
  // ── Prerequisites (stage 0) ──────────────────────────────────────────────
  S("pre-first-aid", "prereq_certs", 0, "First aid certificate", "Holds a current UK first aid certificate (Emergency First Aid at Work or equivalent). Renew before expiry.", { evidenceType: "certificate" }),
  S("pre-infection-control", "prereq_certs", 0, "Infection control training", "Completed a recognised infection prevention and control course for tattooing and piercing (Level 2 or equivalent), covering blood-borne viruses, decontamination and sharps.", { evidenceType: "certificate" }),
  S("pre-bbv", "prereq_certs", 0, "Blood-borne viruses", "Can explain hepatitis B and C, HIV and MRSA: how they spread, how the studio prevents exposure, and what to do after an exposure.", { evidenceType: "written" }),
  S("pre-hep-b", "prereq_certs", 0, "Hepatitis B vaccination", "Hepatitis B vaccination course started with the GP or occupational health, with the record on file; an antibody (titre) check where advised.", { evidenceType: "certificate" }),
  S("pre-council", "prereq_certs", 0, "Council registration", "Registered as a tattooist with the local council before any work on a member of the public, with the certificate on file. Apprentices must not tattoo clients until this is done.", { evidenceType: "certificate" }),
  S("pre-cv-bio", "prereq_written", 0, "CV and biography", "A current CV and a short biography for the studio file and website.", { evidenceType: "written", isCore: false }),
  S("pre-statement", "prereq_written", 0, "Personal statement", "Two one-page statements: why you want to tattoo, and why you chose Rebellious Ink.", { evidenceType: "written" }),
  S("pre-reading", "prereq_written", 0, "Reading list and responses", "Reads the studio reading list (tattoo history and the APP body-piercing manual) and writes a short response to each. Optional classics: Modern Primitives, Stoney Knows How, Color Outside the Lines.", { evidenceType: "written", isCore: false }),
  S("pre-ten-tattooers", "prereq_written", 0, "Ten favourite tattooers", "Researches and writes about ten tattooers whose work you admire and why.", { evidenceType: "written", isCore: false }),
  S("pre-portfolio", "prereq_portfolio", 0, "Presented art portfolio", "Presents a portfolio of your own drawings, sketches and artwork to the owner and mentor.", { evidenceType: "portfolio" }),
  S("pre-digital", "prereq_portfolio", 0, "Procreate or Photoshop basics", "Edits, resizes and labels images (name, 'in progress') and understands resolution for print and web.", { evidenceType: "practical", isCore: false }),
  S("pre-tests", "prereq_tests", 0, "Studio knowledge tests", "Passes the studio's front-of-house, jewellery, tattoo, piercing and booking tests.", { evidenceType: "written" }),

  // ── Stage 1: safety and hygiene ──────────────────────────────────────────
  S("hyg-hand-hygiene", "hygiene", 1, "Hand hygiene and glove use", "Washes hands correctly, uses sanitiser at the right moments, dons and removes gloves without contamination, never touches non-barriered surfaces mid-procedure."),
  S("hyg-personal", "hygiene", 1, "Personal hygiene standards", "Short clean nails, hair tied back, lotion use, and covering cuts, hangnails and any non-intact skin with a waterproof dressing."),
  S("hyg-biohazard-areas", "hygiene", 1, "Biohazards and designated areas", "Can explain what a biohazard is and where the studio's dirty, clean and sterile areas are."),
  S("hyg-cross-contamination", "hygiene", 1, "Cross-contamination awareness", "Can explain and demonstrate the clean/dirty boundary throughout a session, including the one-handed technique and opening a clean field."),
  S("hyg-standard-precautions", "hygiene", 1, "Universal and standard precautions", "Treats every client and every body fluid as potentially infectious and can explain what that means in practice.", { evidenceType: "written" }),
  S("hyg-station-setup", "hygiene", 1, "Station set-up and barrier protection", "Sets up a clean station with barriers on all touch points before the client enters, for both coil and rotary set-ups."),
  S("hyg-clean-down", "hygiene", 1, "Clean-down and waste", "Breaks down a station safely, disposes of sharps and clinical waste correctly, disinfects to studio procedure."),
  S("hyg-sharps-incident", "hygiene", 1, "Sharps and exposure incident response", "Has read and initialled the exposure control plan and needle-stick procedure; knows the first-aid and reporting steps."),
  S("hyg-sterilisation-checks", "hygiene", 1, "Sterilisation indicators and spore tests", "Knows the difference between an integrator and an indicator, why and when spore tests are run, and what happens if one fails (where the studio reuses equipment).", { isCore: false, evidenceType: "written" }),
  S("hyg-risk-to-self", "hygiene", 1, "Risks to yourself", "Understands the physical, mental and emotional demands of the work and how the studio supports wellbeing.", { isCore: false, evidenceType: "written" }),
  S("hyg-observe-policies", "hygiene", 1, "Policy observation notes", "Observes how the studio's policies are followed day to day and records what works and what needs improving.", { evidenceType: "written", isCore: false }),

  // ── Stage 1: cleaning ────────────────────────────────────────────────────
  S("cln-daily", "cleaning", 1, "Daily cleaning", "Mopping, dusting, counter tops, bins and bathrooms to the studio checklist.", { evidenceType: "observation" }),
  S("cln-restock", "cleaning", 1, "Restocking", "Keeps cups, water, paper towels, toilet roll, sanitary products and front-of-house consumables stocked.", { evidenceType: "observation" }),
  S("cln-equipment-maintenance", "cleaning", 1, "Filters and water", "Maintains the air filtration and any distilled-water equipment to the manufacturer's schedule.", { isCore: false }),
  S("cln-lobby", "cleaning", 1, "Cross-contamination in the lobby", "Spots and handles contamination risks in public areas (dressings, blood, sharps brought in by clients)."),
  S("cln-disinfectants", "cleaning", 1, "Disinfectants and COSHH", "Knows what a disinfectant is, contact times, dilution, and the COSHH sheet for every chemical in the studio."),
  S("cln-station-restock", "cleaning", 1, "Prep and restock a station", "Preps and restocks a tattoo station for coil and rotary work.", { evidenceType: "observation" }),

  // ── Stage 1: customer service ────────────────────────────────────────────
  S("cs-greeting", "client_service", 1, "Greeting and reassurance", "Greets clients, settles nerves and addresses fears honestly."),
  S("cs-phone-chat", "client_service", 1, "Phone and messages", "Answers the phone and chat with the studio's FAQs, and knows when to pass a question to an artist."),
  S("cs-till", "client_service", 1, "Till and card machine", "Rings in, issues receipts, voids and takes card payments correctly; records deposits in the studio system."),
  S("cs-consultation", "client_service", 1, "Consultation", "Runs a structured consultation: idea, size, placement, style, budget, expectations, honest advice."),
  S("cs-consent-id", "client_service", 1, "Consent and ID checks", "Completes consent paperwork correctly, checks photographic ID, knows the 18+ law and when to refuse."),
  S("cs-release-forms", "client_service", 1, "Release forms and policies", "Can explain every client form, the deposit and cancellation terms and the free touch-up policy."),
  S("cs-common-questions", "client_service", 1, "Common tattoo questions", "Answers questions on white ink, hands and feet, size and detail, ageing, sun, placement and fit, and knows when to refer to an experienced artist."),
  S("cs-tours", "client_service", 1, "Studio tours", "Gives a studio tour that explains hygiene and what to expect.", { isCore: false }),
  S("cs-difficult-conversations", "client_service", 1, "Difficult conversations", "Declines unsuitable work, handles nerves, complaints and intoxicated clients calmly.", { isCore: false }),

  // ── Stage 1: documentation ───────────────────────────────────────────────
  S("doc-personal-file", "documentation", 1, "Personal studio file", "Starts a personal file holding certificates, signed policies, homework and notes.", { evidenceType: "written" }),
  S("doc-read-policies", "documentation", 1, "Read and initial policies", "Reads and initials the council's registration conditions, the studio's policies and procedures, the exposure control plan and every equipment manual.", { evidenceType: "written" }),
  S("doc-coshh", "documentation", 1, "Chemical safety sheets", "Reads the labels and safety data sheets for everything in the studio and records observations.", { evidenceType: "written" }),
  S("doc-journal", "documentation", 1, "Journal", "Keeps a journal of notes, observations and questions, reviewed with the mentor.", { evidenceType: "written", isCore: false }),
  S("doc-promotion", "documentation", 1, "Promoting the studio", "Helps promote the studio (web, flyers, business cards, social media) within the studio's permissions rules.", { isCore: false }),
  S("doc-side-reading", "documentation", 1, "Tattoo history reading", "Reads about the history of tattooing in Britain and worldwide and writes short responses.", { evidenceType: "written", isCore: false }),

  // ── Stage 1: drawing ─────────────────────────────────────────────────────
  S("drw-sketchbook", "drawing", 1, "Tattoo sketchbook", "Keeps a tattoo-specific sketchbook and draws daily.", { evidenceType: "portfolio" }),
  S("drw-lettering", "drawing", 1, "Lettering", "Practises traced and custom lettering.", { evidenceType: "portfolio" }),
  S("drw-flash-set-1", "drawing", 1, "First flash set", "Lays out a five-page flash set in pencil, lines and shades it in a permanent medium, then colours it.", { evidenceType: "portfolio" }),
  S("drw-weekly-review", "drawing", 1, "Weekly review with a tattooer", "Meets a tattooer at least once a week to show and discuss work, throughout the apprenticeship.", { evidenceType: "observation" }),

  // ── Stage 2: sterilisation, waste and PPE ────────────────────────────────
  S("ster-tubes", "sterilisation", 2, "Disposable versus reusable tubes", "Explains the history and the pros and cons of disposable and steel tubes, disposable tips and one-piece versus multi-piece tubes.", { evidenceType: "written" }),
  S("anat-skin", "sterilisation", 2, "Anatomy of the skin", "Explains the layers of the skin and how they relate to needle depth, healing and scarring.", { evidenceType: "written" }),
  S("ster-fainting", "sterilisation", 2, "Fainting procedure", "Knows the studio's fainting and nausea procedure and helps keep it current."),
  S("ster-autoclave", "sterilisation", 2, "Steriliser use and logs", "Where the studio reuses equipment: operates, flushes and maintains the steriliser and keeps the logs. Not required in a fully disposable studio.", { isCore: false }),
  S("ster-sharps-change", "sterilisation", 2, "Sharps container changes", "Writes the step-by-step procedure for changing a sharps container and performs it under observation."),
  S("ster-clinical-waste", "sterilisation", 2, "Clinical waste collection", "Knows the licensed clinical waste contractor, the collection schedule and the paperwork."),
  S("ster-ppe", "sterilisation", 2, "PPE", "Uses aprons, sleeves, masks and eye protection correctly."),
  S("ster-chemicals", "sterilisation", 2, "Chemicals in use", "Knows the use, dilution and hazards of every chemical in the studio."),
  S("ster-detail-stations", "sterilisation", 2, "Detailing stations", "Deep-cleans a station and completes the daily tattooer checklist."),

  // ── Stage 2: observation, set-ups, stencils ──────────────────────────────
  S("obs-watch", "observation", 2, "Observe basic tattoos", "Watches basic tattoos, keeps notes and asks questions after the client leaves.", { evidenceType: "written" }),
  S("obs-setup-explain", "observation", 2, "Explain a set-up and break-down", "Explains and demonstrates everything in a coil and a rotary set-up and break-down, with a written description.", { evidenceType: "written" }),
  S("obs-stencil-procedure", "observation", 2, "Stencil procedure", "Writes the step-by-step stencil preparation and application procedure and performs it under observation."),
  S("sten-placement", "stencil", 2, "Stencil application and placement", "Applies stencils cleanly and positions designs to flow with the body."),
  S("obs-setups-observed", "observation", 2, "Set-ups and break-downs under observation", "Performs set-ups and break-downs under observation to the written procedure."),

  // ── Stage 2: documentation ───────────────────────────────────────────────
  S("doc-rewrite-procedures", "documentation", 2, "Update procedures", "Rewrites or updates procedures where observation found gaps, for the owner's approval.", { evidenceType: "written", isCore: false }),
  S("doc-guest-compliance", "documentation", 2, "Guest artist compliance", "Checks that new colleagues and guest artists follow the studio's procedures and raises concerns.", { isCore: false }),
  S("doc-history-visit", "documentation", 2, "Tattoo history visit", "Visits or researches a UK tattoo history collection or museum exhibit and writes it up.", { evidenceType: "written", isCore: false }),

  // ── Stage 2: supplies and promotion ──────────────────────────────────────
  S("sup-products", "supplies", 2, "Products and suppliers", "Knows the studio's products and suppliers and keeps a log of who uses what and why.", { evidenceType: "written" }),
  S("sup-ordering", "supplies", 2, "Placing orders", "Places stock orders through the studio system and checks deliveries in.", { isCore: false }),
  S("ops-stock", "operations", 2, "Stock and consumables", "Records consumable use and reports low stock.", { isCore: false }),
  S("sup-own-kit", "supplies", 2, "Own equipment", "Obtains the kit needed to practise: practice skin, machines, power unit, needles or cartridges, tubes, inks, clip cord, foot switch."),
  S("sup-stencil-printer", "supplies", 2, "Stencil printers", "Explains how thermal stencil printers work and the options on the market.", { isCore: false, evidenceType: "written" }),
  S("sup-self-promotion", "supplies", 2, "Self-promotion materials", "Creates business cards, flyers and social accounts within the studio's photography and permissions rules.", { isCore: false }),

  // ── Stage 2: drawing ─────────────────────────────────────────────────────
  S("drw-simple-flash", "drawing", 2, "Simple small black flash", "Designs a set of simple, small, black designs for first clients to choose from.", { evidenceType: "portfolio" }),
  S("drw-fake-skin-lettering", "drawing", 2, "Lettering and simple flash on practice skin", "Tattoos the Stage 1 lettering and the simple flash on practice skin.", { evidenceType: "practical" }),
  S("drw-digital-advanced", "drawing", 2, "Advanced digital design", "Uses Procreate or Photoshop to curve lettering, build outlines and prepare stencils.", { isCore: false, evidenceType: "practical" }),

  // ── Stage 3: basic tattooing ─────────────────────────────────────────────
  S("fund-practice-hours", "fundamentals", 3, "Practice skin hours", "Logs many hours on practice skin before any work on a person.", { evidenceType: "practical" }),
  S("fund-skin-depth", "fundamentals", 3, "Needle depth and skin behaviour", "Consistent depth without blowouts or scarring on practice skin and supervised client work."),
  S("fund-hand-speed", "fundamentals", 3, "Hand speed and machine speed", "Matches hand speed to voltage and needle grouping for clean saturation."),
  S("fund-stretch", "fundamentals", 3, "Skin stretch", "Stretches skin correctly for different areas, with and without an assistant."),
  S("line-single-pass", "linework", 3, "Clean single-pass lines", "Consistent, unbroken lines of varying weight on practice skin."),
  S("line-client", "linework", 3, "Supervised client linework", "Completes small tattoos on consenting adult volunteers under direct supervision, after council registration, always cleared by a tattooer first."),
  S("shade-black-grey", "shading", 3, "Black and grey shading", "Smooth gradients using dilution and whip shading without overworking the skin."),
  S("shade-solid-fill", "shading", 3, "Solid fill and packing", "Even, saturated solid black without patchiness or trauma."),
  S("col-theory", "colour", 3, "Colour theory", "Understands pigment behaviour on skin tones, healing shifts and contrast.", { isCore: false }),
  S("col-packing", "colour", 3, "Colour packing", "Saturates colour evenly on practice skin and supervised work."),
  S("fund-photos", "photography", 3, "Fresh and healed photos", "Photographs every tattoo and a healed photo wherever possible, with good lighting, and understands fresh versus healed and print versus online.", { evidenceType: "portfolio" }),
  S("photo-ethics", "photography", 3, "Photography and permissions", "Only publishes with the client's recorded permission; knows the social media and portfolio consent rules."),
  S("fund-review-each", "fundamentals", 3, "Review every tattoo with a tattooer", "Discusses each tattoo: fresh versus healed, blowouts, patchy colour, scarring, overworking, depth, body areas, skin types and tones, stretching, touch-ups and how to avoid them.", { evidenceType: "written" }),
  S("fund-notes", "fundamentals", 3, "Tattoo notes", "Keeps notes on every tattoo: thoughts, results, observations, problems.", { evidenceType: "written" }),
  S("fund-network", "fundamentals", 3, "Professional network", "Makes contact with other professional tattooers and trades technique and aftercare ideas.", { isCore: false }),
  S("port-build", "portfolio", 3, "Portfolio of healed work", "Starts a physical and digital portfolio including healed photos, with permissions recorded.", { isCore: false, evidenceType: "portfolio" }),

  // ── Stage 3: machines, tubes and needles ─────────────────────────────────
  S("eq-machine-theory", "equipment", 3, "How a machine works", "Explains how a tattoo machine works and why each part is needed, and the parts around it: tubes, needles, pigments, power supplies, clip cords, RCA leads, foot switches, sleeves and bags.", { evidenceType: "written" }),
  S("eq-machine-setup", "equipment", 3, "Machine and cartridge set-up", "Assembles, disassembles, tunes and troubleshoots machines; selects correct cartridges or needles for the task."),
  S("eq-maintenance", "equipment", 3, "Machine maintenance", "Basic maintenance: tuning, spring type and tension, throw, alignment and cleaning; liners versus shaders, frame materials and coils.", { isCore: false }),
  S("eq-rotary-coil", "equipment", 3, "Rotary versus coil", "Explains the differences between rotary, coil and pen machines and a well-made versus a poor machine.", { evidenceType: "written" }),
  S("eq-tubes-effect", "equipment", 3, "Tubes and performance", "Explains how steel and plastic tubes and different grips affect machine performance.", { isCore: false, evidenceType: "written" }),
  S("eq-needles", "equipment", 3, "Needle composition", "Knows needle types, tapers, materials and groupings (round liners and shaders, magnums, curved magnums) and their uses."),
  S("eq-power-voltage", "equipment", 3, "Power supply and voltage", "Sets appropriate voltage for lining and shading and adjusts safely during work."),
  S("eq-needle-position", "equipment", 3, "Needle position and depth", "Explains needle position and depth for lining, filling and shading."),

  // ── Stage 3: bedside manner ──────────────────────────────────────────────
  S("bed-comfort", "bedside", 3, "Client comfort", "Keeps the client relaxed and comfortable throughout."),
  S("bed-explain", "bedside", 3, "Explain the procedure", "Answers any question about set-up, break-down and the procedure itself."),
  S("bed-faint", "bedside", 3, "Faint or nauseous client", "Knows what to do if a client feels faint or nauseous."),
  S("bed-positioning", "bedside", 3, "Client positioning", "Positions the client correctly for the area being tattooed."),
  S("after-guidance", "aftercare", 3, "Aftercare guidance", "Dresses a tattoo correctly, documents the dressing used, explains aftercare without medical claims and problem-solves healing issues within the studio's limits."),
  S("anat-placement", "anatomy", 3, "Anatomy and placement risks", "Knows difficult areas, how skin moves and ages, and where to advise against placement."),

  // ── Stage 3: drawing ─────────────────────────────────────────────────────
  S("drw-flash-on-skin", "drawing", 3, "First flash set on practice skin", "Tattoos the designs from the first flash set in colour and other challenging designs on practice skin.", { evidenceType: "practical" }),
  S("des-composition", "design", 3, "Design composition", "Produces a client-ready design that reads well at the intended size, with a fully rendered study and a line drawing for every tattoo."),
  S("des-cover-up", "design", 3, "Cover-up assessment", "Assesses what a cover-up can realistically achieve and when to refer.", { isCore: false }),

  // ── Stage 4: intermediate tattooing ──────────────────────────────────────
  S("int-unobserved", "fundamentals", 4, "Unobserved tattoos", "Performs small tattoos without direct observation, at the discounted apprentice price set by the owner, while still reviewing each one with a tattooer."),
  S("int-discussions", "fundamentals", 4, "Intermediate discussions", "Discusses pricing (hourly and per piece), single and multi-session timing, when to take on larger work, earning and giving respect, custom versus walk-ins.", { evidenceType: "written" }),
  S("bus-time-management", "business", 4, "Time management and preparation", "Schedules appointments, has drawings ready, takes deposits and prepares the station in good time."),
  S("ops-booking", "operations", 4, "Booking and studio software", "Manages enquiries, quotes and bookings correctly in the studio system."),
  S("comm-messaging", "communication", 4, "Client messaging", "Writes clear, professional replies and quotes in the studio voice."),
  S("int-records", "fundamentals", 4, "Record every tattoo", "Continues recording thoughts, results, observations and problems for every tattoo.", { evidenceType: "written" }),
  S("int-rendered-studies", "design", 4, "Rendered study for every tattoo", "Completes a fully rendered study and a line drawing for every tattoo, reviewed weekly.", { evidenceType: "portfolio" }),

  // ── Stage 5: completion ──────────────────────────────────────────────────
  S("cmp-portfolio", "completion", 5, "Finished professional portfolio", "A finished professional portfolio of healed work with permissions recorded.", { evidenceType: "portfolio" }),
  S("cmp-interview", "completion", 5, "Talk about your journey", "Gets interviewed about the apprenticeship (local paper, school, magazine, web or social media).", { isCore: false }),
  S("cmp-cpd", "completion", 5, "Continuing development", "Commits to continuing education as the industry progresses; renews first aid and infection-control training before expiry."),
  S("cmp-attitude", "completion", 5, "Focused, friendly and humble", "Stays focused, friendly and humble.", { evidenceType: "observation" }),
];
