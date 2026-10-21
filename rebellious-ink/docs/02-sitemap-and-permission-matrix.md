# Sitemap and permission matrix

## Sitemap

```
Public (no sign-in)
├── /                         Home: published artists, how it works
├── /artists                  Artist and piercer directory
├── /artists/[slug]           Portfolio (permission-gated images) and enquiry CTA
├── /enquire                  Enquiry form (optionally ?artist=slug)
├── /enquire/thanks/[ref]     Acknowledgement with ENQ reference
├── /guides                   Client information library (current versions)
├── /guides/[key]             Branded web view of a guide
├── /guides/[key]/pdf         Branded A4 PDF
├── /privacy                  Privacy notice (draft)
├── /login                    Passwordless sign-in
├── /login/check-email        "Check your email" (shows dev link when no provider)
├── /after-login              Routes to /owner, /studio or /my by role
└── /suspended                Suspended-account notice

Client portal (/my — any signed-in user, scoped to own records)
├── /my                       My enquiries
├── /my/enquiries/[id]        Enquiry detail, thread, quote accept/decline
├── /my/enquiries/[id]/book   Slot picker → hold → pending appointment → deposit
├── /my/bookings              My bookings
├── /my/bookings/[id]         Booking detail, deposit status, payments, guides
├── /my/bookings/[id]/pay     POST → Stripe Checkout (when configured)
└── /my/documents             Issued PDFs and sent emails

Artist workspace (/studio — needs an ArtistProfile or enquiries.view_all)
├── /studio                   Today: own inbox, next appointments, own deposits
├── /studio/enquiries         Own assigned enquiries
├── /studio/enquiries/[id]    Detail, thread with internal notes, issue quote
├── /studio/diary             Own week view
├── /studio/earnings          Own payments and arrangement
└── /studio/portfolio         Own portfolio items with permission status

Owner command centre (/owner — needs enquiries.view_all; pages check finer capabilities)
├── /owner                    Overview
├── /owner/enquiries          All enquiries (?all=1 includes closed)
├── /owner/enquiries/[id]     Detail, assign artist, approve draft quote, thread, quote
├── /owner/calendar           All-artist planner (?week=, ?artist=)
├── /owner/bookings/[id]      Reschedule, cancel, verify manual deposit, ledger, audit
├── /owner/artists            Arrangements and side-by-side calculator
├── /owner/audit              Audit log (audit.view)
├── /owner/settings           Business assumptions (settings.manage)
└── /owner/mailbox            Notification outbox (studio.manage)

API
├── /api/auth/[...nextauth]   Auth.js handlers
├── /api/stripe/webhook       POST, signature verified, idempotent
├── /api/availability         GET slots for an accepted quote (scoped)
├── /api/files/[key]          GET private object with HMAC signature and expiry
└── /api/health               GET database, email, payments, storage status
```

## Capabilities

Defined in `src/lib/rbac.ts`:

`studio.manage`, `settings.manage`, `roster.manage`, `enquiries.view_all`, `enquiries.view_assigned`, `enquiries.create_desk`, `enquiries.assign`, `quotes.issue`, `quotes.approve`, `bookings.view_all`, `bookings.view_own`, `bookings.override`, `bookings.cancel`, `finance.view_studio`, `finance.view_own`, `finance.verify_manual_payment`, `finance.refund`, `finance.export`, `clients.view_assigned`, `clients.view_all`, `health.view_need_to_know`, `portfolio.manage_own`, `portfolio.publish`, `stock.view`, `stock.manage`, `documents.manage`, `audit.view`, `staff.chat`, `academy.learn`, `academy.signoff`, `ai.use`, `loyalty.redeem`.

## Role defaults

