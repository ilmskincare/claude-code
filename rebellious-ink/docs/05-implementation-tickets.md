# Implementation tickets

Status key: DONE (built and tested in this session), PARTIAL, TODO. Priority is the order within each phase.

## Phase 1 — Working foundation

| ID | Title | Status | Scope | Acceptance tests | Depends on |
|---|---|---|---|---|---|
| P1-01 | Schema and migration | DONE | Full Prisma schema, `restricted` schema, exclusion constraints, immutability triggers, reference counters. | `npx prisma migrate deploy` on an empty database succeeds; `tests/integration/booking-race.test.ts` passes. | — |
| P1-02 | Passwordless auth and roles | DONE | Auth.js magic link, database sessions, principal loading, capability model, suspension. | Suspended user cannot sign in; `tests/unit/rbac.test.ts`. | P1-01 |
| P1-03 | Brand system and shells | DONE | Tokens from the logo, Cinzel/Inter, public shell, app shells, accessible components, print styles. | Pages render at phone width without horizontal scroll (manual). | — |
| P1-04 | Public site and portfolios | DONE | Home, artist directory, artist page with permission-gated images. | Only assets with publication permission and `publishedAt` appear. | P1-01 |
| P1-05 | Enquiry form with uploads | DONE | Structured form, zod validation, private uploads, 18+ block, acknowledgement email, ENQ reference. | Acceptance test 1 (E2E); under-18 tattoo rejected. | P1-02, P1-13 |
| P1-06 | Threads and per-artist inbox | DONE | Conversation per enquiry, client-visible and internal messages, notification on new message, scoping. | Acceptance test 2 (`rbac.test.ts` + E2E). | P1-05 |
| P1-07 | Quotes | DONE | Versioned quotes, optional owner approval, client accept/decline, terms snapshot, expiry. | Client cannot alter a quote; accepting moves enquiry to AWAITING_DEPOSIT. | P1-06 |
| P1-08 | Availability and holds | DONE | Slot generation in Europe/London, advisory-locked holds, exclusion backstop, RI reference. | `tests/unit/slots.test.ts`, `booking-race.test.ts` (acceptance test 4). | P1-01 |
| P1-09 | Stripe deposit checkout and webhook | DONE | Checkout Session per appointment, signed idempotent webhook, confirmation email, ledger journal. | `tests/integration/webhook.test.ts` (acceptance test 5). | P1-08 |
| P1-10 | Manual deposit verification | DONE | Finance user records a seen bank transfer or cash; confirms and journals under their name. | Refused without `finance.verify_manual_payment` (`booking-race.test.ts`). | P1-09 |
| P1-11 | Owner command centre | DONE | Overview, enquiries, planner, booking tools, artists and calculator, audit, settings, outbox. | Acceptance tests 3 and 6 (calculator unit tests; reschedule writes audit and notifications). | P1-06..P1-10 |
| P1-12 | S3 storage driver | TODO | Implement `STORAGE_DRIVER=s3` in `src/lib/storage.ts` behind the same interface; signed URLs unchanged. | Upload and fetch round-trip against a bucket; production boots. | — |
| P1-13 | Document library and PDFs | DONE | Eight seeded guides, web view, branded PDF route with SHA-256 header, draft banner until approved. | Acceptance test 9 partially: correct guides listed per booking category; PDF link returns `application/pdf`. | — |
| P1-14 | MFA for privileged roles | TODO | TOTP enrolment for OWNER, STUDIO_MANAGER, FINANCE_ADVISER; `Membership.mfaEnrolled`; step-up on finance actions. | Privileged sign-in without MFA is refused after the enforcement date. | P1-02 |
| P1-15 | Drag-and-drop planner | TODO | Client-side move on `/owner/calendar` that opens the reason dialog and calls `rescheduleAppointment`. | Moving onto a clash is rejected with the existing message; audit row written. | P1-11 |
| P1-16 | Portfolio upload with permission capture | TODO | Artist uploads session photos as `PRIVATE_TREATMENT`; publish requires a recorded `PORTFOLIO_PUBLICATION` permission; owner approval if policy set. | Acceptance test 12. | P1-12 |
| P1-17 | Hold-expiry and reminders scheduler | TODO | Protected cron route calling `expireLapsedHolds()`; reminder emails at 7 days and 48 hours. | Pending appointment past `holdExpiresAt` becomes CANCELLED within five minutes; reminder Notification rows exist. | P1-09 |
| P1-18 | Attachment malware scanning | TODO | Scan uploads (ClamAV or provider API); `scanStatus` moves PENDING→CLEAN/FLAGGED; flagged files are never served. | EICAR test file is quarantined. | P1-12 |
| P1-19 | Rate limiting and abuse prevention | TODO | Per-IP and per-email limits on `/enquire`, `/login`, `/api/availability`; bot checks on the public form. | 20 enquiries in a minute from one IP are throttled. | — |
| P1-20 | Invitations UI | TODO | Owner invites staff with roles; token email; acceptance creates membership; expiry. | Invited artist signs in and lands on `/studio`. | P1-02 |
| P1-21 | Device and session revocation UI | TODO | List sessions and device logs; revoke one or all; offboarding wipes sessions and expires signed URLs. | Revoked session is signed out on next request. | P1-02 |
| P1-22 | Data export | TODO | Owner exports clients, enquiries, bookings, payments, ledger as CSV/JSON; client self-export. | Export contains every row for the chosen range; no health data. | — |
| P1-23 | Leave and availability editing UI | TODO | Artists edit their own rules and leave; owner edits anyone's with audit. | New leave removes slots from `/api/availability`. | P1-08 |
| P1-24 | Waitlist and fill-ins | TODO | Waitlist capture; cancellation offers slot to waitlist. | Cancelled slot triggers notification to first matching waitlist entry. | P1-17 |
| P1-25 | Desk enquiry prefill | TODO | Reception-only variant of `/enquire` with source, phone/walk-in and existing-client lookup. | Desk enquiry records `createdById` and chosen source. | P1-05 |
| P1-26 | Content Security Policy | TODO | Nonce-based CSP, HSTS, frame-ancestors none. | Report-only run shows no violations on all routes. | — |
| P1-27 | Staging deployment | TODO | Vercel + managed Postgres + bucket + Resend + Stripe test. | `/api/health` reports every provider configured; end-to-end test-card booking. | P1-12, P1-17 |
| P1-28 | Playwright in CI | TODO | GitHub Actions job: migrate test DB, seed, run `tests/e2e`, upload screenshots. | Green on the PR. | — |

