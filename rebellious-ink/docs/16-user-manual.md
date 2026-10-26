# Rebellious Ink Studio OS: user manual

Version 1, 26 October 2026. For the owner, the studio manager, the desk, artists, piercers and apprentices. Written against the live site at https://rebelliousink.tattoo. Where a page or button is named, it is named exactly as it appears on screen.

Contents

1. The basics: addresses, signing in, who sees what
2. What clients see: the public website
3. The client's journey, start to finish
4. Enquiry statuses explained
5. The owner command centre, page by page
6. The artist and piercer workspace
7. Apprentices and mentors
8. Money: quotes, deposits, payments, cancellations
9. Oversight: how the owners see everything
10. Daily and weekly routines
11. Problems and fixes
12. Compliance quick reference
13. Changing things and getting help

---

## 1. The basics

### Addresses

| What | Address |
|---|---|
| Live site (clients and staff) | https://rebelliousink.tattoo |
| Staff sign-in | https://rebelliousink.tattoo/login?staff=1 |
| Test site with made-up data (for practising) | https://rebellious-ink-staging.vercel.app (asks for a Vercel login first) |
| Studio email | thedesk@rebelliousink.tattoo, with elleevaa@ and charlie@ for the two of you |

Everything the system sends to clients comes from thedesk@rebelliousink.tattoo, and replies go back to that mailbox.

### Signing in

There are two kinds of sign-in, on two tabs of the login page.

**Clients: email link.** Clients never have a password. They type their email, we send a one-time link, they tap it and they are in. Links expire, so a client who waits too long simply requests another.

**Staff: username.** Everyone on the team has a username and password. The owner or studio manager creates these on the Artists & models page (section 5). The first time someone signs in with the one-time password they are given, the site makes them choose their own password of at least 10 characters. After that the one-time password is dead.

Five wrong passwords in a row lock an account for 15 minutes. An owner can reset anyone's password from the Artists & models page, which gives a fresh one-time password and signs that person out everywhere.

Staff who prefer email links can be set up that way instead, but username and password is the default because it needs no personal email address.

### Who sees what

Access comes from the role chosen in the dropdown on the Artists & models page. In brief:

| Role | Sees |
|---|---|
| Owner | Everything, including settings, money settings, team management, exports and refunds |
| Studio manager | Everything an owner sees except money settings, exports, refunds and team changes |
| Desk (reception) | Enquiries, clients, bookings, stock view, chat |
| Resident, chair-rent and guest artists | Their own enquiries, diary, hours, earnings, portfolio, flash, profile and rates, promotions, retail sales, studio stock, chat |
| Piercer | As an artist, plus the jewellery sale form |
| Apprentice | Their own enquiries and bookings, portfolio, stock view, My training, chat |
| Mentor | Apprentice sign-off, chat |
| Finance adviser | Reports and the ledger, read only |

A job title (for example "Studio manager") can be shown in brackets after someone's name on the team page. It is a label only and does not change access.

### Putting it on a phone like an app

There is nothing to download from an app store. The site installs itself as an icon on the home screen and opens full screen like an app:

- **iPhone or iPad.** Open https://rebelliousink.tattoo/login?staff=1 in Safari (it must be Safari), tap the Share button (the square with an arrow), then "Add to Home Screen", then Add.
- **Android.** Open the same address in Chrome, tap the three dots, then "Add to Home screen" or "Install app", then Install.

The icon is the studio logo. Staff sign in once and stay signed in on that device until they sign out, are reset, or are suspended. Clients can do the same with the main address.

### Phones and tablets

The whole site works on a phone. Staff pages are easiest on a tablet or laptop because of the tables. The games have been tested on iPad Safari.

---

## 2. What clients see: the public website

**Home.** Your headline and copy, the artists, the gumball machine panel, and the three steps.

**Artists.** One card per published artist or piercer, with their styles, their rate card and a promotion ribbon if one is running. Each card opens a profile page with portfolio, healed work, hours and an enquiry button.

**Flash.** The fixed-price catalogue. Clients pick a size from the allowed list (4 to 8 cm) and a flat, easy placement; the price is fixed for those. Anything else goes through the desk as a custom enquiry. A one-off design is held for a short time while the client books it so two people cannot book the same piece.

**Play.** Two free games that lead to a fixed-price booking:

- *Gumball machine.* The client confirms their date of birth (18+ only), turns the crank, and the machine picks one small design from the capsules. One spin per person per day. They can book it at the fixed price with a deposit, or walk away. Nothing is charged to spin and nothing is won. Capsules include classic flash and the stamp set.
- *Three machines.* Spins an ink (black and grey or colour), a style and a subject word. The artist draws the result. One go per person per day, fixed price with a deposit.

