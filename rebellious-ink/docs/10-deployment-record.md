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

