# Architecture decision records

Format: context, decision, consequences. Dates are 21 October 2026.

## ADR-01 Prisma 7 with the pg driver adapter
Context: the brief allows Prisma or Drizzle; Prisma 7 requires a driver adapter and moved connection config to `prisma.config.ts`.
Decision: Prisma 7.10 with `@prisma/adapter-pg`, generated client in `src/generated/prisma` (git-ignored), custom SQL appended to the generated migration for constraints and triggers.
Consequences: typed relations and a readable schema that doubles as the entity map; custom SQL lives in migrations and must be kept when regenerating.

## ADR-02 Cache Components off
Context: Next 16 defaults to `cacheComponents: true`, which requires Suspense boundaries around every dynamic read.
Decision: `cacheComponents: false`. Every operational page renders live data per request; caching is opt-in per query if ever needed.
Consequences: simpler correctness for a data-heavy app; marginally slower public pages, acceptable at studio scale.

## ADR-03 Auth.js database sessions with email magic links
Context: no shared passwords; clients, artists and owner must all sign in simply.
Decision: Auth.js v5 beta, Resend provider with a custom `sendVerificationRequest`, database sessions (revocable), `signIn` callback refuses suspended users, `DeviceLog` on sign-in.
Consequences: MFA for privileged roles (P1-14) and session revocation UI (P1-21) are required before production.

## ADR-04 Exclusion constraints plus advisory locks for collisions
Context: two clients must never both confirm the same artist/time.
Decision: `pg_advisory_xact_lock(hashtext(artistId))` serialises hold creation; `EXCLUDE USING gist` constraints on `Appointment` (artist and station) and `BookingHold` (artist) are the backstop; appointments are only created from valid holds.
Consequences: correctness does not depend on application code paths; proven by `tests/integration/booking-race.test.ts`.

## ADR-05 Integer pence and an append-only ledger
Context: finance must be auditable and corrections traceable.
Decision: all money in integer pence; `FinancialLedgerEntry` is double-entry with balanced journals, DB triggers forbid UPDATE/DELETE, corrections are reversal journals linked by `reversalOfId`.
Consequences: dashboards aggregate ledger and verified payments only; "profit" is never computed from assumptions.

## ADR-06 Restricted schema for health data
Context: health answers are UK GDPR special-category data.
Decision: `ClientHealthRecord` and `HealthAccessLog` live in the Postgres schema `restricted`; answers are stored as an AES-256-GCM ciphertext blob with a key from `HEALTH_DATA_KEY`; every read is logged and the log is immutable. Access only through `src/lib/health/*` (Phase 2).
Consequences: a separate database role and RLS can be applied to the schema; health data can never appear in general queries by accident.

## ADR-07 Local storage driver for development only
Context: reference images and PDFs are private.
Decision: a storage interface with HMAC-signed, expiring URLs served by `/api/files/[key]`; the `local` driver writes to disk and production refuses to start with it; `s3` driver is P1-12.
Consequences: no public bucket, no direct object URLs in HTML.

## ADR-08 Development outbox never in production
Context: no email provider in development, but production must never fake sending.
Decision: `sendEmail` writes to `DevMailbox` only when `NODE_ENV !== production` and no `RESEND_API_KEY`; `env()` throws in production without Resend, Stripe and S3.
Consequences: a "sent" status always means a provider accepted the message in production.

## ADR-09 Stripe Checkout, no custom wallet, Connect deferred
Context: deposits must be real and reconciled; artists may be independent merchants.
Decision: Stripe Checkout Sessions with idempotency keys and metadata; confirmation only from a signature-verified webhook or an authorised manual verification; no stored card data; Stripe Connect only after the merchant-of-record decision.
Consequences: the success page never confirms a booking by itself.

## ADR-10 Booking references from counter rows
Context: references must be unique and readable (`RI-2026-001234`).
Decision: `BookingReferenceCounter(prefix, year)` incremented with `UPDATE … RETURNING` inside the booking transaction.
Consequences: unique under concurrency; prefixes `RI`, `ENQ`, `INV`.

## ADR-11 Europe/London via luxon
Context: BST changes must not shift appointments.
Decision: all storage in `timestamptz`; slot generation and display in `Europe/London` using luxon; tested across the October 2026 clock change.
Consequences: `STUDIO_TIMEZONE` is configurable but defaults to London.

## ADR-12 Brand palette from the logo, not the prompt
Context: the brief proposed Forest/Parchment/Brass, but the owner asked to ignore prompt colouring unless it matched the supplied logo.
Decision: tokens sampled from the logo: ink `#070807`, acid green `#8cb000` (bright `#a6d118`, deep `#5f8300`), bone `#eef1e6`; Cinzel display, Inter body; 17px body text.
Consequences: dark shells for staff and owner areas, light shell for clients; brass is not used.

## ADR-13 Application lives in a subfolder of the claude-code fork
Context: the only repository reachable in this session was `ilmskincare/claude-code`.
Decision: build under `rebellious-ink/` on branch `feat/rebellious-ink-studio-os`; recommend moving to a dedicated repository before staging.
Consequences: CI and Vercel root must point at the subfolder until the move.