Both games switch off automatically if stock falls below the minimum, and both can be switched off under Settings.

**Enquire.** The enquiry form (section 3).

**Guides.** The client information library: preparation guides, aftercare by piercing site, information and policies, and consent forms. Each is branded, versioned, downloadable as a PDF, and marked as a draft until a practitioner approves it (section 5, Documents).

**Privacy.** The privacy notice. It says, among other things, that thread messages are visible to the artist, the desk and the owners.

---

## 3. The client's journey, start to finish

1. **Enquiry.** The client fills in Enquire: service (tattoo, piercing, consultation first, flash design, larger project), style, colour, size, placement, budget band, idea, up to six reference images, their details including date of birth, any access needs, a referral code if they have one, and consent choices. They get an acknowledgement email with a reference like RI-2026-000123.
2. **Assignment.** The enquiry lands on the owner's Enquiries page as New. The desk assigns an artist (or the client may have chosen one). The artist sees it under My enquiries.
3. **Discussion.** The artist and client talk in the private thread on the enquiry. Either side can attach images. Staff can add an internal note the client never sees.
4. **Quote.** The artist sends a quote: basis (fixed price, hourly, day rate or per session), total, deposit, minutes, sessions, scope, and how many days it is valid. If the "Artist quotes need owner approval" setting is on, the owner sees the quote first and presses Approve and send.
5. **Acceptance.** The client signs in through their email link, reads the quote and presses Accept quote and terms. Accepting books nothing yet.
6. **Time and deposit.** The client presses Choose your appointment time, picks a slot from the artist's real availability, and pays the deposit. Card payments are not connected yet, so the site shows bank transfer details and the reference to quote, and the slot is held while they pay (the hold length is a setting).
7. **Verification.** The desk sees the transfer on the bank statement and presses Record verified deposit on the booking, with a note. The booking becomes Confirmed and the client gets a confirmation email with their guides attached as links.
8. **Appointment.** The client reads their preparation guide. In the studio: ID check, consent form, the work. The artist presses Mark completed with the final price; any studio credit is applied there.
9. **Afterwards.** The client gets aftercare, a healed-photo request later, and a rewards credit if the referral programme is on.

Flash and game bookings skip steps 3 to 5: the price is fixed and already accepted, so the client goes straight to choosing a time and paying the deposit.

---

## 4. Enquiry statuses explained

| Status | Meaning | Whose move |
|---|---|---|
| New | Just arrived, nobody assigned | Desk |
| Needs information | Staff have asked the client something | Client |
| In discussion | Artist and client are talking | Artist |
| Quoted | A quote exists but is not yet with the client (awaiting owner approval) | Owner |
| Awaiting acceptance | Quote sent, client has not accepted | Client |
| Awaiting deposit | Quote accepted or fixed price, deposit not yet verified | Client, then desk |
| Confirmed | Deposit verified, appointment in the diary | Everyone |
| Forms pending | Consent forms still to complete (digital forms are a later phase) | Client |
| Checked in, In session | Day of the appointment | Artist |
| Completed | Finished and final price recorded | Nobody |
| Cancelled, Expired, Declined | Closed. Expired means a hold or quote ran out | Nobody |

The full history of status changes, with who made each one, sits under Status history on the enquiry.

---

## 5. The owner command centre, page by page

Sign in as staff and you land on the Owner command centre. The menu runs across the top.

### Overview
Today's appointments, which artists are working this week, where enquiries are coming from, integration status (email, payments, file store) and the most recent audit entries.

### Chat
Staff chat, WhatsApp-style. Three kinds of channel: Studio (everyone on the team), Management (owners and studio managers only) and direct messages between two people. Owners and managers can read every channel and the screen says so. Nothing in chat reaches clients. Keep client details in the enquiry thread, not here. Unread counts show in the menu.

### Reports
Pick a period (today, this week, this month, last month, this year, or your own dates). Twelve reports: enquiries by artist, by source and by service; response times; bookings by artist; payments received and by method; retail and jewellery sales; games; the email marketing list; campaigns sent; stock needing attention. Each has a CSV download, which is recorded in the audit log.

### Enquiries
Every enquiry in the studio, filterable by status and artist. Open one to see the summary (what they asked for, reference images, age confirmation, status history), the thread, the quotes, and the desk tools:

- **Assign artist.** Choose from the dropdown and press Assign. Reassigning later is the same control.
- **Approve and send.** Appears on a quote waiting for approval.
- **Reply** and **Internal note (hidden from client)** on the thread. Up to six images or a PDF per message.
- The **Appointment** link opens the booking once one exists.

