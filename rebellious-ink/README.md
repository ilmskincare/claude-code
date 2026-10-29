# Rebellious Ink Studio OS

A tattoo and piercing studio management platform for Rebellious Ink (UK): client enquiries and bookings, artist workspaces and an owner command centre on one secure database.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Prisma 7 on PostgreSQL 16, Auth.js v5 (passwordless email via Resend), Stripe Checkout deposits with verified idempotent webhooks, and server-rendered branded PDFs.

## Quick start

```bash
npm install
createdb rebellious_ink_dev && createdb rebellious_ink_test   # PostgreSQL 16 with btree_gist
cp .env.example .env                                            # set DATABASE_URL and AUTH_SECRET
npx prisma migrate dev
npm run db:seed        # fictional TEST data only
npm run dev            # http://localhost:3000
```

Sign in at `/login` with a seeded address such as `owner@test.rebelliousink.local`. Without `RESEND_API_KEY` the magic link is shown on the check-email page (development only).

## Tests

```bash
npm test                  # unit tests (vitest)
npm run test:integration  # booking races, deposits, ledger immutability, Stripe webhook (uses .env.test)
npm run test:e2e          # Playwright end-to-end with screenshots (needs dev server and seed)
```

## Documentation

- [00 Product scope and phased plan](docs/00-product-scope-and-phased-plan.md)
- [01 Blocking questions for the owner](docs/01-blocking-questions.md)
- [02 Sitemap and permission matrix](docs/02-sitemap-and-permission-matrix.md)
- [03 Entity relationship map](docs/03-entity-relationship-map.md)
- [04 Stack and integration prerequisites](docs/04-stack-and-integration-prerequisites.md)
- [05 Implementation tickets](docs/05-implementation-tickets.md)
- [06 Architecture decision records](docs/06-architecture-decision-records.md)
- [07 Risk register](docs/07-risk-register.md)
- [08 Security and permissions report](docs/08-security-and-permissions-report.md)
- [09 Acceptance test status](docs/09-acceptance-test-status.md)
- [10 Deployment record](docs/10-deployment-record.md)

## Brand

Colours are sampled from the approved logo: ink `#070807` and acid green `#8cb000`, with Cinzel for display type and Inter for body text. The palette suggested in the original brief was not used, at the owner's instruction. The logo is used as supplied; rights confirmation is an open question.

## Truthfulness

Nothing is deployed. All seeded people, enquiries and images are fictional and labelled "(TEST)". Guides are drafts until a qualified practitioner records approval. Email, payments and storage run on development fallbacks unless the providers are configured, and production refuses to start without them.

## Licence and ownership

To be confirmed with the owner of Rebellious Ink.
