# Stack and integration prerequisites

## Verified stack (installed and type-checked in this build)

| Component | Version | Why |
|---|---|---|
| Node.js | 22 | Current LTS; required by Next 16 and Prisma 7. |
| Next.js (App Router) | 16.4.2 | Server components, server actions, route handlers, `proxy.ts`. `cacheComponents` is off so operational pages are always live. |
| React | 19.3.0 | `useActionState` for progressive forms. |
| TypeScript | 5.x | Strict typing end to end. |
| Tailwind CSS | 4.x | Design tokens via `@theme`; brand CSS in `src/app/globals.css`. |
| Prisma | 7.10.1 with `@prisma/adapter-pg` and `pg` 8.23 | Typed schema, migrations, multi-schema (`public`, `restricted`); the pg driver adapter is required in Prisma 7. |
| PostgreSQL | 16 (local cluster for development) | Exclusion constraints, advisory locks, triggers. |
| Auth.js (next-auth) | 5.0.0-beta.32 with `@auth/prisma-adapter` 2.11 | Passwordless email, database sessions, `signIn` callback blocks suspended users. |
| Resend | 6.34.1 | Transactional email; falls back to a DevMailbox table outside production. |
| Stripe | 23.0.0 | Checkout Sessions for deposits; webhook signature verification; idempotency keys. |
| zod | 4.6.7 | Validation of every form, action and env. |
| luxon | 3.7.2 | Europe/London arithmetic including BST changes. |
| @react-pdf/renderer | 4.9.0 | Server-side branded A4 PDFs. |
| vitest | 5.0.5 | Unit and integration tests. |
| @playwright/test | 1.64.x | End-to-end tests and screenshots (Chromium pre-installed in the build container). |
| tsx, dotenv | latest | Seed script and env loading. |

## Environment variables (`.env.example`)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `AUTH_SECRET` | Yes | Auth.js signing secret (`openssl rand -base64 32`). |
| `AUTH_URL`, `APP_BASE_URL` | Yes | Public origin for links and callbacks. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Production | Email sending. Without the key, non-production writes to DevMailbox; production refuses to start. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Card deposits. Without them the booking page shows bank-transfer instructions and the desk verifies deposits by hand; set both Stripe secrets together. |
| `STORAGE_DRIVER` (`local` or `s3`), `STORAGE_LOCAL_DIR`, `STORAGE_SIGNING_SECRET`, `S3_*` | Yes | Private object storage. Production refuses `local`. The S3 driver is ticket P1-12. |
| `STUDIO_TIMEZONE` | Default `Europe/London` | Studio clock. |
| `HEALTH_DATA_KEY` | Phase 2 | AES-256-GCM key for health answers. |
| `WHATSAPP_*`, `GOOGLE_CALENDAR_*`, `AI_*` | Optional | Future feature-flagged adapters. |

`src/lib/env.ts` validates all of this on first use and throws in production when a required provider is missing.

## Per-integration prerequisites

Stripe
1. Owner creates a Stripe account in the legal entity's name (blocking question 1).
2. Test mode first: set the three Stripe variables with test keys; create a webhook endpoint for `/api/stripe/webhook` subscribed to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
3. Run a full test-card deposit on staging and confirm the appointment moves to `CONFIRMED` via the webhook (not the success page).
4. Live keys only after the owner signs off the deposit policy and receipts wording.
5. Stripe Connect is deferred until the merchant-of-record decision (blocking question 9). No custom wallet will be built.

Resend
1. Add and verify the sending domain (SPF, DKIM) for the address in `EMAIL_FROM`.
2. Set `RESEND_API_KEY`. The DevMailbox fallback is disabled automatically.

Database (Supabase Postgres or equivalent)
1. Create a project; run `npx prisma migrate deploy`.
2. Ensure `btree_gist` is available (it is on Supabase).
3. Row-level security is not yet configured; the application enforces scoping. Adding RLS policies for the `restricted` schema is recommended before Phase 2 (ticket P2-02).
4. Enable point-in-time recovery and test a restore before real client data.

Object storage (S3-compatible: Supabase Storage, Cloudflare R2, AWS S3)
1. Create a private bucket; no public access.
2. Implement and switch `STORAGE_DRIVER=s3` (ticket P1-12). Signed URLs remain short-lived.

Vercel
1. Move or link the repository (blocking question 10) and import the `rebellious-ink` folder as the project root.
2. Set all environment variables for Preview and Production separately; never share Stripe live keys with Preview.
3. Add a Vercel Cron (or external scheduler) hitting a protected route that calls `expireLapsedHolds()` every five minutes (ticket P1-17).
4. Protect Preview deployments with Vercel authentication.

Future adapters (feature-flagged, not built)
- WhatsApp Business Platform: requires Meta business verification, approved templates and client opt-in (`PrivacyPreference.WHATSAPP_CONTACT`). Fallback is an invitation link; no scraping or simulated login.
- Google Calendar: optional one-way mirror of confirmed appointments.
- Accounting (Xero/QuickBooks): CSV export first; direct connection later. No direct HMRC filing will be claimed.

## Owner actions required before staging

- [ ] Answer `docs/01-blocking-questions.md`.
- [ ] Create Stripe (test), Resend, managed Postgres, storage bucket and Vercel accounts, or grant access.
- [ ] Confirm the sending domain and the public hostname.
- [ ] Nominate the practitioners who approve guides and the reviewer for consent forms.
- [ ] Confirm the artist roster, working hours and current arrangements so the fictional seed can be replaced.
