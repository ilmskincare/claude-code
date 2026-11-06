# Rebellious Hustler store

The online shop for Rebellious Hustler, the Birmingham clothing brand at 4 Fox & Goose Shopping Centre, B8 2EP. It replaces the old Shopify store at rebellioushustler.com.

Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Prisma 7 on Postgres, Stripe Checkout, Vercel Blob for photos, Resend for email. UK English, GBP, UK consumer law baked into the legal pages.

See `docs/01-store-overview.md` for the pages, data model and flows.

## Run it locally

Requirements: Node 20.9 or newer and a Postgres server. The dev container already has Postgres on `localhost:5433` (user `postgres`, no password) with an empty database called `rebellious_hustler`.

```bash
cd rebellious-hustler
npm install
cp .env.example .env            # then fill in at least DATABASE_URL, SESSION_SECRET and ADMIN_INITIAL_PASSWORD
npm run db:migrate              # applies prisma/migrations to the "shop" schema
npm run db:seed                 # admin user, settings, 8 sample products with placeholder art
npm run dev                     # http://localhost:3000
```

Sign in at `/admin/login` as `hustler` with the password you put in `ADMIN_INITIAL_PASSWORD`. You are asked to change it straight away.

Without Stripe keys the cart shows "Online checkout is being connected. Message us on Instagram to order." instead of a checkout button, so you can work on the catalogue first.

## Environment variables

| Variable | Meaning |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Keep `?schema=shop` on the end: every table lives in the `shop` schema so the store can share a server with another app. |
| `APP_BASE_URL` | Public origin of the site (e.g. `https://rebellioushustler.com`). Used for Stripe return URLs, email links, the sitemap and Open Graph tags. |
| `SESSION_SECRET` | Random string that signs the cart cookie and the admin session cookie. Production refuses to start with the development default. |
| `STRIPE_SECRET_KEY` | Stripe secret key. When unset the checkout button is replaced by the Instagram notice. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the `/api/stripe/webhook` endpoint. Orders are only created when this is set and the signature verifies. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for product photos when running outside Vercel. |
| `BLOB_STORE_ID` | Set automatically by Vercel when a Blob store is connected; the SDK then fetches its own short-lived token, so no `BLOB_READ_WRITE_TOKEN` is needed. With neither set, photos are written to `./storage` and served from `/api/files` (development only). |
| `RESEND_API_KEY` | Resend API key for order confirmation and dispatch emails. When unset, emails are printed to the server log instead. |
| `EMAIL_FROM` | Sender shown on customer emails, e.g. `Rebellious Hustler <orders@rebellioushustler.com>`. The domain must be verified in Resend. |
| `ADMIN_INITIAL_PASSWORD` | Read only by the seed script to create the first admin user. Never hard-coded, never stored in plain text. |

The admin Settings page lists which of these are still missing on the running deployment.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with Turbopack. |
| `npm run build` | `prisma generate` then `next build`. |
| `npm start` | Serve the production build. |
| `npm run lint` | ESLint (eslint-config-next). |
| `npm run typecheck` | `prisma generate` then `tsc --noEmit`. |
| `npm test` | Vitest unit and integration tests. Integration tests use the database in `.env` and clean up after themselves. |
| `npm run test:e2e` | Playwright smoke test (`tests/e2e/smoke.spec.ts`). Starts the dev server itself and uses the Chromium at `/opt/pw-browsers/chromium`; set `PW_CHROMIUM_PATH` elsewhere. Needs a seeded database. |
| `npm run db:migrate` | `prisma migrate deploy` (production and CI). |
| `npm run db:migrate:dev` | `prisma migrate dev` for creating new migrations locally. |
| `npm run db:seed` | Seed admin, settings and sample products. Safe to run again: existing data is kept, untouched samples are refreshed. |

## Stripe webhook

Orders are created by the webhook, not by the success page, so this must be set up before taking real orders.

1. In the Stripe dashboard go to Developers, Webhooks, Add endpoint.
2. URL: `https://rebellioushustler.com/api/stripe/webhook` (or your preview URL).
3. Events: `checkout.session.completed` only.
4. Copy the signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

Locally, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# put the printed whsec_... into .env as STRIPE_WEBHOOK_SECRET, restart npm run dev
stripe trigger checkout.session.completed   # creates a session without our metadata, so it is ignored; use a real test checkout instead
```

Test cards: `4242 4242 4242 4242`, any future expiry, any CVC, a GB postcode.

The handler is idempotent: a redelivered event (same event id) or a second event for the same Checkout session is ignored, so Stripe retries are safe.

## Going live

1. Create a Postgres database (for example on the same server as the other app). Run `npm run db:migrate` against it with `DATABASE_URL` including `?schema=shop`.
2. Run `npm run db:seed` once with `ADMIN_INITIAL_PASSWORD` set, then sign in and change the password.
3. On Vercel: import the repo with root directory `rebellious-hustler`, connect a public Blob store (sets `BLOB_STORE_ID`), and add `DATABASE_URL`, `APP_BASE_URL`, `SESSION_SECRET` (use `openssl rand -base64 32`), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.
4. Verify the sending domain in Resend so `EMAIL_FROM` works.
5. Add the Stripe webhook endpoint (above) with the live signing secret. Switch from test keys to live keys only when the owner is ready to take money.
6. Replace the eight sample products with real products and photos (or delete them), fill in the opening hours on the contact page and the `[legal entity name]`, `[company number]` and `[VAT number]` placeholders in the terms and privacy pages.
7. Point rebellioushustler.com at the deployment and check `/sitemap.xml`, `/robots.txt` and a test order end to end.

## Admin guide

Sign in at `/admin`. Sessions last 12 hours. Five wrong passwords lock the account for 15 minutes.

- **Dashboard**: orders and revenue today and this week, orders waiting to be dispatched, low stock count, and a warning listing anything still not connected.
- **Products**: list by status. Each product has a name, web address, range (Mens, Womens, Boys, Girls, Everyone), category (Tracksuits, T-shirts, Hoodies, Sportswear, Accessories), price in pounds, optional "was" price, description and a featured flag for the home page. Sizes and colours are a grid of variants, each with a SKU and a stock count; use "Generate grid" to build it from comma-separated lists. New products start as drafts. Use "Publish live" when the photos are in, "Back to draft" to hide it, "Archive" for anything discontinued. Photos: drag and drop or choose files; they are resized to 1600 px with a 600 px thumbnail, can be reordered and deleted, and the first one is used on the shop grid. Seeded products carry a "Sample product" badge until you save them with real details.
- **Orders**: filter by status. The order page shows items, delivery address, Stripe references and history. "Mark as fulfilled" takes an optional tracking reference and emails the customer. Cancellations and refunds are done in Stripe first, then recorded here with a note.
- **Stock**: every variant at or below the threshold (5 by default). Edit stock on the product page.
- **Settings**: UK Standard and UK Express prices, the free delivery threshold, the announcement bar text, contact email, Instagram handle, shop address, and a checklist of environment variables.

Every admin change is written to the audit log with who did it, when, and the before and after values.
