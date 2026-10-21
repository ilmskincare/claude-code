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