Owners and managers can also send a quote themselves from here, using the same form the artist sees.

### Clients
Search by name or email. The table shows contact details, whether they are on the email marketing list, and how many enquiries and bookings they have. Open a client for their full record, including the consent script read to them and their privacy preferences.

### Planner
A week view for everyone or one artist. Shaded blocks are working hours, green is confirmed, amber is awaiting deposit. Previous and next week arrows at the top.

### Ask the desk
The desk's crib sheet: every artist's rate card, what they do and do not tattoo, what is not offered, piercings offered, private desk notes, and the promotions running now. Use it when someone rings or walks in.

### Artists & models
Two things live here.

**Add someone to the team.** Choose how they sign in (username and password, or email link), their name and the name shown to clients, what they are (tattoo artist, junior artist, piercer, apprentice, desk), their arrangement (resident, chair rent, guest spot), their station, their styles, and whether they are published on the public site. An apprentice must be given a supervising artist. The form shows the one-time password once; copy it and give it to them.

**The team table.** For each person: name with job title, how they sign in, their access, their status.

- *Add job title* or *Change job title*: a label in brackets after the name.
- *Give a username and password* or *Reset password*: creates or resets credentials and shows a new one-time password. A reset signs them out everywhere.
- *Access dropdown* and Save: changes their role. You cannot remove your own owner access and the studio always keeps at least one owner.
- *Suspend* and *Reactivate*: suspending signs them out everywhere, blocks sign-in and hides them from the public site.
- *Profile & rates*, *Hours*: edit that person's public profile, rate card and working hours on their behalf.

### Stock
Products with category, brand, SKU, supplier, on hand, reorder level, artist price, photo. Open a product to receive stock into a lot (with expiry and delivery reference), adjust a lot, issue or sell to an artist, and see every movement. Lots are used earliest-expiry first. Artists with consumables included in their arrangement are issued stock free; others buy it at the artist price and owe the studio. Retail sales shows every jewellery and retail sale recorded by piercers and the desk.

### Apprentices
Each apprentice with their supervisor, verified hours, core skills progress and status. "Waiting on you" means hours or photos need verifying. Open an apprentice to verify or reject logged hours, review progression photos, and work through the staged skills (Start, Ready for review, Sign off, Not yet, Renewal due). Signing off as a junior artist needs the minimum verified hours (a setting) and all core skills competent, plus a written statement that is kept permanently.

### Flash
All designs and sheets. Add a design: title, artist, image, theme, colour, collection (Catalogue for the fixed-price wall, Gumball for the machine, plus the special collections), prices, apprentice prices, whether it is repeatable or one-off, and an optional fun line. Sheets group designs on one image for the A4 PDF and the share images. Stamp designs for the gumball should be given the theme "stamp".

### Gumball
The machine's dashboard: capsules available, spins, bookings, conversion, and the list of capsule designs. Add or retire designs under Flash. The machine shows as restocking when available designs drop below the minimum in Settings.

### Promotions
Create a promotion for the whole studio (a banner on every public page) or one artist (a ribbon on their card and page): ribbon text up to 40 characters, public details and terms, an optional code, start and end dates. All promotions are listed below with their status.

### Documents
The client document library with sign-off. Every guide, policy and consent form is listed with a Read link, a PDF link, a count of the "Practitioner to confirm" notes still in its text, and its review date. A document stays marked as a draft on the public page and the PDF until someone presses Approve here and gives their name. Approval can be withdrawn. Both are audited. To change the wording, ask the desk to issue a new version; old versions stay on record.

### Marketing
Email campaigns to clients who have opted in: internal name, subject, body, audience (all opted-in clients or clients of one artist). Send yourself a test first. To send for real you type SEND. Every email carries an unsubscribe link that works without signing in. The marketing list report shows who is opted in.

### Social
A content calendar of posts with caption, image and optional schedule date, for the person who runs the studio's accounts. Posts using the studio brand should be approved by the studio manager (see the artist contracts).

### Audit log
Every significant action: who, what, when, before and after. Read only.

### Settings
Each setting has a plain label. The ones you will touch most:

