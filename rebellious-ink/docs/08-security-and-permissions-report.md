# Security and permissions report — Phase 1

Date: 21 October 2026. Scope: the code on branch `feat/rebellious-ink-studio-os` under `rebellious-ink/`. Not deployed; no real client data exists.

## What is enforced today

| Control | Implementation |
|---|---|
| Authentication | Auth.js v5, email magic link, database sessions (14-day max age), suspended users refused at sign-in (`src/auth.ts`). |
| Authorisation | Capability model with role defaults and per-membership overrides (`src/lib/rbac.ts`); principal loaded server-side per request (`src/lib/session.ts`); every server action and page re-checks. |
| Record scoping | Enquiry, message, quote, booking and availability access filtered by client ownership or artist assignment; unauthorised access returns 404 so record existence is not leaked. |
| Route protection | `src/proxy.ts` redirects unauthenticated visitors from `/my`, `/studio`, `/owner` (optimistic only). |
| Input validation | zod schemas for enquiry, quote, reschedule, cancel, manual deposit, settings, availability query, env. Server actions parse `FormData` server-side. |
| Uploads | Allowed MIME list (JPEG, PNG, WEBP, HEIC, PDF), 15 MB cap, six files per enquiry, stored outside the web root with random keys, served only via HMAC-signed expiring links with `nosniff` and `X-Frame-Options: DENY`. Flagged files are never served. |
| Payments | Stripe Checkout; webhook signature verified against `STRIPE_WEBHOOK_SECRET` before parsing; `WebhookEvent(provider, eventId)` unique index makes processing idempotent; confirmation refuses underpayment; manual verification requires `finance.verify_manual_payment` and records the verifier. |
| Collisions | Per-artist advisory lock during hold creation; exclusion constraints on appointments and holds. |
| Financial integrity | Append-only ledger with balanced journals; UPDATE/DELETE blocked by trigger; reversals only. |
| Audit | `AuditLog` rows for enquiry creation, status changes, assignment, quote issue/approve/accept/decline, appointment creation, confirmation, reschedule, cancel, expiry, setting changes, with before/after and reason. IPs stored only as salted hashes. |
| Secrets | Only via environment; `.env`, `.env.local` and generated client git-ignored; `.env.example` has no values; `env()` refuses production without Resend, Stripe and non-local storage. |
| Email content | Subjects and bodies never include message text, quote scope or health data; they link to the portal. |
| Headers | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` on every response. |
| Health data | Models only exist in the `restricted` schema; nothing in Phase 1 reads or writes them. |

## Verified by automated tests

| File | Proves |
|---|---|
| `tests/unit/rbac.test.ts` | Artist A cannot access Artist B's or unassigned enquiries; clients see only their own; apprentices cannot quote or self-sign-off; overrides and suspension behave; age calculation around birthdays. |
| `tests/unit/enquiry-state.test.ts` | Only documented status transitions are allowed; no path to CONFIRMED without AWAITING_DEPOSIT. |
| `tests/unit/slots.test.ts` | 10:00 local stays 10:00 across the BST→GMT change; busy periods and minimum notice remove slots. |
| `tests/unit/calculator.test.ts` | £200 rent equals 40% of £500; 52/12 weeks per month; commission split loses no pence; eligible base rules. |
| `tests/unit/references.test.ts` | Reference format and GBP formatting. |
| `tests/integration/booking-race.test.ts` | Concurrent holds for one slot: exactly one succeeds; direct overlapping insert rejected by the database; appointment stays PENDING_DEPOSIT until a verified deposit; manual verification without a finance user refused; underpayment refused; second confirmation is a no-op with one payment row; ledger balanced; ledger rows immutable; lapsed holds release the slot with an audit row; tattoo hold refused without the 18+ declaration. |
| `tests/integration/webhook.test.ts` | Wrong secret fails signature check; valid `checkout.session.completed` confirms the appointment; replayed event is ignored; one payment row; confirmation email recorded. |

Run: `npm test` (unit), `npm run test:integration` (needs the test database on port 5433).

## Known gaps (must close before real client data)

1. No MFA for owner, manager or finance roles (P1-14).
2. No rate limiting or bot protection on public forms and sign-in (P1-19).
3. No Content Security Policy or HSTS (P1-26).
4. No malware scanning of uploads; `scanStatus` stays PENDING (P1-18).
5. Local disk storage only; S3 driver not implemented (P1-12).
6. Backups and restore not configured or rehearsed.
7. Health record encryption key management (`HEALTH_DATA_KEY`) not wired; no health code exists yet (Phase 2).
8. No row-level security in Postgres; scoping is application-level only.
9. No session or device revocation UI; offboarding does not yet invalidate sessions (P1-21).
10. No hold-expiry scheduler; `expireLapsedHolds()` must be called by a cron (P1-17).
11. Signed portfolio URLs last one hour and are embedded in public pages; acceptable for published images only.
12. The enquiry form upserts a `User` by email without verification; a stranger could create an enquiry under someone else's address, but cannot read it without that inbox. Consider confirmation before linking to an existing account.
13. `/login/check-email` shows the magic link in development mode only when no provider is configured; the code path is guarded by `isProduction()` and must stay that way.
14. Auth.js is a beta release; pin and review on upgrade.

## Recommendations before any real client uses the system

- Close gaps 1 to 6 and 9 to 10; configure RLS for `restricted` before Phase 2.
- Separate repository, Preview/Production env separation, Stripe live keys only in Production.
- Pen-test the three areas with the acceptance-test-2 approach (URL and parameter tampering).
- Complete the DPIA, privacy notice and retention schedule.
- Rehearse a database restore and a full export.