| Capability | OWNER | STUDIO_MANAGER | RECEPTION | RESIDENT / CHAIR_RENT ARTIST | GUEST_ARTIST | PIERCER | APPRENTICE | MENTOR | CLIENT | FINANCE_ADVISER | AI_ASSISTANT |
|---|---|---|---|---|---|---|---|---|---|---|---|
| studio.manage | ✓ | | | | | | | | | | |
| settings.manage | ✓ | | | | | | | | | | |
| roster.manage | ✓ | ✓ | | | | | | | | | |
| enquiries.view_all | ✓ | ✓ | ✓ | | | | | | | | |
| enquiries.view_assigned | ✓ | | | ✓ | ✓ | ✓ | ✓ | | | | |
| enquiries.create_desk | ✓ | ✓ | ✓ | | | | | | | | |
| enquiries.assign | ✓ | ✓ | ✓ | | | | | | | | |
| quotes.issue | ✓ | | | ✓ | ✓ | ✓ | | | | | |
| quotes.approve | ✓ | ✓ | | | | | | | | | |
| bookings.view_all | ✓ | ✓ | ✓ | | | | | | | | |
| bookings.view_own | ✓ | | | ✓ | ✓ | ✓ | ✓ | | | | |
| bookings.override | ✓ | ✓ | | | | | | | | | |
| bookings.cancel | ✓ | ✓ | | | | | | | | | |
| finance.view_studio | ✓ | ✓ | | | | | | | | ✓ | |
| finance.view_own | ✓ | | | ✓ | ✓ | ✓ | | | | | |
| finance.verify_manual_payment | ✓ | ✓ | | | | | | | | | |
| finance.refund | ✓ | | | | | | | | | | |
| finance.export | ✓ | | | | | | | | | ✓ | |
| clients.view_assigned | ✓ | | | ✓ | ✓ | ✓ | | | | | |
| clients.view_all | ✓ | ✓ | ✓ | | | | | | | | |
| health.view_need_to_know | ✓ | | | ✓ | ✓ | ✓ | | | | | |
| portfolio.manage_own | ✓ | | | ✓ | ✓ | ✓ | ✓ | | | | |
| portfolio.publish | ✓ | ✓ | | | | | | | | | |
| stock.view | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | | | | |
| stock.manage | ✓ | ✓ | | | | | | | | | |
| documents.manage | ✓ | ✓ | | | | | | | | | |
| audit.view | ✓ | ✓ | | | | | | | | | |
| staff.chat | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| academy.learn | ✓ | | | | | | ✓ | | | | |
| academy.signoff | ✓ | | | | | | | ✓ | | | |
| ai.use | ✓ | ✓ | | ✓ | | | | | | | ✓ |
| loyalty.redeem | ✓ | ✓ | ✓ | | | | | | | | |

Notes
- OWNER holds every capability. CLIENT holds none; clients are scoped purely by record ownership.
- A membership may carry per-capability overrides (`Membership.capabilities` JSON, e.g. `{"finance.verify_manual_payment": true}`), applied after role defaults. Custom roles (`CustomRole`) exist in the schema but have no UI yet.
- Suspended users or memberships lose every capability (`can()` returns false).
- `MENTOR` is additive to a practitioner role; `health.view_need_to_know` only gates Phase 2 health access, which is not yet built.

## Record-level scoping (enforced in services)