| Setting | What it does |
|---|---|
| Slot hold while paying (minutes) | How long a chosen slot is held while the client pays the deposit |
| Minimum booking notice (hours), Free reschedule notice (hours) | Booking rules shown to clients |
| Artist quotes need owner approval | On: every artist quote waits for Approve and send |
| Piercing minimum age (public setting) | Shown on the site and enforced on the form |
| Flash: default price, deposit, size options, flat placements, diary minutes | The fixed-price flash rules |
| Gumball: switched on, fixed price, deposit, spins per day, minimum designs | The machine |
| Three machines: switched on, price, deposit, goes per day, ink, style and subject lists | The second game |
| Oversight: blind-copy owners on client emails, email owners every thread message, who gets copies, morning digest, waiting-time and deposit thresholds | Section 9 |
| Default studio commission (%), default weekly chair rent, monthly overheads, VAT registered | Finance defaults |
| Apprentice minimum verified hours for junior sign-off | Apprentices |

### Outbox
Every email the system has sent or tried to send, with its status. If a client says they had no email, look here first.

---

## 6. The artist and piercer workspace

Artists sign in as staff and land on Today.

- **Today.** Your inbox (enquiries waiting on you) and what is next in your diary.
- **Chat.** The Studio channel, direct messages, and Management if you are a manager.
- **My enquiries.** Only the enquiries assigned to you. Open one to read the brief and references, reply in the thread, attach images, add an internal note, and send a quote (basis, total, deposit, minutes, sessions, scope, valid days). Once a booking is confirmed you will see the appointment and can Mark completed with the final price.
- **My diary.** Your bookings by day.
- **My hours.** Your weekly pattern (day, from, to) and what each block is for: bookings and walk-ins, online bookings only, or walk-ins only. Add one-off dates (a flash day, a guest spot) and time off with a private reason. Clients can only book inside these hours.
- **My earnings.** Deposits and balances recorded against your work, and what you owe the studio for stock issued or sold to you.
- **My portfolio.** Upload work with caption, style tags, placement, healed or fresh, and the client's publication permission recorded against each image. Choose a cover image. Only published items appear on the site.
- **My flash.** Your own designs and sheets, same form as the owner's.
- **Profile & rates.** Your display name, public bio, logo or portrait, Instagram, styles you do and do not do, placements you do not tattoo, things you will not do (public), piercings offered, and your rate card: hourly from and to, day rate, minimum charge, fixed items with minutes and price. "Books open" controls whether new enquiries can be sent to you. Notes for the desk are private.
- **My promotions.** A ribbon on your own card and page.
- **Retail sales.** For piercers and anyone selling retail: pick the item from the photo strip, quantity, price, paid by card, cash or bank transfer, optional client details and booking reference. Stock on hand drops by what you sold.
- **Studio stock.** What is in stock and what has been issued or sold to you.
- **My training.** Apprentices only (section 7).

---

## 7. Apprentices and mentors

**Apprentices** use My training:

- *Log hours*: date, hours, what you did, supervised by whom, what kind of work (practice skin, design, supervised client work, other). Hours count once a supervisor verifies them.
- *Add progress photos*: up to ten, with caption and optional link to a skill.
- *Skills*: the staged UK catalogue, from hygiene and sterilisation through to supervised client work. You see each skill's stage and status.

Apprentices can be given slots on flash designs marked apprentice-available, at the apprentice price, always under their supervisor.

**Supervisors and mentors** see the apprentice under Apprentices (owner) or in their own workspace, verify or reject hours, review photos, move skills through Start, Ready for review and Sign off, and write the final statement when the apprentice is ready to be a junior artist.

---

## 8. Money

**Quotes** are issued by the artist (or the desk) and may need owner approval. They expire after the number of days set on the quote.

**Deposits.** Card payments through Stripe are not connected yet. Until they are, the client sees the studio's bank details and a reference to quote, and the chosen slot is held for the hold period. When the money shows on the statement, the desk opens the booking (from the enquiry's Appointment link or the Planner) and presses Record verified deposit with the amount, method, bank reference and a note. That confirms the booking. Holds that are never paid expire automatically each night at 3 am and the slot is released.

**Moving or cancelling.** On the booking: Move and notify (new start time and a reason) or Cancel appointment (reason, and the deposit outcome per policy). The reason is visible in the audit log and in the email the client receives.

**Completion.** The artist presses Mark completed with the final price. Studio credit (referrals, rewards) is applied there with Apply credit.

**Ledger and reports.** Every payment posts to an append-only ledger. The Reports page shows payments received and by method, and the finance adviser role can read the ledger without changing anything.

**Stock money.** Stock issued free under an arrangement costs the artist nothing. Stock sold to an artist creates an amount they owe the studio, shown on My earnings and on the owner's Stock page, and the desk presses Record payment received when they settle. The contract drafts set a seven-day limit on this.

**Commission.** Daily commission settlement, rent invoicing and payout statements are described in the contract drafts but are not yet built in the app. Until they are, the daily statement is done by hand from the Reports page.

---

## 9. Oversight