## Phase 2 — Safety and client documentation (epics)

| ID | Epic | Scope | Acceptance tests |
|---|---|---|---|
| P2-01 | Consent and suitability engine | Form engine over `ConsentTemplateVersion.schema`; per-procedure templates; practitioner review; superseding on material change. | Acceptance tests 10 and 11. |
| P2-02 | Health data isolation | AES-256-GCM encryption with `HEALTH_DATA_KEY`, `restricted` schema RLS, access log, retention job, no health data in notifications/AI/social. | Acceptance test 11. |
| P2-03 | E-signatures and immutable PDFs | Tablet/phone signing, signer association, hash, snapshot PDF, client download. | Acceptance test 10. |
| P2-04 | Age and ID verification | Staff-recorded ID check per appointment; treatment blocked until complete; piercing age policy by jurisdiction. | Acceptance test 8. |
| P2-05 | Document delivery | Issue PDFs per appointment, `DeliveryEvent` audit, resend, QR, inbox, offline pack. | Acceptance test 9. |
| P2-06 | Incident workflow | Restricted incident records with corrective actions. | Incident visible only to owner/manager. |
| P2-07 | Formal review gate | DPIA, legal review of consent text, practitioner approval of guides. | Approval metadata set; draft banners removed. |

## Phase 3 — Studio management (epics)

| ID | Epic | Scope | Acceptance tests |
|---|---|---|---|
| P3-01 | Chair rent billing | Weekly charges from effective-dated models, invoices with VAT where applicable, arrears alerts, part-weeks and holidays. | Acceptance test 6 (rent). |
| P3-02 | Commission and settlement | `CommissionEntry` per completed sale on the defined eligible base; statements; payouts; refunds and tips by policy; historic periods frozen. | Acceptance test 6 (60/40, history unchanged). |
| P3-03 | Refunds and disputes | Stripe refunds with ledger reversals; dispute tracking. | Acceptance test 15 (refunds). |
| P3-04 | Recruitment and contracts | Application pipeline, contract versions, signatures, verification, provisioning, offboarding. | Acceptance test 15 (offboarding). |
| P3-05 | Inventory and jewellery | Products, lots, expiry, movements, session consumables, purchase orders, alerts. | Acceptance test 13. |
| P3-06 | Hygiene and compliance | Checklists, equipment maintenance, licence/insurance renewals. | Checklist completion logged per station per day. |
| P3-07 | Finance dashboard and exports | Cash basis vs receivables, studio vs artist revenue, CSV accounting export. | Acceptance test 7. |

## Phase 4 — Growth (epics)

| ID | Epic | Scope |
|---|---|---|
| P4-01 | Apprentice academy | Modules, assessments, mentor-only sign-off, supervised procedure gating (acceptance test 14). |
| P4-02 | Reviews and marketing | Review requests after completed sessions, moderation, content calendar, honest portfolio exports. |
| P4-03 | Studio chat and WhatsApp | Internal channels, permitted WhatsApp Business messaging with consent, fallback links. |
| P4-04 | AI assistant | Scoped tools, preview and approval via `AIActionApproval`, no health data. |
| P4-05 | Analytics and accounting connectors | Conversion funnels, Xero/QuickBooks adapters. |
