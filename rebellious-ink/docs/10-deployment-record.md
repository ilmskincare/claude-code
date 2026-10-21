# Deployment record

## Current state (truthful)

- The application is NOT deployed anywhere. There is no staging or production URL.
- It has only been run on the development machine used for this session: Next.js dev server on `http://localhost:3000` against a local PostgreSQL 16 cluster on port 5433 (databases `rebellious_ink_dev` and `rebellious_ink_test`).
- No live provider keys exist in the repository. `.env` is git-ignored; `.env.test` contains placeholder strings (`sk_test_placeholder_not_real`, `whsec_test_placeholder_not_real`) used only to exercise the signature-verification code path.
- Email in this environment goes to the `DevMailbox` table; card payments are "not connected"; uploads are on local disk.
- All seed data is fictional and labelled "(TEST)".

## Running locally

```bash
cd rebellious-ink
npm install
# PostgreSQL 16 with the btree_gist extension available, then:
createdb rebellious_ink_dev && createdb rebellious_ink_test
cp .env.example .env   # set DATABASE_URL and AUTH_SECRET
npx prisma migrate dev          # applies migrations, generates the client
npm run db:seed                 # fictional TEST data
npm run dev                     # http://localhost:3000
```

Sign in with any seeded address (for example `owner@test.rebelliousink.local`); the magic link appears on the "check your email" page because no email provider is configured.

Tests:

```bash
npm test                 # unit (vitest)
npm run test:integration # integration against DATABASE_URL in .env.test
npm run test:e2e         # Playwright, needs the dev server and seeded database
```

Health check: `GET /api/health` reports database, email, payments and storage status.

## Staging deployment plan (Vercel + managed Postgres)