Owners are kept in the loop without having to look:

- **Blind copies** of client-facing emails (acknowledgements, quotes, booking confirmations, moves and cancellations). Never sign-in links or marketing.
- **Thread copies.** The full text of every thread message, including internal notes, emailed to the owners as it is posted.
- **Morning digest** at 7.30 am: new enquiries, clients who have waited longer than the limit for an artist, deposits unpaid longer than the limit, and today's appointments.
- **Chat** is readable by owners and managers in every channel.
- **Audit log** of every significant action.

Each of the first three can be switched off, and the recipient list changed, under Settings (the oversight settings). By default copies go to every active owner. The privacy notice tells clients that threads are visible to the owners.

---

## 10. Daily and weekly routines

**Desk, each morning**
1. Read the 7.30 digest.
2. Enquiries: assign anything New; chase anything Needs information older than a day.
3. Bank statement: Record verified deposit for any transfers received.
4. Planner: check today's appointments and who is in.
5. Outbox: anything failed.

**Artists, each day**
1. Today: answer anything in your inbox within 24 hours.
2. Send quotes promptly; they expire.
3. Mark completed at the end of each session with the final price.
4. Keep My hours accurate so clients only book when you are in.

**Owner or studio manager, each week**
1. Reports for the week: enquiries, response times, bookings, payments.
2. Apprentices: anything Waiting on you.
3. Stock: the stock needing attention report.
4. Documents: approve anything you have reviewed; keep an eye on review dates.
5. Audit log: skim for anything unexpected.

---

## 11. Problems and fixes

| Symptom | Likely cause and fix |
|---|---|
| Staff member cannot sign in | Wrong tab (use Staff: username), wrong username (check the team table), or locked after five tries (wait 15 minutes or Reset password). Suspended accounts cannot sign in. |
| "Set your password" page appears | Normal on first sign-in or after a reset. Choose at least 10 characters, not containing the username. |
| Client says no sign-in email arrived | Check Outbox for the send. Ask them to check junk and request a new link. Links expire. |
| Gumball or three machines says restocking or is off | Fewer available designs than the minimum in Settings, or the game is switched off in Settings. Add designs under Flash. |
| Client cannot see the quote | It may be waiting for owner approval (status Quoted). Approve and send. |
| Slot the client wanted has gone | It was held by someone else and either paid or will expire within the hold period. |
| Booking stuck at Awaiting deposit | No one has pressed Record verified deposit. Check the bank statement, then the booking. |
| Document shows a draft banner | It has not been approved on the Documents page. |
| Image will not upload | Must be JPEG, PNG, WebP or HEIC (PDF for thread attachments), under 15 MB. |
| Artist not on the public site | Not published (team table says "not on public site"), or suspended. Publish from Profile & rates or the team table. |
| Email campaign will not send | You must type SEND exactly, and there must be opted-in clients in the audience. |

---

## 12. Compliance quick reference

- **Age.** Tattooing anyone under 18 is illegal. The site asks for date of birth on the enquiry form and the games, and photographic ID is checked in the studio at every appointment. Piercing age is a setting; the under-18 policy in the documents only applies once you approve it and change the setting.
- **Consent.** Paper consent forms are in the document library. Digital consent and health forms are a later phase. Health answers are sensitive data: keep paper forms locked away.
- **Documents.** Nothing in the library should be given to a client while it shows the draft banner. Approve on the Documents page once a qualified practitioner has settled the "Practitioner to confirm" notes.
- **Privacy.** The privacy notice is public. Thread oversight by owners is disclosed there. Client marketing needs a recorded opt-in; every campaign email has an unsubscribe link.
- **Games.** Free to play, nothing is won or lost, nothing is charged to spin. They only lead to a fixed-price booking. Keep it that way; charging to play or awarding prizes would make them gambling.
- **Artwork.** Only original or licensed images on the site. The stamp set is the studio's own. Archive flash should be replaced with your own work (see docs/15).
- **Advertising claims.** Avoid medical or clinical claims ("medical-grade"). "Sterile", "single-use" and "licensed" are fine because they are true and checkable.
- **Contracts.** Drafts for each arrangement are in docs/contracts. Have a solicitor review before anyone signs.

---

## 13. Changing things and getting help

Things you can change yourselves: everything under Settings, promotions, flash and gumball designs, team members and access, documents approval, hours, rate cards, stock.

Things that need the desk (the development assistant): new wording on the public pages, new documents or new versions of existing ones, new settings, connecting Stripe, changing the games' rules, anything that is not on a screen.

When something looks wrong, note the page, the time and the reference number, and check the Audit log and Outbox first; between them they explain most things.
