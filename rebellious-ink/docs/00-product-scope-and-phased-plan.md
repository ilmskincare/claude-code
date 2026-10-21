# Rebellious Ink Studio OS — Product scope and phased plan

Version 0.1 · 21 October 2026 · Status: Phase 1 foundation built locally, nothing deployed.

## Mission

A single, secure platform for Rebellious Ink (tattoo and piercing, UK) that takes a client from first enquiry to a confirmed, deposit-backed booking, gives each practitioner a private workspace, and gives the owner a truthful view of the studio's operations and money. No mock-ups, no fake dashboard figures, no pretend integrations.

## The three experiences

| Experience | Route prefix | Who | Today |
|---|---|---|---|
| Client portal | `/` (public) and `/my` | Adults enquiring, agreeing quotes, booking, paying deposits, reading guides | Built (Phase 1) |
| Artist / staff workspace | `/studio` | Resident, chair-rent and guest artists, piercers, apprentices | Built (Phase 1 scope) |
| Owner command centre | `/owner` | Owner, delegated manager, reception (scoped) | Built (Phase 1 scope) |

All three share one database, one role model (`src/lib/rbac.ts`) and one audit log.

## What Phase 1 delivers today, by route

Public
- `/` Branded home page with published artists and the three-step process.
- `/artists`, `/artists/[slug]` Genuine portfolio galleries. Only images with a recorded `PORTFOLIO_PUBLICATION` permission and a `publishedAt` date appear.
- `/enquire` Structured enquiry form: service, artist or "match me", body map zone, placement, size (cm), style, colour, cover-up and scar disclosure, description, budget band, preferred days, access needs, date of birth, 18+ declaration, up to six private reference uploads, separate privacy confirmation. Server-side validation with zod. Under-18 tattoo enquiries are rejected.
- `/enquire/thanks/[reference]` Unique `ENQ-YYYY-NNNNNN` reference, acknowledgement email sent.
- `/guides`, `/guides/[key]`, `/guides/[key]/pdf` Version-controlled client information library (eight seeded guides) as accessible web pages and branded A4 PDFs with SHA-256 header.
- `/privacy` Draft privacy notice flagged for review.
- `/login`, `/login/check-email` Passwordless email sign-in for everyone.

Client portal (`/my`)
- Enquiry list, enquiry detail with private thread, quote card (accept or decline; the client cannot edit the quote), status history.
- `/my/enquiries/[id]/book` Genuinely free slots from the artist's rules, leave, appointments and live holds; 20-minute hold; `RI-YYYY-NNNNNN` reference; Stripe Checkout when configured, bank-transfer instructions otherwise.
- `/my/bookings`, `/my/bookings/[id]` Booking status, deposit status, payments table, relevant guides.
- `/my/documents` Issued PDFs and a list of emails sent.

Artist workspace (`/studio`)
- Today view (own inbox, own upcoming appointments, own verified deposits).
- `/studio/enquiries`, `/studio/enquiries/[id]` Only enquiries assigned to that artist; reply, internal notes, issue quotes.
- `/studio/diary` Own week view. `/studio/earnings` Own payments and arrangement. `/studio/portfolio` Own items with permission status.

Owner command centre (`/owner`)
- Overview computed from verified payments and ledger rows: deposits today, takings this week, deposits held (liability), open enquiries, confirmed / cancelled / no-show counts, artist utilisation, enquiry sources, integration health, recent audit entries.
- `/owner/enquiries` All enquiries; assign artist with a logged reason; approve draft quotes when the policy requires it.
- `/owner/calendar` All-artist week planner. `/owner/bookings/[id]` Reschedule with mandatory reason and notifications, cancel with deposit outcome, verify a manual bank-transfer or cash deposit.
- `/owner/artists` Arrangements with effective dates and the side-by-side chair-rent versus commission calculator.
- `/owner/audit` Searchable audit log. `/owner/settings` Editable business assumptions. `/owner/mailbox` Notification outbox and development outbox.

API
- `/api/auth/[...nextauth]`, `/api/stripe/webhook` (signature-verified, idempotent), `/api/availability`, `/api/files/[key]` (HMAC signed, expiring), `/api/health`.

## Phases 2 to 4

Phase 2 — Safety and client documentation
- Procedure-specific digital consent and suitability questionnaires with versioned templates (`ConsentTemplateVersion`, `ConsentResponse`, `Signature` already in the schema).
- Health answers stored encrypted in the `restricted` schema with need-to-know access and an access log; blocked treatment until consent, ID check and review are complete.
- Per-appointment PDF issue with delivery events, resend, QR links, tablet sign-off.
- Formal legal, clinical and data-protection review (DPIA) before any real client uses it.

Phase 3 — Studio management
- Weekly chair-rent invoicing and arrears, commission entries on the defined eligible base, payouts, settlement statements, refunds via Stripe.
- Artist recruitment pipeline, contract versions and signatures.
- Inventory, lots and expiry, piercing jewellery stock, session consumables, hygiene checklists, incidents.
- Finance dashboard with receivables versus cash basis, CSV export.