1. Move the app to its own repository or point the Vercel project root at `rebellious-ink/`.
2. Create a managed Postgres (Supabase or equivalent) with `btree_gist`; run `npx prisma migrate deploy` from CI or locally against it. Do not seed staging with the TEST seed if real staff will test; create real accounts via invitations once P1-20 exists.
3. Create a private S3-compatible bucket and implement P1-12 before enabling uploads on staging.
4. Resend: verify the sending domain; set `RESEND_API_KEY`, `EMAIL_FROM`.
5. Stripe test mode: set the three keys; register the webhook `https://<staging-host>/api/stripe/webhook`.
6. Vercel environment variables (Preview and Production separately): `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `APP_BASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STORAGE_DRIVER=s3`, `STORAGE_SIGNING_SECRET`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `STUDIO_TIMEZONE=Europe/London`.
7. Add a Vercel Cron for hold expiry and reminders (P1-17).
8. Protect the Preview deployment with Vercel authentication; run `/api/health` and a full test-card booking end to end.
9. Only after blocking questions 1, 5, 7 and 8 are answered: switch Stripe to live keys in Production and remove draft banners by recording approvals.

## Record of deployments

| Date | Environment | URL | Commit | Outcome |
|---|---|---|---|---|
| — | none | — | — | No deployment has been performed. |


## Staging attempt, 21 October 2026 (afternoon)

Requested: a staging environment on Vercel and Supabase. Outcome so far: **not deployed**, blocked on two account-level permissions that only the owner can change. Everything the code needs for a serverless staging tier is now in place and tested.

| Step | Result |
|---|---|
| Supabase `create_project` (org "Nikkis Ai ADHD Team", region eu-west-2 London) | Refused: the organisation is at the free-tier limit of two active projects. Owner chose to upgrade the organisation first. |
| Vercel `create_project` / `create_deployment` in team "Lush Labs' projects" | Refused with HTTP 403 "You don't have permission to create a project". The connected Vercel integration can list the team's projects but not create one. |
| Direct Postgres from this container (port 5432) | Blocked by the container network policy, so migrations will be applied through the Supabase management API and recorded in `_prisma_migrations` manually. |

### Code prepared for staging (committed on this branch)
- `APP_ENV=staging` tier: production guards (`RESEND_API_KEY`, Stripe keys, non-local storage) apply only when `APP_ENV` is `production`; staging keeps the development outbox so sign-in works without an email provider. **Staging must sit behind Vercel Authentication (deployment protection) because the check-email page shows the magic link when no email provider is configured.**
- `STORAGE_DRIVER=blob`: private Vercel Blob storage for reference images and PDFs, still served only through the HMAC-signed `/api/files` route.
- `export const dynamic = "force-dynamic"` on the root layout so no page is prerendered at build time against an empty database.
- `/api/jobs/expire-holds` protected by `CRON_SECRET`, scheduled every 10 minutes in `vercel.json`.
- `scripts/export-seed-sql.sh` (data-only SQL dump of the fictional seed for loading through the Supabase API) and `scripts/upload-seed-assets.ts` (placeholder portfolio images into the Blob store).

### Owner actions required before staging can exist
1. **Supabase**: upgrade the organisation (or pause one existing project), then say so; a `rebellious-ink-staging` project will be created in eu-west-2 (London).
2. **Vercel**: either grant the connected Claude integration permission to create projects in "Lush Labs' projects", or create an empty project named `rebellious-ink-staging` (framework Next.js, root directory `rebellious-ink`) and turn on Vercel Authentication for all deployments.
3. Nothing else: secrets (`AUTH_SECRET`, `STORAGE_SIGNING_SECRET`, `CRON_SECRET`) will be generated and set as environment variables at deployment time and never committed.


## Staging is live, 21 October 2026, 12:40 BST

| Item | Value |
|---|---|
| URL | https://rebellious-ink-staging.vercel.app (Vercel project `rebellious-ink-staging`, team "Lush Labs' projects", Hobby plan) |
| Access | Vercel Authentication on every deployment URL: only members of the Vercel team can open it. A protection-bypass secret exists for automated checks. |
| Database | Supabase project `rebellious-ink-staging` (ref `qfzzbyjeytfmhzhqskit`), region eu-west-2 London, Postgres 17, transaction pooler on port 6543, TLS verified against the Supabase root CA (`DATABASE_SSL_CA`). Connects as the project's default `postgres` role; a least-privilege application role is a pre-production ticket. |
| Schema | `20261021095556_init` applied through the Supabase management API and recorded in `_prisma_migrations` with its checksum. 82 tables, 3 exclusion constraints, 4 immutability triggers verified. |
| Data | Fictional TEST seed loaded from a data-only SQL export: 8 users, 4 practitioners, 8 guides, 2 enquiries, 1 appointment. Placeholder portfolio images uploaded to the private Blob store. |
| Files | Vercel Blob store `rebellious-ink-staging-files`, private access, region lhr1, served through the HMAC-signed `/api/files` route. |
| Email | None configured (`APP_ENV=staging`): the sign-in page shows the magic link itself, which is only acceptable because the site sits behind Vercel Authentication. |
| Payments | Stripe not connected: bookings show bank-transfer instructions and the owner verifies deposits manually. |
| Jobs | `/api/jobs/expire-holds` daily at 03:00 UTC (Hobby limit); lapsed holds are also released lazily when bookings are made. |
| Deployment method | Vercel CLI from this branch (`vercel deploy --prod`), not Git-linked. Pushes do not deploy automatically yet. |

Verified after deployment: `/api/health` reports database ok; home, artists, artist profile, guides, guide PDF, enquiry form and login return 200; a real browser signed in as `owner@test.rebelliousink.local`, loaded the Studio overview and the two seeded enquiries, and private portfolio images rendered through the signed route (screenshot `docs/screenshots/staging-owner-dashboard.png`).

Problems met and fixed on the way: Hobby plan rejects sub-daily cron (schedule changed, lazy expiry added); build-time environment validation (Auth.js config made lazy); Supabase certificate chain rejected by node-postgres (root CA supplied and verified rather than disabling verification).

Tokens used for this deployment were held only in the session's scratch space and should now be revoked by the owner (Vercel account tokens page; Supabase account tokens page).


## Staging update, 21 October 2026, 13:15 BST

Deployed and verified in a real browser against https://rebellious-ink-staging.vercel.app:

- Migrations `20261021113500_hours_and_thread_attachments` and `20261021114910_inventory_and_apprentice_portal` applied through the Supabase management API and recorded in `_prisma_migrations`.
- Seed additions loaded idempotently (29 skills, 6 products with lots, apprentice progress and hours, supplies-included flags on the two arrangements).
- Artist hours: walk-in hours added, shown on the public profile, removed again (`staging-artist-hours.png`).
- Consultation attachments: an image attached to a live thread was stored in the private Blob store and served back through the signed route (HTTP 200).
- Stock: owner stock page lists six products; selling one box of gloves to Mo moved on-hand from 8 to 7 and recorded the sale (`staging-owner-stock.png`).
- Apprentice portal: the owner review page shows verified hours and a disabled junior-artist sign-off with its blockers; the apprentice's own portal shows no sign-off controls (`staging-owner-apprentice.png`, `staging-apprentice-portal.png`).

## Staging update, 21 October 2026, late afternoon

Deployed (`vercel deploy --prod`, deployment `rebellious-ink-staging-lwrudg52g`) and verified in a real browser against https://rebellious-ink-staging.vercel.app:

- Migration `20261021123029_rate_cards_retail_loyalty_marketing_social` applied through the Supabase management API and recorded in `_prisma_migrations` (four migrations now listed).
- Seed additions loaded idempotently: rate cards for Mo and Jay, Sam's piercing list and ten-line price list, five `loyalty.*` settings, Casey's loyalty account (`CASE-TEST`, £15.00 opening credit) and marketing opt-in.
- Ask the desk (`/owner/rates`) as the reception user: all four practitioners, Mo's hourly £100.00–£120.00, Sam's price list and private desk notes (`staging-ask-the-desk.png`).
- Piercer saved their own card, then sold one titanium labret: on-hand moved from 8 to 7 (`staging-piercer-sales.png`).
- Client rewards page shows the referral code and £15.00 credit (`staging-client-rewards.png`); preferences page renders.
- Owner marketing page reports 1 opted-in client (`staging-owner-marketing.png`); social page explains Buffer is not connected and keeps posts as drafts until `BUFFER_ACCESS_TOKEN` and `BUFFER_ORGANIZATION_ID` are set in the Vercel project.
- Public piercer page shows the price list; the private desk notes do not appear on any public page (checked by text search).

Still to configure on Vercel for the social module: `BUFFER_ACCESS_TOKEN` and `BUFFER_ORGANIZATION_ID`. Buffer must be able to fetch the image URL it is given, so image posting from staging will only work once Deployment Protection is off or a public image host is used; captions post regardless.

## Staging update, 21 October 2026, evening

Deployed (`vercel deploy --prod`) and verified in a real browser against https://rebellious-ink-staging.vercel.app:

- Migration `20261021130635_product_photos_and_promotions` applied through the Supabase management API and recorded in `_prisma_migrations` (five migrations now listed).
- Seed additions loaded idempotently (run twice, same counts): photo keys on all six products, three promotions (studio-wide balm offer, Mo's "20% off flash" with code FLASH20, one ended offer for Jay). Placeholder product PNGs uploaded to the private Blob store with `scripts/upload-seed-assets.ts`.
- Public artists page shows the studio banner and Mo's ribbon only; Mo's page shows the offer box with the code; the home page card carries the ribbon (`staging-public-promotions.png`).
- Owner stock list shows six thumbnails served through the signed file route (HTTP 200); uploading a new photo to the titanium labret stored it in Blob and displayed it (`staging-stock-photos.png`).
- Owner promotions page lists live, live, ended (`staging-owner-promotions.png`); piercer's sale form shows the photo picker (`staging-piercer-sales-photos.png`).
- Follow-up deploy in the same session added top padding to ribboned cards so the ribbon no longer overlaps the "Taking enquiries" badge.

## Staging update, 21 October 2026, late evening: flash catalogue

Deployed (`vercel deploy --prod`) and verified in a real browser against https://rebellious-ink-staging.vercel.app:

- Migration `20261021140313_flash_catalogue` applied through the Supabase management API and recorded (six migrations listed). The unused `FlashDesign`/`ArtworkRights` tables were dropped by it.
- Seed loaded idempotently (run twice, same counts): 12 TEST designs (4 one-offs, 2 cut from an uploaded sheet), 1 sheet; placeholder PNGs uploaded to the Blob store; the seeded apprentice given Tue–Sat hours so the apprentice tier is bookable.
- Public catalogue shows 12 tiles with prices, the sheet view with its numbered hotspot, the design page with the £70 override and the size guide; choosing "neck" switches the button to "Request a quote" (`staging-flash-catalogue.png`, `staging-flash-design.png`).
- A signed-in client booked "Fern sprig" at the apprentice tier and landed on the slot picker with the £15.00 deposit (`staging-flash-slot-picker.png`).
- Sheet images (feed 1080×1350, story 1080×1920) and the A4 PDF render from the live catalogue with QR codes (`staging-sheet-feed.png`).
- Owner flash page lists all 12 designs with effective prices and status (`staging-owner-flash.png`).

Note: during one full local test run the marketing integration test failed once while the Playwright suite was running at the same time; it passed on its own and in the next full run (45/45). The two suites use different databases, so this is logged as unexplained rather than fixed.

## Staging update, 21 October 2026, late evening: apprenticeship catalogue v2

- Migration `20261021144800_apprenticeship_stages` applied and recorded (seven migrations listed): `stage`, `evidenceType` and `isActive` on `Skill`.
- Catalogue upserted by key (run twice, same counts): 118 active items, 89 core, 0 retired; the 4 existing progress rows survived and still show on the board.
- Apprentice portal verified on staging: six collapsible stages with "n of m signed off" counts, prerequisites open first, "Hand hygiene and glove use" still Competent (`staging-apprentice-stages.png`).

## Staging update, 21 October 2026, night: public-domain flash images

- The plain-colour flash placeholders were replaced with crops from six CC0 Smithsonian American Art Museum flash sheets (credits and the crop recipe in `docs/13-image-credits.md` and `scripts/import-archive-flash.ts`). Titles carry "(archive)" so they cannot be mistaken for the studio's own work; no flags, service initials, religious symbols, nudity or red cross emblems were used.
- Eleven JPEGs uploaded to the Blob store; design and sheet rows updated on staging by title (12 designs now on archive images, no TEST-titled designs left); the Sheets view shows the whole sheet with two hotspots (`staging-flash-archive.png`, `staging-flash-sheet.png`).
- No deploy was needed for the images (database and storage only). A small follow-up fixed the signed file route to send the right image content type for files that have no ImageAsset row.

## Staging update, 21 October 2026, night: gumball machine and one-size catalogue

- Migration `20261021152854_novelty_games` applied and recorded (eight migrations): `Play`, `PlayAlert`, `AnalyticsEvent`.
- Six repeatable gumball capsules seeded (archive artwork, run twice, same count); images uploaded to the Blob store.
- Verified in a real browser: landing page with the live "6 capsules in the machine" count (`staging-gumball-landing.png`); date-of-birth gate; free spin; reveal announced as "You got Swallow and anchor by Mo Blackwork" (`staging-gumball-result.png`); share card returns a PNG; "Keep it" lands on the slot picker with the £10.00 deposit and 406 free slots (`staging-gumball-slots.png`); a second spin the same day is refused; owner page shows capsules, the spin and the first-party counts (`staging-owner-gumball.png`).
- The catalogue now shows one price per design; the Palm size is hidden behind `flash.palmEnabled`.

## Staging update, 21 October 2026, night: Elle Evaa added as an artist

- Migration `artist_avatar` applied (nine migrations): `avatarKey` on `ArtistProfile`, shown on the artist's page, card and home tile; artists upload their own logo or portrait from Profile & rates.
- Elle Evaa created as a published tattoo artist (sign-in elle-evaa@test.rebelliousink.local, resident artist role, Tuesday to Saturday hours with Saturday walk-ins, station 1) with her logo and two portfolio photos supplied by the owner, publication permission recorded against each image. Idempotent SQL run twice with the same result; images in the Blob store.

## Staging update, 21 October 2026, night: flash sizing, flat placements, desk client capture

- No migration needed. Flash defaults are code: sizes 4 to 8 cm, fixed placements outer upper arm, outer and inner forearm, top of shoulder, outer thigh and calf; the Palm size is gone from every form and the settings page (`flash.sizeOptionsCm` and `flash.fixedPlacements` are editable by the owner).
- Design page: size radios, placement list with "Somewhere else (custom price)" which replaces the Book button with a link to the desk (`staging-flash-sizing.png`).
- Desk client capture at `/owner/clients`: consent script read to the client, yes / no / not asked, recorded with the desk member's name, the date and the wording version; list with search, enquiry and booking counts and the latest marketing answer (`staging-desk-clients.png`). Privacy notice gained a "Marketing and third parties" section: nothing shared or sold, processors only, one-click unsubscribe.

## Staging update, 21 October 2026, evening: gumball machine is a real control

- Reported from an iPad: capsules floated in a diagonal line, the step boxes sat under the left column only, and pressing PUSH did nothing. Capsules now pile in the bottom of the globe as two-tone capsules; the three steps run the full width under both columns; the crank and the PUSH flap are buttons. Before the age check they read LOCKED and pressing them scrolls to and focuses the date of birth box with a note; after it they turn the crank. The right-hand card then reads "Age check done".
- Verified in a real browser at iPad size on staging: locked press focuses the date of birth box, the note clears once the age check passes, the crank itself spins to a result, and a second visit shows "That is your spin for today" (`staging-ipad-gumball-locked.png`, `staging-ipad-gumball-ready.png`).

## Staging update, 21 October 2026, evening: age check cannot fail silently

- Reported from an iPad: "the gumball isn't working". The live build was replayed in WebKit (Safari's engine) as an iPad and passed end to end, and the analytics showed the iPad's visits with no completed age check. The cause: on an iPad the empty date box shows no prompt, and tapping Continue with it empty shows nothing in Safari.
- Fix: the age form shows "Tap the date box and pick your date of birth" if Continue is pressed with no date; the box carries a "Tap the box to pick the day, month and year" hint; pressing the locked crank scrolls to the age card and pulses its border. Verified in WebKit as an iPad on staging after deploy.
- WebKit is now installed in the session for Safari-engine checks (`npx playwright install webkit` plus its system libraries).

## Staging update, 21 October 2026, evening: two-step layout and the three machines

- Reported from an iPad: "doing nothing and it isn't obvious where to press". The age card now sits directly above the machine as "Step 1 of 2", a big "Step 2 of 2" button sits above the machine once the age check is done, the PUSH flap glows, and a "turning the crank…" message shows while the server picks. Replayed in WebKit as an iPad on staging.
- New game at `/play/trio`: three machines (ink, style, subject), £40 total, £10 deposit, one free go a day, artist chosen at booking. No migration (plays use the existing `Play.result` JSON). Settings `trio.*` editable by the owner; counts and recent goes on the owner Gumball page.


## Production set-up, 21 October 2026, evening: rebelliousink.tattoo

- Domain `rebelliousink.tattoo` bought by the owner through Vercel (auto-renew on, Vercel DNS), attached to a new Vercel project `rebellious-ink` (London functions). Separate from staging; staging keeps its login wall and test data.
- Production database: Supabase project `rebellious-ink-production` in London (eu-west-2), all nine migrations applied through the management API and recorded in `_prisma_migrations` with their checksums (97 tables). Connection over the transaction pooler with the Supabase CA pinned.
- Production files: private Vercel Blob store `rebellious-ink-prod-files-lhr` in London, connected to the project. A first store was created in the US by mistake and is empty; it needs deleting from the Vercel dashboard (Storage) because the CLI insists on an interactive confirmation.
- Production seed (idempotent SQL, run twice with the same counts; kept outside the repository because it names the owner's email): the studio, three stations, eight settings (loyalty off until the crowns scheme replaces it), the owner's account with OWNER and resident-artist roles, Elle Evaa's published profile with logo, Tuesday to Saturday hours and two portfolio pieces, a "House flash (archive)" profile that owns the twelve public-domain catalogue designs, the archive sheet and the six gumball capsules, so the catalogue and both games work from day one. No TEST data.
- Production configuration set on the project: `APP_ENV=production`, base URL, auth secret, cron secret, storage signing secret, health data key, timezone, `EMAIL_FROM` bookings@rebelliousink.tattoo, Blob token, database URL and CA. Stripe is now optional in production (bank-transfer deposits until a Stripe account exists).
- Still needed before the first deploy: a Resend API key (sign-in and booking emails). The script that registers the domain with Resend, writes its DNS records into Vercel DNS and verifies it is ready to run.