| Rule | Where |
|---|---|
| An enquiry is visible if the principal has `enquiries.view_all`, or has `enquiries.view_assigned` and the enquiry's `artistId` equals their `artistProfileId`, or is the enquiry's client. Otherwise 404, never 403, so existence is not leaked. | `canAccessRequest`, `loadRequestFor` in `src/lib/enquiries.ts` |
| Clients never see `INTERNAL_ONLY` messages or `DRAFT` quotes; clients cannot post internal notes. | `loadRequestFor`, `postMessage` |
| Quotes may be issued by the assigned artist (`quotes.issue`) or anyone with `quotes.approve`; artists need an assigned enquiry. | `issueQuote` in `src/lib/quotes.ts` |
| Only the enquiry's client can accept or decline a quote, and only while it is `SENT` and unexpired. | `respondToQuote` |
| Holds and bookings are created only for the requesting client's own `AWAITING_DEPOSIT` enquiry. | `createHold` in `src/lib/booking.ts` |
| Availability is returned only for an enquiry the caller may access. | `/api/availability` |
| A booking page is visible to its client, its artist, or `bookings.view_all`. | `/my/bookings/[id]` |
| Artist dashboards, diaries, earnings and portfolio query by the principal's own `artistProfileId`. | `/studio/*`, `artistDashboard` |
| Manual deposit verification needs `finance.verify_manual_payment` and records `verifiedById`. | `verifyManualDeposit` in `src/lib/owner.ts` |
| Desk client capture needs `enquiries.create_desk`; the client list needs `clients.view_all`; marketing answers are versioned preferences with the recording staff member in `source`. | `upsertClientAtDesk`, `clientList` in `src/lib/clients.ts` |
| A gumball play is readable only by the browser (visitor cookie) or account that made it; booking it needs a signed-in client and the play's own design; gumball designs are never bookable through the catalogue. | `playFor`, `bookFromPlay` in `src/lib/gumball.ts`, `designById` |
| A three-machines play is readable only by its browser or account; booking it needs a signed-in client, a published artist from the list and a flat placement; the brief is priced from the stored result, never from the form. | `trioPlayFor`, `bookFromTrio` in `src/lib/trio.ts` |
| Adding team members needs `roster.manage` (owner, studio manager): creates the user, an ACTIVE membership with exactly one role, a client profile and, for practitioners, a profile with a unique public slug; apprentices must name a non-apprentice supervisor and do not take enquiries; an email that already has a profile is refused. | `addTeamMember` in `src/lib/team.ts` |
| A flash design or sheet is created, edited or retired by its own artist or `roster.manage`; bulk price changes need `roster.manage`; only `AVAILABLE`/`HELD` designs of published artists are public. | `assertCanManageDesigns`, `catalogue` in `src/lib/flash.ts` |
| Booking a design needs a signed-in client who declares 18+, a fixed-price placement, and an offered tier; one-off designs are claimed under `SELECT ... FOR UPDATE`. | `bookDesign`, `holdDesignForRequest` |
| Apprentice slots are the intersection of the apprentice's and the supervisor's availability. | `filterBySupervisor` in `src/lib/booking.ts` |
| A promotion is created or ended by its own artist or `roster.manage`; studio-wide ones need `roster.manage`; public pages only ever show live, public ones. | `savePromotion`, `endPromotion`, `livePromotions` in `src/lib/promotions.ts` |
| A product photo is set or removed by `stock.manage` only and must be an image. | `upsertProduct` in `src/lib/inventory.ts` |
| A rate card is edited by its own practitioner or `roster.manage`; the desk reference needs `enquiries.view_all`; desk notes never render publicly. | `assertCanEditProfile` in `src/lib/profiles.ts`, `/owner/rates` |
| A retail sale is recorded by the practitioner on their own book or by `stock.manage`. | `recordRetailSale` in `src/lib/retail.ts` |
| Completion is by the booked artist or `bookings.override`; credit redemption by `loyalty.redeem` or `bookings.override`, never above the balance or below the minimum. | `completeAppointment`, `redeemCredit` in `src/lib/loyalty.ts` |
| Campaigns send only to the latest granted `MARKETING_EMAIL` preference; sending needs `studio.manage`; unsubscribe links are HMAC-signed. | `marketingAudience`, `sendCampaign` in `src/lib/marketing.ts` |
| Social posts may only use `PORTFOLIO_PUBLIC` images with a granted `SOCIAL_MEDIA` permission; drafting and publishing need `portfolio.publish`. | `savePost`, `publishPost` in `src/lib/social.ts` |
| Reschedule and cancel need `bookings.override` / `bookings.cancel`, a reason, and write audit and notifications. | `rescheduleAppointment`, `cancelAppointment` |

## How enforcement works

1. `src/proxy.ts` redirects visitors without a session cookie away from `/my`, `/studio`, `/owner`. This is optimistic only; it is not authorisation.
2. `src/lib/session.ts` loads the principal once per request (`getPrincipal`): user, active membership, roles, overrides, artist profile, suspension, access expiry. `requirePrincipal` and `requireCapability` redirect or throw `ForbiddenError`.
3. Layouts gate areas (`/owner` requires `enquiries.view_all`; `/studio` requires an artist profile or `enquiries.view_all`). Pages check finer capabilities.
4. Every server action calls `requirePrincipal()` and passes the principal into a domain service; the service applies the record-level rules above. The UI never decides access.
5. Every mutating service writes an `AuditLog` row with actor, action, entity, before/after and reason.
6. Database backstops: exclusion constraints for overlaps, immutability triggers for ledger, signatures, generated PDFs and health access logs, and per-artist advisory locks during hold creation.