Phase 4 — Growth
- Apprentice academy with mentor sign-off, reviews and photo-consent-aware portfolio exports, studio chat, permitted WhatsApp integration, AI assistant with approval workflow, analytics, accounting connectors.

## Not built and not promised (today)

- No deployment anywhere. Local development only.
- No MFA, rate limiting, malware scanning, S3 storage driver, scheduled job for hold expiry or reminders, drag-and-drop planner, portfolio upload UI, invitations UI, data export UI.
- No consent forms, health questionnaires or signatures in use.
- No chair-rent invoices, commission entries, payouts, refunds, inventory, academy, chat, WhatsApp, AI assistant.
- No Stripe Connect; merchant-of-record and payout structure for independent artists are undecided.
- No native App Store app. The site is a mobile-first PWA with a manifest only.
- Document content is seeded as drafts and marked "not approved" until a qualified practitioner approves it.

## Definitions the dashboards use

- Gross client sales: the full amount clients pay for services (and jewellery), before anything is split.
- Studio revenue (studio receipts): what the studio itself earns: chair rent billed, the studio's percentage of eligible sales under commission, retail margin.
- Client deposits held: a liability. A deposit is not income until applied to a completed session or forfeited under the published policy.
- Studio profit: studio revenue less overheads, consumables, fees and taxes. Phase 1 shows a net position only in the illustrative calculator; the dashboard never invents profit.


## Added after staging went live (21 October 2026, afternoon)

- **Artist hours**: weekly pattern, walk-in hours (public, never bookable online), one-off days, time off; owner can edit any artist. `/studio/hours`, `/owner/artists/[id]/hours`.
- **Consultation attachments**: clients and practitioners attach images or PDFs to thread messages; private, signed links.
- **Stock**: products, suppliers, lots with expiry, receiving, adjustments and counts, low-stock and expiring flags; stock issued free under an arrangement with supplies included, or sold to an artist at the artist price with an `ARTIST_RECEIVABLE` ledger entry and a payment-received action. `/owner/stock`, `/owner/artists/[id]/stock`, `/studio/stock`.
- **Apprentice portal**: hours log with mentor verification, 29-skill catalogue across 15 areas with mentor-only sign-off, progression photos with mentor feedback, and the owner's irreversible junior-artist sign-off gated on a configurable verified-hours target and all core skills. `/studio/academy`, `/owner/academy`.

## Added 21 October 2026, late afternoon

- **Rate cards and "Ask the desk"**: every practitioner edits their own card (`/studio/profile`): hourly range, day rate, minimum charge, styles done and not done, things they won't do, placements they won't tattoo, and private notes for reception. The owner or studio manager edits anyone's (`/owner/artists/[id]/profile`). Reception reads them all on one page (`/owner/rates`); the public artist page shows the public parts and never the desk notes.
- **Piercer's price list and jewellery sales**: the piercer's card lists piercings offered and not offered plus a price list (jewellery included or not, duration). Jewellery and aftercare sold to clients are logged at `/studio/sales`; stock comes down from the earliest-expiry lot, the sale posts `Dr CASH/BANK/STRIPE_CLEARING, Cr STOCK_SALES`, and the owner sees all sales at `/owner/stock/sales`.
- **Referral and loyalty**: each client has a code and share link (`/my/rewards`). A new client enters it on the enquiry form; nothing is paid until their first appointment is marked completed, then both sides are credited (defaults £10 each, 5% earn on every completed appointment, £5 minimum redemption; all five values are `loyalty.*` studio settings). Reception applies credit to a booking (`loyalty.redeem`); it is never usable on deposits. Self-referral and referrals of existing clients are ignored.
- **Appointment completion**: the booked artist or the desk records the final price and marks the appointment completed; this is what triggers loyalty and referral rewards and closes the enquiry.
- **Email marketing**: campaigns with `{{name}}` merge, artist-filtered audiences, a test send and an owner-only confirmed send (`/owner/marketing`). Only clients whose latest `MARKETING_EMAIL` preference is granted are ever included; every email carries a signed one-click unsubscribe link, and clients manage the same preference at `/my/preferences`.
- **Social posting**: the owner drafts posts from the content calendar (`/owner/social`) using only portfolio images that carry a `SOCIAL_MEDIA` permission on record, and sends them to Buffer channels (queue or scheduled). Without Buffer credentials the post is kept as a draft with the caption and image to copy by hand.

## Added 21 October 2026, evening

- **Product photos**: every stock item can carry a photo (owner uploads it on the product page; stored privately, served by signed link). Thumbnails show on the owner's stock list, the artist's studio stock view, and as a tap-to-pick photo strip on the piercer's sale form so the right jewellery is chosen.
- **Promotions**: studio-wide offers (`/owner/promotions`) show as an acid-green banner across every public page; artist offers put a corner ribbon on that artist's card on the home page and the artists page, and on their public profile with the offer terms and any code. Artists create and end their own (`/studio/promotions`); the owner or studio manager does either. Every offer has a start, an optional end and an optional "desk only" flag; live ones are listed at the top of Ask the desk.

