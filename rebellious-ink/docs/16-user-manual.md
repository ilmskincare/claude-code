# Rebellious Ink Studio OS: user manual

Version 2, 26 October 2026. For the owner, the studio manager, the desk, artists, piercers and apprentices. Written against the live site at https://rebelliousink.tattoo. Where a page or button is named, it is named exactly as it appears on screen.

How to read this manual. Sections 1 to 13 explain how the studio runs day to day, with every rule and automation that applies written in beside the screen it belongs to. Sections 14 to 20 are reference tables: every email, every scheduled job, every setting, every permission, what data is kept, every report and a glossary. Everything here was checked against the system's own code. Where it says "not built yet", the screen or automation does not exist today, even if an earlier plan promised it. All times are UK time (Europe/London) and all money is in pounds sterling.

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
14. Every email the system sends
15. Automatic jobs and integrations
16. Settings reference
17. Roles and permissions reference
18. Data the system keeps and for how long
19. Reports reference
20. Glossary

---

## 1. The basics

### Addresses

| What | Address |
|---|---|
| Live site (clients and staff) | https://rebelliousink.tattoo |
| Staff sign-in | https://rebelliousink.tattoo/login?staff=1 |
| Test site with made-up data (for practising) | https://rebellious-ink-staging.vercel.app (asks for a Vercel login first) |
| Studio email | thedesk@rebelliousink.tattoo, with elleevaa@ and charlie@ for the two of you |

Everything the system sends to clients comes from thedesk@rebelliousink.tattoo, and replies go back to that mailbox. A full list of what is sent, and when, is in section 14.

### Signing in

There are two kinds of sign-in, on two tabs of the login page.

**Clients: email link.** Clients never have a password. They type their email, we send a one-time link, they tap it and they are in. The link lasts 24 hours, so a client who waits longer simply requests another. Once in, that browser stays signed in for 14 days. If a link is invalid or expired the login page says so and offers a new one. A suspended account is told it is suspended.

**Staff: username.** Everyone on the team can have a username and password. The owner or studio manager creates these on the Artists & models page (section 5). The first time someone signs in with the one-time password they are given, the site makes them choose their own password. After that the one-time password is dead.

The rules, in full:

- A username is 3 to 30 characters: lower-case letters, numbers, dots, dashes or underscores, starting with a letter or number. If you leave it blank the system makes one from the person's name.
- A one-time password looks like three short words and a two-digit number, for example "rose-moth-key-47". It is shown once on screen and is never stored in readable form (only a scrambled version is kept), so write it down or read it out straight away.
- A password the person chooses must be at least 10 characters, not longer than 200, not a single repeated character, must not contain their username, and must not contain a handful of obvious words (the studio name, "password12", "1234567890", "qwertyuiop").
- Five wrong passwords in a row lock the account for 15 minutes. A correct sign-in clears the count. Each wrong attempt and each lock is written to the Audit log. The sign-in page never says whether the username or the password was wrong.
- An owner or studio manager can reset anyone's password from the Artists & models page, which gives a fresh one-time password, clears any lock and signs that person out everywhere.
- A staff browser stays signed in for 14 days, or until the person signs out, is reset, has their access changed or is suspended.
- Anyone can change their own password at any time from the password page (they must type the current one first, except on the very first sign-in).
- Staff who prefer email links can be set up that way instead, but username and password is the default because it needs no personal email address. A person added with only a username has a made-up "placeholder" address ending in staff.invalid. The system never emails a placeholder address, so that person gets no notification emails at all (see section 14 and the glossary). Give them a real email address in the add form if they should get messages.

### Who sees what

Access comes from the role chosen in the dropdown on the Artists & models page. Each person has exactly one role. In brief:

| Role | Sees |
|---|---|
| Owner | Everything, including Settings, the Outbox, Marketing, junior-artist sign-off, team management, refunds and exports |
| Studio manager | The owner area except Settings, the Outbox, Marketing and the Apprentices page. Can manage the team (including passwords and access), flash, promotions, stock, documents, social posts, reports with CSV downloads and the Audit log; can issue and approve quotes, record verified deposits, move and cancel bookings |
| Desk (reception) | Overview, all enquiries (assign artists, log a desk enquiry, reply), clients and marketing-consent capture, bookings (view), Planner, Ask the desk, stock (view only), apply studio credit, chat. Cannot record deposits, move or cancel bookings, or open Reports |
| Resident, chair-rent and guest artists | Their own enquiries, diary, hours, earnings, portfolio, flash, profile and rates, promotions, retail sales, studio stock, chat |
| Piercer | As an artist. Retail sales is on every practitioner's menu, and only jewellery and aftercare products can be sold |
| Apprentice | Their own enquiries and bookings, portfolio, stock view, My training, chat |
| Mentor | Meant for apprentice sign-off and chat. At present the Apprentices page sits inside the owner area, which only opens for people who can see all enquiries, so a person with only this role cannot reach it (see section 17) |
| Finance adviser | Meant for reports and the ledger, read only. At present no menu item opens for this role (the Reports page sits inside the owner area), so check with the desk before relying on it (see section 17) |

A job title (for example "Studio manager") can be shown in brackets after someone's name on the team page. It is a label only, up to 40 characters, and does not change access.

Changing someone's access signs them out everywhere; the new access applies the next time they sign in. You cannot remove your own owner access, you cannot suspend yourself, and the studio always keeps at least one active owner. Because team changes are open to the studio manager as well as owners, a studio manager can give any team member, including themselves, owner access. Treat that role accordingly. The full permission table is in section 17.

### Putting it on a phone like an app

There is nothing to download from an app store. The site installs itself as an icon on the home screen and opens full screen like an app:

- **iPhone or iPad.** Open https://rebelliousink.tattoo/login?staff=1 in Safari (it must be Safari), tap the Share button (the square with an arrow), then "Add to Home Screen", then Add.
- **Android.** Open the same address in Chrome, tap the three dots, then "Add to Home screen" or "Install app", then Install.

The icon is the studio logo. Staff sign in once and stay signed in on that device until they sign out, are reset, or are suspended. Clients can do the same with the main address.

### Phones and tablets

The whole site works on a phone. Staff pages are easiest on a tablet or laptop because of the tables. The games have been tested on iPad Safari.

---

## 2. What clients see: the public website

**Home.** Your headline and copy, the artists (a card each, with the cover photo if one is published), the gumball machine panel, and the three steps. If a studio-wide promotion is live, a banner shows at the top of every public page. The wording of the headline and steps is part of the site itself, so changing it is a job for the desk (section 13).

**Artists.** One card per published artist or piercer, with their picture or logo, bio, styles, a "Taking enquiries" or "Books closed" badge, up to three published photos and a promotion ribbon if one is running. Each card opens a profile page with the portfolio (marked Healed or Fresh), the rate card (hourly range, day rate, minimum charge, "guide only; every piece is quoted individually"), what they do not do, piercings offered, the price list, the weekly hours with walk-in times marked, and an enquiry button.

What decides whether someone appears and can be enquired about:

- **Published.** A person only appears if their profile is published. This is chosen once, with a tick box when they are added to the team. There is no on-screen switch to publish a profile later, and suspending someone unpublishes them; reactivating does not publish them again (see section 11).
- **Books open.** The "Books open (accepting new enquiries)" tick on Profile & rates. When it is off the artist shows "Books closed", the enquiry button is replaced by "Books currently closed", they cannot be chosen in the enquiry form (a form that names them is refused with "That artist is not currently taking enquiries."), and they are left out of the Three machines artist list. Enquiries already open stay open. Apprentices are added with Books open switched off.
- **Photos.** Only photos with a publication date appear. Uploading new portfolio photos is not built yet, so photos are added for you by the desk, each with the client's publication permission recorded against it.

**Flash.** The fixed-price catalogue, filtered by theme, artist, price range, apprentice pieces, one-offs and colour, with a Designs view and a Sheets view (a whole sheet with numbered designs). The rules:

- One price for every size. The default is £60 for any size from the allowed list (4, 5, 6, 7 or 8 cm; the last is the maximum), on a flat, easy placement from the allowed list (outer upper arm, outer forearm, inner forearm, top of shoulder, outer thigh, calf). A design can carry its own price instead of the default.
- Supervised apprentice pieces are cheaper (default £40) and are only offered on designs marked apprentice-available, for an apprentice who is published, has Books open and is supervised by the artist who owns the design (see section 3 for the diary rule).
- The deposit comes off the total; nothing is added later. Default deposits: £20 for the artist tier and £15 for the apprentice tier (never more than the total).
- Each flash tattoo takes 60 minutes in the diary plus set-up and clean-down time, and every flash tattoo includes one free touch-up (printed on the sheets).
- "Somewhere else (custom price)" replaces the Book button with a link to the enquiry form, pre-filled with the design, so the desk can price it in the thread. Anything bigger than the largest size also goes this way.
- A second, larger "palm" size exists in the data but is switched off, so it never shows.
- Booking needs a signed-in client who ticks the 18+ box. Signed-out visitors are sent to sign in and come straight back. Booking creates an enquiry that is already quoted and accepted at the fixed price, so the client goes straight to choosing a time and paying the deposit (section 3).
- **One-off designs.** A repeatable design can be booked by anyone, any number of times. A one-off is held for the client from the moment they press Book: 15 minutes to choose a slot, which extends to 35 minutes (15 plus the 20-minute slot hold) once a slot is chosen. If they do not pay, it goes back on the wall by itself (checked whenever a flash page loads and every night). Once the deposit is recorded it is Booked for good. If someone else is mid-booking the next person sees "Someone else is booking this one-off design right now".

**Play.** Two free games that lead to a fixed-price booking. Both ask for a date of birth first and both are free to play, award nothing and charge nothing.

*Gumball machine*

- **Age check.** The visitor enters their date of birth; under 18 is refused with a message about UK law. A pass is remembered in that browser for a year (a small cookie that says "adult"; the date itself is not kept in the cookie). The date of birth is used once. It is only saved if the visitor is signed in and has no date of birth on file already.
- **One spin per person per day** (the studio's "day" starts at midnight UK time). The count is by browser or, if signed in, by account, so signing in elsewhere does not give a second spin.
- **How the machine picks.** The server picks one design completely at random from the available designs in the Gumball collection belonging to published artists. The browser only plays the animation of a result that has already been chosen and saved. A repeatable design stays in the machine for the next person; a one-off is held for the spinner for 15 minutes, then returns if not booked.
- **Restocking.** If fewer than 5 designs are available the machine shows as restocking and will not spin; the visitor can leave an email address to be told when it is full again. Only the owner can send those alerts, and only when stock is back above the minimum (section 5, Gumball). The machine also switches off completely if the setting is turned off.
- **Price.** £30 total, £10 deposit by default, shown before the spin. "Keep it" needs a signed-in client, a tick confirming 18+ and a placement from the flat-area list. Hands, fingers, neck and face are not available. Up to 8 cm, 60 minutes in the diary. Each spin can be booked once.
- **Share card.** A story-sized picture ("Get what you get", the design and artist, no price) that only the person who spun can open.
- **What is recorded.** Each spin is saved as a "play" (game, the anonymous visitor ID or the account, the design, the price and deposit that were shown, and whether it was booked) and counted in the first-party event counts (section 15). It never records winnings or losses, never charges to play and never hands over a prize. The only money in the whole journey is the normal booking deposit.

*Three machines*

- Three reels in one go: an ink (black and grey or colour), a style (traditional, fine line, blackwork and so on) and a subject (spider, angel, dagger and so on). The lists are editable under Settings (section 16).
- £40 total, £10 deposit and one go per person per day by default. The client picks which published tattoo or junior artist draws and tattoos it (artists with Books open only), then a placement from the flat-area list. The artist draws a simple flash design from the brief and tattoos it small, up to 8 cm, 60 minutes.
- Every reel is picked on the server and stored with the price shown at the time. It has no stock, so it never shows "restocking"; it only switches off if turned off in Settings. (An earlier version of this manual said both games switch off below a minimum stock; only the gumball machine does.)

**Enquire.** The enquiry form (section 3).

**Guides.** The client information library: 23 documents. Three preparation guides, six aftercare guides (tattoo, four piercing sites, healed work and touch-ups), eleven information and policy sheets, and three consent forms (tattoo, piercing, and parental consent for piercing under 18). Each is branded, shows its version (all are version 1, issued 21 October 2026, review due 21 April 2027), downloads as a PDF, and is marked as a draft until a practitioner approves it (section 5, Documents). The words "Practitioner to confirm" in a highlighted box mark questions the drafter could not settle.

**Privacy.** The privacy notice. It says, among other things, that thread messages are visible to the artist, the desk and the owners, that health answers are kept separately and that enquiries which do not proceed are deleted after 12 months. The page still carries a yellow "Draft: requires owner and data-protection review before go-live" badge in its own wording. That badge stays until the desk changes the page after your review. See section 18 for what the system actually deletes.

---

## 3. The client's journey, start to finish

1. **Enquiry.** The client fills in Enquire: service (tattoo, piercing, consultation first, flash design, larger project), style, colour, size, placement, budget band, idea, up to six reference images, their details including date of birth, any access needs, a referral code if they have one, and consent choices. They get an acknowledgement email with a reference like ENQ-2026-000123 (enquiry references start ENQ; booking references start RI, see below).
2. **Assignment.** The enquiry lands on the owner's Enquiries page as New. The desk assigns an artist (or the client may have chosen one). The artist sees it under My enquiries. The artist is not emailed when an enquiry is assigned to them, so tell them or have them check Today.
3. **Discussion.** The artist and client talk in the private thread on the enquiry. Either side can attach images. Staff can add an internal note the client never sees. The first staff reply on a New enquiry moves it to In discussion by itself. When one side posts a client-visible message the other side gets a short "new message" email with a sign-in link (no message text in it).
4. **Quote.** The artist sends a quote: basis (fixed price, hourly, day rate or per session), total, deposit, minutes, sessions, scope, and how many days it is valid. If the "Artist quotes need owner approval" setting is on, the owner sees the quote first and presses Approve and send (the client is not emailed when a draft is approved, so tell them, or post in the thread).
5. **Acceptance.** The client signs in through their email link, reads the quote and presses Accept quote and terms. Accepting books nothing yet.
6. **Time and deposit.** The client presses Choose your appointment time and pay the deposit, picks a slot from the artist's real availability, and presses Hold slot and pay deposit. Card payments are not connected yet, so the site shows the booking reference to quote and says the studio confirms once it has seen the money, and the slot is held for 20 minutes while they pay. The page does not show an account number or sort code, so give the client your bank details by message or email.
7. **Verification.** The owner or studio manager sees the transfer on the bank statement and presses Record verified deposit on the booking, with a note. The booking becomes Confirmed. For a bank transfer the system does not send a confirmation email by itself (only a card payment does), so message the client to say it is confirmed. The client's booking page shows Confirmed and lists the guides that apply to their procedure.
8. **Appointment.** The client reads their preparation guide. In the studio: ID check, consent form, the work (these happen on paper and in person; the system does not record the ID check or consent forms yet). The artist presses Mark completed with the final price; the owner or studio manager can do this too. Any studio credit must be applied before this (section 8).
9. **Afterwards.** Completing the booking adds the client's rewards credit (and pays out a referral, if the programme is on). Aftercare and healed-photo guides are in the library and on the client's booking page. The system does not send aftercare reminders, appointment reminders or a healed-photo request by itself; those are not built yet.

Flash and game bookings skip steps 3 to 5: the price is fixed and already accepted, so the client goes straight to choosing a time and paying the deposit.

### Reference numbers

Enquiries get a reference like ENQ-2026-000123. A booking (appointment) gets its own like RI-2026-000123 when the client holds a slot. Numbers run on from 1 each calendar year, six digits, never reused. Quote the RI reference on bank transfers.

### Age checks

- Tattoo, flash and larger-project enquiries must tick "I confirm I am 18 or over". If a date of birth is given and it shows under 18, the enquiry is refused: "Tattooing anyone under 18 is prohibited by law in the UK." Nothing overrides this, there is no setting for it, and parental consent is not accepted.
- Date of birth is optional on the enquiry form, so the 18+ tick is the minimum check. The site asks for the date at the games and photographic ID is checked in the studio at every appointment.
- Piercing enquiries must also tick the 18+ box. There is no under-18 piercing route in the system yet: the "Piercing minimum age" setting is stored but nothing reads it.
- The check is repeated when a slot is held: a tattoo booking for someone who never declared 18+ is refused.

### How available times are worked out

When the client opens the time picker, the system builds the list from the artist's hours:

- It starts from the artist's weekly pattern and one-off dates on My hours. Only blocks marked "Online bookings" or "Bookings + walk-ins" count; "Walk-ins only" blocks never offer online times.
- A start time is offered every 30 minutes within a block, as long as the whole appointment fits before the block ends. The length of the appointment is the quote's minutes plus 15 minutes of set-up and 15 minutes of clean-down (the standard buffer), so a 120-minute quote blocks 150 minutes.
- Nothing is offered less than 24 hours from now (a fixed rule; the "Minimum booking notice" setting is stored but nothing reads it), and the picker shows the next six weeks.
- Times are removed if they overlap time off (leave), a confirmed, checked-in or in-session appointment, a pending appointment whose 20-minute hold is still running, or someone else's current slot hold.
- Clock changes (BST and GMT) never move a 10:00 appointment, because all the arithmetic is done in UK time.
- **The apprentice slot rule.** An apprentice can only be booked when their supervising artist is also in the studio: the whole appointment must sit inside one of the supervisor's working blocks (any block, including walk-ins) and outside the supervisor's time off. It is not checked against the supervisor's own bookings.
- Two safety nets sit behind all this in the database: two active appointments can never overlap for the same artist, and never for the same station, even with different artists. If two clients race for the same time the second is told "That time has just been taken. Please choose another slot."
- If no times are free the client is told to message the artist. A waiting list is not built yet.
- Only one appointment is booked per quote. If the quote says several sessions, later sessions are arranged in the thread.

### Holds and what happens when time runs out

- A chosen slot is held for **20 minutes** (a fixed rule; the "Slot hold while paying" setting is stored but nothing reads it). During that time the appointment shows as Awaiting deposit and blocks the diary.
- When the 20 minutes pass the slot is free for others straight away, even though the booking still reads Awaiting deposit. The booking itself is cancelled ("Deposit not received before hold expiry", recorded in the Audit log as System: hold expiry) the next time anyone books that artist, or by the nightly clean-up at 03:00 UTC (4 am in summer time). A one-off flash design held for that booking also goes back on the wall.
- The enquiry itself stays at Awaiting deposit, so the client can pick a new time and try again. Nobody is emailed when a hold lapses.
- Bank transfers often take longer than 20 minutes. If you record the deposit before the booking has been cleaned up, it still confirms. After it has been cancelled the Record verified deposit box is gone and the client has to choose a new time.

### What happens when the appointment is completed

On Mark completed (final price entered in pounds, before any studio credit; it can be £0 but not negative):

- The booking becomes Completed and its enquiry becomes Completed (this is the only way an enquiry reaches Completed).
- If the rewards programme is on, the client earns 5% of the final price, rounded down to the penny, as studio credit.
- If the client came with a referral code and this is their first completed appointment, both sides are credited and the friend who referred them gets an email (section 8).
- A line is added to the Audit log with the final price and any rewards.
- Only a Confirmed, Checked-in or In-session booking can be completed, and only once. Who can: the booked artist, or the owner or studio manager.

### Flash and game bookings

A flash booking, a gumball "Keep it" and a three-machines "Keep it" all create an enquiry with a quote already accepted at the fixed price and the booking terms attached. From there it is the same as steps 6 to 9. The booking terms the client accepts are version "booking-terms-v1": the deposit secures the appointment and is deducted from the final price; it is non-refundable if the client cancels with under 48 hours' notice or does not attend; one free reschedule with at least 48 hours' notice; 18+ with photographic ID; tell us about health concerns beforehand. The 48 hours in that text is fixed wording, not tied to a setting.

---

## 4. Enquiry statuses explained

| Status | Meaning | Whose move | How it gets set today |
|---|---|---|---|
| New | Just arrived, nobody assigned | Desk | Automatic when the enquiry is submitted |
| Needs information | Staff have asked the client something | Client | The rules allow it, but no button sets it yet. Use the thread instead |
| In discussion | Artist and client are talking | Artist | Automatic on the first staff reply to a New enquiry, and when a client declines a quote |
| Quoted | A quote has been issued | Owner | A passing step. It appears in the status history but the enquiry moves straight on to Awaiting acceptance. A quote waiting for owner approval does not change the status; look for "Draft quote awaits your approval" in Owner tools |
| Awaiting acceptance | Quote sent, client has not accepted | Client | Automatic when a quote is sent or approved |
| Awaiting deposit | Quote accepted or fixed price, deposit not yet verified | Client, then owner or studio manager | Automatic when the client accepts, or when a flash or game booking begins. It stays at this status even if the 20-minute hold lapses |
| Confirmed | Deposit verified, appointment in the diary | Everyone | Automatic when a card payment arrives or someone presses Record verified deposit |
| Forms pending | Consent forms still to complete (digital forms are a later phase) | Client | Not built yet; no screen sets it |
| Checked in, In session | Day of the appointment | Artist | Not built yet; no screen sets them. Completion works straight from Confirmed |
| Completed | Finished and final price recorded | Nobody | Mark completed |
| Cancelled | Closed | Nobody | Cancel appointment on the booking (sets the enquiry too) |
| Expired, Declined | Closed | Nobody | Not built yet; no screen or job sets them. An enquiry is given a 60-day expiry date when created but nothing acts on it |
| No-show, Reschedule requested, Refunded, Disputed | Later phases | | Not built yet; no screen sets them |

The full history of status changes, with who made each one, sits under Status history on the enquiry.

### Moves the rules allow

The system refuses any move not in this list ("Cannot move an enquiry from X to Y").

| From | Can move to |
|---|---|
| New | Needs information, In discussion, Quoted, Declined, Expired, Cancelled |
| Needs information | In discussion, Quoted, Declined, Expired, Cancelled |
| In discussion | Needs information, Quoted, Declined, Expired, Cancelled |
| Quoted | Awaiting acceptance, In discussion, Declined, Expired, Cancelled |
| Awaiting acceptance | Awaiting deposit, In discussion, Quoted, Declined, Expired, Cancelled |
| Awaiting deposit | Confirmed, Awaiting acceptance, Expired, Cancelled |
| Confirmed | Forms pending, Checked in, Reschedule requested, Cancelled, No-show |
| Forms pending | Checked in, Reschedule requested, Cancelled, No-show |
| Checked in | In session, Cancelled |
| In session | Completed |
| Completed | Refunded, Disputed |
| Cancelled | Refunded, Disputed |
| Expired, Declined | In discussion |
| No-show | Confirmed, Refunded, Disputed |
| Reschedule requested | Confirmed, Awaiting deposit, Cancelled |
| Refunded | Disputed |
| Disputed | Refunded, Completed |

"Open" enquiries (the default list on the Enquiries page) are those at New, Needs information, In discussion, Quoted, Awaiting acceptance, Awaiting deposit or Reschedule requested.

### Booking (appointment) statuses

| Status | Meaning |
|---|---|
| Awaiting deposit | Slot chosen, deposit not yet received. Blocks the diary for 20 minutes |
| Confirmed | Deposit received |
| Checked in, In session | Defined, but no screen sets them yet |
| Completed | Mark completed pressed |
| Cancelled | Cancelled by the owner or studio manager, or the hold lapsed |
| No-show | Defined, but no screen sets it yet |

### Quote statuses

| Status | Meaning |
|---|---|
| Draft | Saved by an artist while owner approval is required; the client cannot see it |
| Sent | With the client |
| Accepted, Declined | The client's answer. Accepting records which terms version they accepted |
| Superseded | Replaced by a newer version. Issuing a new quote automatically supersedes any Sent or Draft one |
| Expired | The validity date passed and the client tried to accept. A quote is only marked Expired at that moment; until then it still shows as open with its "Valid until" date |

---

## 5. The owner command centre, page by page

Sign in as staff and you land on the Owner command centre if you are an owner, a studio manager or on the desk. Artists, piercers and apprentices land on Today (section 6). The menu runs across the top. Everyone who can open this area sees the same menu, but each page checks your access and shows "forbidden" if the page is not yours. The table in section 17 says who can open what.

### Overview
Eight figures, all worked out from recorded, verified transactions only:

- **Deposits verified today** (cash basis) and **Takings this week** (every verified payment since Monday).
- **Client deposits held**: deposits received and not yet applied. Settling a deposit into sales at completion is not built yet, so this figure only grows.
- **Open enquiries** (New through Awaiting acceptance) with the number awaiting deposit beside it.
- **Confirmed this week**, **Cancelled / no-show** this week, and **Pending manual deposits** (bookings waiting for someone to record the transfer).
- **Chair rent overdue**: always 0 until chair-rent billing is built.

Below them: today's appointments (Confirmed, Checked in, In session and Awaiting deposit), **Artists this week** (hours booked, the gross value of those bookings and their arrangement; this is client sales, not studio income), enquiry sources, integration status (email, card payments, with WhatsApp and accounting export shown as later phases) and the eight most recent audit entries.

### Chat
Staff chat, WhatsApp-style. Three kinds of channel:

- **Studio**: everyone on the team.
- **Management**: owners and studio managers only.
- **Direct messages** between two people. Start one from the list of team members; each pair of people has one conversation.

Owners and managers can read every channel, including other people's direct messages, and the screen says so. Nothing in chat reaches clients, and messages are never emailed. Messages are plain text up to 2,000 characters; Enter sends and Shift+Enter starts a new line. The page refreshes by itself every six seconds and shows the latest 100 messages. Unread counts show in the menu (messages from other people since you last opened that channel). Keep client details in the enquiry thread, not here.

### Reports
Pick a period (this week, this month, last month, last 30 days, this year, or your own dates; weeks run Monday to Sunday and the page opens on this month). Fourteen reports: enquiries by artist, by source and by service; response times; bookings by artist; payments received and by method; retail and jewellery sales; games; the email marketing list; campaigns sent; stock needing attention; apprentices; clients. Each has a CSV download (money in pounds), which is recorded in the audit log. Owners and studio managers can open this page. Every column and what it counts is in section 19.

### Enquiries
By default the list shows open enquiries only (the most recently updated first, up to 200); press Show all to include closed ones. There is no status or artist filter; use the browser's find, or the Audit log search, to look for one. Log desk enquiry opens the same enquiry form clients see; because you are signed in as staff, the enquiry records which member of staff created it. Its source is always recorded as website, as there is no source picker yet.

Open one to see the summary (what they asked for, reference images, age confirmation, status history), the thread, the quotes, and the desk tools:

- **Assign artist.** Choose from the dropdown, type a reason (required, and logged) and press Assign. Reassigning later is the same control. It does not change the status or email anyone.
- **Approve and send.** Appears on a quote waiting for approval. Approving makes the quote visible to the client at once and moves the enquiry to Awaiting acceptance. It does not email the client, so send them a thread message (that does email them) or tell them yourself.
- **Reply** and **Internal note (hidden from client)** on the thread. A message can be up to 5,000 characters with up to six images or a PDF (JPEG, PNG, WebP, HEIC or PDF, under 15 MB each). An internal note is never visible to the client and does not email them. A visible message emails the client a short "new message" notice. Owners also receive the full text of every message, including internal notes (section 9).
- The **Appointment** link opens the booking once one exists.

Owners and managers can also send a quote themselves from here, using the same form the artist sees. The quote form appears while the enquiry is at New, Needs information, In discussion, Quoted or Awaiting acceptance, and only once an artist has been assigned. Quote rules are in section 8.

### Clients
Search by name, email or phone (the 200 most recently added are shown). The table shows contact details, when they joined, how many enquiries and bookings they have, and whether they are on the email marketing list (yes, no or not asked) and where that answer came from. Health answers are never shown here. Beside the table is **Add or update a client**, for the desk:

- Full name, email, phone, date of birth, how they found us, access needs.
- A **Marketing permission** box with the exact consent script to read to the client, word for word: "We would like to email you about Rebellious Ink news and offers. We never share or sell your details with anyone else, you can stop the emails at any time with one click, and saying no makes no difference to your booking. Are you happy for us to email you?" Choose Yes, they agreed, No, or Not asked (the default), with an optional note.
- Yes and No are each saved as a new numbered version of the client's answer with your name, the date and the script version. The latest answer always wins. Not asked records nothing.
- Entering an email that already exists updates that person rather than creating a second one.
- There is no separate client record page yet; the table is the record.

### Planner
A week view for everyone or one artist (pick an artist and press Filter). Bookings are blocks: green is confirmed, amber is awaiting deposit; cancelled bookings are hidden. Working hours are shaded only when a single artist is selected. Previous and next week arrows at the top. Press a booking to open it and use its tools. Moving a booking is always done from its page, never by dragging, and always needs a reason.

### Ask the desk
The desk's crib sheet: every practitioner's rate card (hourly range, day rate, minimum), whether their books are open, their hours, what they do and do not tattoo, what they will not do, piercings offered and not offered, their price list, private desk notes (never shown publicly), and the promotions running now (marked "desk only" if hidden from the public). Use it when someone rings or walks in. Each card has links to edit the profile and to the public page. Practitioners keep their own cards up to date.

### Artists & models
The page is titled "Artists & arrangements". Four things live here.

**Add someone to the team.** Choose what they do (tattoo artist, junior artist, piercer, apprentice, or desk), how they sign in (username and password, or email link), their name, the name shown to clients, their arrangement (resident on commission, chair rent or guest spot, for tattoo and junior artists), their usual station, their styles, and whether they are shown on the public site now. An apprentice must be given a supervising artist or piercer (not another apprentice). The form shows the one-time password once; copy it and give it to them. What happens behind the scenes:

- An account, an active membership with exactly one role, and (for everyone except desk staff) a practitioner profile with its own public web address made from the display name (a number is added if it is taken).
- An email address that already has a profile is refused; edit that profile instead.
- The role comes from the choice: apprentice, piercer and desk map to their own roles; tattoo and junior artists take the arrangement you chose.
- Apprentices are added with Books open switched off; everyone else with it on.
- Desk staff get no practitioner profile, so they never appear publicly and have no diary.

**The team table.** For each person: name with job title, how they sign in, their access, their status.

- *Add job title* or *Change job title*: a label in brackets after the name (40 characters at most).
- *Give a username and password* or *Reset password*: creates or resets credentials and shows a new one-time password. A reset signs them out everywhere.
- *Access dropdown* and Save: changes their role (Owner, Studio manager, Desk, Resident artist, Chair-rent artist, Guest artist, Piercer, Apprentice, Mentor or Finance adviser). They are signed out and the new access applies when they next sign in. You cannot remove your own owner access and the studio always keeps at least one owner.
- *Suspend* and *Reactivate*: suspending signs them out everywhere, blocks sign-in, unpublishes their profile and closes their books. Reactivating lets them sign in again but does not republish the profile or reopen their books; the books tick is on Profile & rates, and republishing is a job for the desk.
- *Profile & rates*, *Hours*: edit that person's public profile, rate card and working hours on their behalf. "not on public site" shows against anyone who is unpublished.

**Arrangements and compliance.** A table of each practitioner's current arrangement (for example "Chair rent £200.00/week" or "60% artist / 40% studio", the date it started and whether supplies are included), how many dated versions exist, and links to Profile & rates, Hours and Stock account. The compliance column shows whether a licence is on file and verified and when insurance runs out. There is no on-screen form yet for creating or changing arrangements, licences or insurance records, so ask the desk. A new arrangement never rewrites an old period: records are dated.

**Side-by-side calculator.** Compare a fixed chair rent with a commission split for a given number of stations: eligible weekly sales per artist (starts at £500), weekly rent (£200), studio share (40%), stations (3), monthly overheads (from Settings, £2,000 by default) and card fee (1.5%). It shows studio receipts per artist, what the artist keeps, studio gross, overheads, fees and net per week and month. It is illustrative only, before VAT, and converts weeks to months using 52 divided by 12.

### Stock
Products with category, brand, SKU, supplier, on hand, reorder level, artist price, photo (the categories are ink, needle, cartridge, glove, barrier, cleaning, dressing, transfer paper, sterilisation, jewellery, aftercare retail and other). Flags: Low (at or below the reorder level), Expiring (a lot with stock expires within 60 days) and Expired lot. Three counters at the top. Add product creates a new one; the photo must be an image, and can be replaced or removed.

Open a product to see its lots, its last 60 movements and the forms below (only owners and studio managers see the forms; the desk and artists can look):

- **Receive stock**: quantity (1 to 100,000), lot or batch number, expiry date, delivery or PO reference. Each delivery becomes its own lot.
- **Issue or sell to an artist**: choose the artist, quantity, then "Sell to artist" (charged at the unit price, which starts at the product's artist price, then its cost) or "Issue under arrangement (no charge)". Free issue is only allowed to an artist whose current arrangement includes supplies; for anyone else it is refused unless the owner overrides. An artist with no arrangement on file counts as buying from the studio.
- **Adjust a lot**: a positive or negative change with a reason (used in session, stock count correction, shrinkage or other adjustment) and a note of at least three characters. A lot cannot go below zero.
- **Edit product** at the foot.

**First expiry, first out (FEFO).** Whenever stock leaves, whether issued, sold to an artist or sold as retail, the system takes it from the lot that expires soonest first (lots with no expiry date come last, oldest first). A sale or issue that spans several lots creates one movement per lot. If there is not enough in total it is refused with how much is left.

**What each stock movement does to the money** (the ledger is explained in section 8):

| Movement | Stock | Ledger |
|---|---|---|
| Received | Adds a lot | Nothing |
| Adjusted (any reason) | Changes the lot | Nothing |
| Issued under arrangement | Takes stock, FEFO | Nothing |
| Sold to an artist | Takes stock, FEFO | Debit Artist receivable, credit Stock sales (quantity times unit price) |
| Artist pays their account | Nothing | Debit Cash or Bank, credit Artist receivable |
| Sold to a client (retail) | Takes stock, FEFO | Debit Cash, Bank or Stripe clearing, credit Stock sales |

**Stock account.** From the team table, each artist has a stock account page showing their arrangement (supplies included or buys from the studio), how much they owe the studio, and every item issued or sold to them. Where the amount owed is above zero, owners and studio managers can record a payment received (bank transfer or cash, with a note). Retail sales shows every jewellery and retail sale recorded by piercers and the desk (owners and studio managers).

### Apprentices
Each apprentice with their supervisor, verified hours against the target, core skills progress and status (In training, Ready for sign-off or Junior artist). "Waiting on you" means hours entries or skills in Ready for review need attention. Open an apprentice to verify or reject logged hours, review progression photos and leave comments, and work through the staged skills (Start, Ready for review, Sign off, Not yet, Renewal due). Signing off as a junior artist is the owner's decision alone: it needs the minimum verified hours (a setting, 500 by default) and all core skills competent, plus a written statement that is kept permanently. The detail is in section 7. At present only owners can open this page.

### Flash
All designs and sheets. The page opens with the defaults (price, size, apprentice price), the number of live designs, one-offs still available and one-offs already booked, a bulk price form, links to shareable sheets for each artist, uploaded sheets and the full list of designs with their prices and status (Available, Held, Booked or Retired).

Apprentice slots on flash: ticking "apprentice available" on a design offers it at the apprentice price (Settings, Flash: apprentice price, currently £30). The apprentices offered are those supervised by the design's artist; for house designs, whose profile supervises nobody, every published apprentice with a published supervisor is offered. Apprentices do not need books open, because they never take general enquiries, and the supervisor's hours and leave still cap the slots.

- **Add a design**: title, artist, image (JPEG, PNG, WebP or HEIC, under 15 MB), theme, colour (black or colour), collection, prices (blank means follow the studio default), apprentice available with apprentice prices, repeatable or one-off, an optional edition size and an optional fun line (both for later games and not used today). The artist and image are required; a title is 2 to 80 characters.
- **Collections**: Catalogue (the public fixed-price wall) and Gumball (the machine) are live. Tarot, Claw, Drop, Advent and Needle Town are reserved for later games; a design placed in one of those collections is not shown or bookable anywhere yet. Stamp designs for the gumball should be given the theme "stamp".
- **Retire** removes a design from the catalogue and every game but keeps the record and any bookings.
- **Sheets** group several designs on one image. Upload a sheet, then mark each design on it with a box (position and size as percentages); each marked design shares the sheet image and is shown cropped.
- **Bulk price change**: add or subtract an amount (for example 10 or -5) across every design that has its own price of a chosen size. Designs on the default follow Settings instead. Prices never go below £0. Owners and managers only.
- **Shareable sheets with prices**: for each artist, an Instagram feed image (1080 by 1350, up to 12 designs), a story image (1080 by 1920, up to 9 designs) and an A4 PDF for the studio wall (up to 12). They are drawn from the live catalogue, so prices are always current, and each design has a QR code to its booking page with a main QR code to the artist's flash page. Only available or held catalogue designs by published artists appear, and designs cut from an uploaded sheet are left out of these. The links are public and refresh every 10 minutes.
- Artists see the same form under My flash for their own designs.

### Gumball

Launch switch: the setting "Gumball: machine switched on" controls whether the gumball exists on the public site at all. Off, the page returns Not found and every link to it disappears; on, it is live. The three machines game has its own switch.
The machine's dashboard: capsules available, spins and bookings in the last 7 days, and the number of people waiting for a restock alert. Under it, the last 30 days of first-party event counts, the list of capsule designs (add or retire designs under Flash), the 50 most recent spins, and a Three machines panel with the same measures and the latest 30 goes. The machine shows as restocking when available designs drop below the minimum in Settings. When stock is back above the minimum and people are waiting, the owner can press the button to email everyone who asked to be told (each person is emailed once, and then marked as told). Both games' prices, limits and lists are changed under Settings.

### Promotions
Create a promotion for the whole studio (a banner on every public page) or one artist (a ribbon on their card and page):

- Ribbon text 3 to 40 characters, public details and terms (up to 600), an optional code (up to 20 characters, shown in capitals), a start date and an optional end date that must be after the start.
- A "show on public" tick: untick it and the offer is desk-only (it still appears under Ask the desk).
- A promotion is **scheduled** until its start, **live** between start and end, and **ended** afterwards or once someone presses End now. Ending keeps the record; it simply stops showing.
- The public site shows every live studio-wide offer as a banner and only the newest live offer for each artist.
- Studio-wide offers need owner or studio manager access; an artist can run their own from My promotions.

All promotions are listed below with their status.

### Documents
The client document library with sign-off. Every guide, policy and consent form is listed with a Read link, a PDF link, a count of the "Practitioner to confirm" notes still in its text, and its review date. A document stays marked as a draft on the public page and the PDF until someone presses Approve here and gives their name (2 to 80 characters). Approval can be withdrawn, with a reason. Both are audited. To change the wording, ask the desk to issue a new version; old versions stay on record.

How versioning and approval work:

- Each document is a numbered version of a template. All 23 are currently version 1, issued on 21 October 2026 with a review date six months on. Only the current version is public.
- Approval belongs to one version. It records the approver's name and the date. A new version starts again as a draft.
- Nothing stops you approving a document that still has "Practitioner to confirm" boxes; the page asks you to settle them first, so do.
- The PDF is an A4 page with the logo, the type of document, title, version, issue date, a red "Draft. Not yet approved" box if unapproved, and a footer with the document key, version, owner, approver, review date and page numbers. A fingerprint of each PDF is sent with the download, but PDFs are not stored; the "My documents" list for clients stays empty until later phases.
- Booking pages list the guides that suit the procedure: all-purpose and general ones, plus the tattoo set or every piercing set.

### Marketing
Email campaigns to clients who have opted in: internal name (2 to 120 characters), subject (2 to 150), body (10 to 20,000), audience (all opted-in clients or clients who have enquired with one artist). You can use the client's first-name placeholder {{name}} in the body ("there" is used if there is no name). Paragraphs are separated by a blank line. Send yourself a test first (it is marked [TEST] in the subject, goes to you only and is not copied to the owners). To send for real you type SEND. Every email carries an unsubscribe link that works without signing in. The marketing list report shows who is opted in.

Rules behind it:

- Audience: a client counts only if the latest version of their marketing answer is a yes and not withdrawn, and their account is not suspended.
- Each recipient gets their own email and is never sent the same campaign twice. A campaign that has been sent cannot be sent again.
- The Marketing pages, and so drafting, testing and sending, are for owners only.
- The status goes from draft to sending to sent (or failed if every email failed), with counts of recipients, sent and failed.
- Clicking Unsubscribe records a "no" immediately (a new numbered version with the source "unsubscribe link"), shows "You're unsubscribed" and leaves booking emails untouched. The link carries a signature that cannot be forged and does not expire.

### Social
A content calendar of posts with caption (up to 2,200 characters), image and optional schedule date, for the person who runs the studio's accounts. Posts using the studio brand should be approved by the studio manager (see the artist contracts). The rules:

- An image can only be one that is a published portfolio photo with a recorded social-media permission still in force. If none qualifies, the picker is empty.
- Send to Buffer queues the post (or schedules it for the chosen date and time) on the chosen channels. It needs Buffer to be connected; until it is, posts stay as drafts and you copy the caption and download the image to post by hand.
- Posts show as draft, scheduled or failed (with the reason). A failed post can be sent again. Nothing goes out without a person pressing Send to Buffer.
- Owners and studio managers only.

### Audit log
Every significant action: who, what, when, before and after. Read only. The latest 200 are shown and you can search by action, record type, person or record ID. It records, among others: enquiries created and assigned and every status change; quotes issued, accepted, declined; appointments created, confirmed (and by whom), moved, cancelled, expired and completed; deposits verified; settings changed (with old and new values); team changes (people added, roles, job titles, suspensions, passwords reset or changed, locks and wrong-password attempts); stock received, adjusted, issued, sold and paid for; retail sales; flash designs created, updated, retired and bulk repriced; hours and time off changed; rate cards and price lists changed; promotions created and ended; campaigns created and sent; social posts; document approvals and withdrawals; client records added at the desk and every marketing opt-in or opt-out; loyalty credit applied; reports downloaded; apprentice hours, skills, photos and junior sign-off; and game bookings. It does not record: chat messages (kept in chat), the text of thread messages (kept in the thread), or simply opening a page. Successful sign-ins are kept in a separate device log with no screen yet. The visitor's address is stored only in scrambled form, and only when an enquiry is created. The system has no screen or code that edits or deletes an audit entry.

### Settings
Each setting has a plain label. The page is for owners only. Each box saves on its own, is audited with the old and new value, and takes effect at once. The ones you will touch most:

| Setting | What it does |
|---|---|
| Slot hold while paying (minutes) | Stored, but the system currently always holds a slot for 20 minutes |
| Minimum booking notice (hours), Free reschedule notice (hours) | Stored, but the system currently always uses 24 hours' notice for online times and wording of 48 hours in the quote terms |
| Artist quotes need owner approval | On: every artist quote waits for Approve and send |
| Piercing minimum age (public setting) | Stored, but the system currently requires 18 or over for piercing enquiries whatever this says |
| Flash: default price, deposit, size options, flat placements, diary minutes | The fixed-price flash rules |
| Gumball: switched on, fixed price, deposit, spins per day, minimum designs | The machine |
| Three machines: switched on, price, deposit, goes per day, ink, style and subject lists | The second game |
| Oversight: blind-copy owners on client emails, email owners every thread message, who gets copies, morning digest, waiting-time and deposit thresholds | Section 9 |
| Default studio commission (%), default weekly chair rent, monthly overheads, VAT registered | Finance defaults. Only monthly overheads is used (it starts the calculator); the rest are stored for later |
| Apprentice minimum verified hours for junior sign-off | Apprentices |

Every setting key, default, allowed value and effect is in section 16.

### Outbox
Every email the system has sent or tried to send (the latest 100), with its status: sent, failed or queued. If a client says they had no email, look here first. A failed row for a username-only staff member reading "No email on file (username sign-in)" is normal. Owners only.

---

## 6. The artist and piercer workspace

Artists sign in as staff and land on Today. If you have an artist profile you see this workspace; owners also see a "Switch to owner view" link at the foot of the menu.

- **Today.** Three figures (open enquiries, upcoming appointments, deposits this month on your bookings), your inbox (enquiries from New to Awaiting deposit that are assigned to you) and what is next in your diary (your next ten bookings that are Confirmed, Awaiting deposit or Checked in).
- **Chat.** The Studio channel, direct messages, and Management if you are a manager.
- **My enquiries.** Only the enquiries assigned to you. Open one to read the brief and references, reply in the thread, attach images, add an internal note, and send a quote (basis, total, deposit, minutes, sessions, scope, valid days). You are emailed (if you have a real email address) when the client posts a visible message, but not when an enquiry is assigned to you. Once a booking is confirmed you will see the appointment and can Mark completed with the final price.
- **My diary.** Your bookings by day (cancelled ones are hidden), with your working hours shaded. Set-up and clean-down time is part of each block.
- **My hours.** Your weekly pattern (day, from, to) and what each block is for: Online bookings, Walk-ins only, or Bookings + walk-ins. Add one-off dates (a flash day, a guest spot: leave the day alone, set a date) and time off with a private reason. Clients can only book inside "Online bookings" or "Bookings + walk-ins" hours, and never during time off. The public profile shows your weekly pattern with walk-in times marked. If you add time off that overlaps bookings you already have, it is saved but you are warned how many bookings fall inside it, and you (or the owner) must move or cancel them from the planner. Apprentices are only bookable while their supervisor is in (section 3).
- **My earnings.** Deposits recorded against your bookings (verified payments only), your current arrangement and when it started. Weekly statements, rent invoices and commission breakdowns are not built yet. Anything you owe the studio for stock is on Studio stock, not here.
- **My portfolio.** Upload photos of your work: photo, caption, placement, style tags, healed or fresh, and whether it is your cover image. Tick "Permission to publish" only when the client has agreed on their consent form (or it is your own design with nobody's skin in it); with the tick the photo goes on your public page straight away, without it the photo is kept on file but hidden, and it cannot be published later without re-uploading with permission. Set as cover, Hide from site, Publish and Remove sit under each photo. Owners and the studio manager can do the same for any artist from Profile & rates. Everything is written to the audit log.
- **My flash.** Your own designs and sheets, same form as the owner's (section 5, Flash). Leave a price blank to follow the studio default.
- **Profile & rates.** Your display name, public bio, logo or portrait, Instagram, styles you do and do not do, placements you do not tattoo, things you will not do (public), piercings offered, and your rate card: hourly from and to (the top must be at least the bottom), day rate, minimum charge, plus a price list of fixed items with an optional price range, minutes and a note, and a tick if basic jewellery is included. "Books open" controls whether new enquiries can be sent to you. Notes for the desk are private.
- **My promotions.** A ribbon on your own card and page (section 5, Promotions).
- **Retail sales.** For piercers and anyone selling retail: pick the item from the photo strip, quantity, price each, paid by card, cash or bank transfer, optional client details and booking reference (if you give a booking reference it must exist). Only jewellery and aftercare products appear. Stock on hand drops by what you sold, taken from the soonest-expiring lot first, and the sale is recorded in the ledger as takings. The page does not work out your share; that is settled under your arrangement (not built yet).
- **Studio stock.** What is in stock, what you owe for stock, and what has been issued or sold to you. If your arrangement includes supplies, ask the desk to issue what you need; otherwise you buy at the artist price and what you owe is shown here.
- **My training.** Apprentices only (section 7).

---

## 7. Apprentices and mentors

**Apprentices** use My training:

- *Log hours*: date, hours (a quarter of an hour up to 14 in one entry), what you did (3 to 120 characters), who supervised you (or "Not supervised"), and optional notes. Hours count once a supervisor or mentor verifies them. Nobody can verify their own hours. A rejected entry stays on record with the reason and does not count.
- *Add progress photos*: up to ten at a time, saying what each is (practice skin, supervised client work, design or drawing, other), with a caption and an optional link to a skill. A mentor can add a comment to each. Photos are private to the apprentice and their mentors.
- *Skills*: the staged UK catalogue, from before-you-start prerequisites and hygiene and sterilisation through to supervised client work and completion. There are 118 skills in six stages (0 prerequisites, 1 safety and front of house, 2 deeper hygiene and set-ups, 3 basic tattooing, 4 intermediate tattooing, 5 completion), and 89 of them are core, meaning they are required for junior-artist sign-off. You see each skill's stage and status: not started, in progress, ready for review, competent (signed off by a mentor), or renewal due. An apprentice can move a skill to in progress or ready for review; only a mentor or the owner can mark one competent or renewal due.

Apprentices can be given slots on flash designs marked apprentice-available, at the apprentice price, always under their supervisor. An apprentice's own public profile says all procedures are supervised, and their slots only open while the supervisor is in (section 3). An apprentice is added with Books open off, so for the apprentice tier to appear on flash designs, switch on Books open for them and make sure they are published.

**Supervisors and mentors** verify or reject hours, review photos, move skills through Start, Ready for review and Sign off (or Not yet, which puts it back to in progress, or Renewal due), and add notes. The rules behind this: anyone holding the mentor sign-off permission, or the apprentice's named supervising artist, counts as a mentor for that apprentice. The screens for it (the Apprentices pages) sit inside the owner area, which today opens only for people who can see all enquiries, and the list page also needs the sign-off permission or owner access. In practice, therefore, hours and skills are verified by the owner. If you want a supervising artist to do it from their own login, ask the desk.

**Junior-artist sign-off.** Only the owner can do this, it cannot be undone, and it needs all of the following:

- Verified hours at or above the minimum (500 by default; set under Settings).
- Every core skill signed off as competent.
- A written statement of at least 20 characters (kept permanently), optional conditions, and the owner typing SIGN OFF.

On sign-off the system keeps a snapshot of every skill's status, the verified hours and the statement; changes the person's profile to junior artist; and changes their role from Apprentice to Resident artist. The owner is shown what is still missing while the button is disabled.

---

## 8. Money

### Quotes

**Quotes** are issued by the artist (or the owner or studio manager) and may need owner approval. They expire after the number of days set on the quote.

- **Who can quote.** The artist the enquiry is assigned to, on their own enquiries; the owner and studio manager on any enquiry. An enquiry with no artist cannot be quoted ("Assign an artist before quoting").
- **The form.** Scope (5 to 2,000 characters: what is included), basis (fixed price, hourly, per session or day rate; this is a label for the client, the system does no maths with it), total (£1 to £100,000), deposit (£0 up to the total, never more; always ask for at least £1, because the smallest deposit that can be recorded on screen is £1 and a £0 booking could not be confirmed), minutes (15 to 600, in steps of 15 on the form), sessions (1 to 50) and valid for how many days (1 to 90, starting at 14).
- **Versions.** Each quote is a numbered version (v1, v2 and so on). Issuing a new one automatically replaces any earlier one that was still Sent or Draft.
- **Owner approval.** With "Artist quotes need owner approval" on, an artist's quote is saved as a Draft that the client cannot see. The owner (or studio manager) presses Approve and send, which makes it visible to the client at once (but does not email them; see below). A quote from an owner or studio manager is never held back. The enquiry status does not change while a draft waits.
- **Terms.** Every quote carries the booking terms (version "booking-terms-v1", summarised in section 3). The client sees them and accepting records which version they accepted.
- **Expiry.** A quote is valid until the date shown. Nothing expires it automatically: when the client tries to accept after that date it is marked Expired and they are told to message for a new one. The artist then issues a new version.
- **Emails.** A quote issued straight to the client (by an artist when approval is off, or by an owner or studio manager) emails the client the amount and deposit with a link, and the owners are blind-copied. A draft that is later approved does not trigger that email, so tell the client or post a message in the thread.

### Deposits

Card payments through Stripe are not connected yet. Until they are, the client sees the booking reference to quote and a message that the studio confirms once it has seen the payment; give the client your bank details yourself. The chosen slot is held for 20 minutes.

When the money shows on the statement, the owner or studio manager opens the booking (from the enquiry's Appointment link or the Planner) and presses Record verified deposit with the amount, method (bank transfer or cash), bank reference and a note (3 to 300 characters, required). That confirms the booking. The rules:

- Only people with the verify-payments permission can do it (owners and studio managers; not the desk). It is recorded under their name.
- The amount must be at least the deposit due (and at least £1).
- It posts the money to the ledger, marks the booking and the enquiry Confirmed, makes a one-off flash design Booked for good, and counts a deposit for a game booking in the game figures.
- The Record verified deposit box only shows while the booking is Awaiting deposit, so a deposit cannot be recorded twice from the screen.
- It does not email the client. Tell them it is confirmed.

Holds that are never paid release the slot after 20 minutes and the booking is cancelled by the next booking attempt or the nightly 3 am UTC clean-up (section 3).

**When card payments are connected.** The booking page shows Pay (the deposit) by card. The client is taken to Stripe's own page (card details never touch our site). That page expires when the slot hold does, or after 30 minutes if sooner. When Stripe confirms the payment (a signed message the site checks before trusting), the booking is confirmed automatically and the client is emailed. If the card page expires or the payment fails, the payment is marked failed and the booking stays Awaiting deposit until the hold lapses. Every Stripe message is processed once only, even if Stripe repeats it.

### Moving or cancelling

On the booking: Move and notify (new start time and a reason) or Cancel appointment (reason, and the deposit outcome per policy). The reason is visible in the audit log and in the email the client receives. Clients cannot move or cancel a booking themselves yet; they message the artist and the owner or studio manager does it. The rules:

- **Move and notify** needs owner or studio manager access. The new time is entered in UK time; the length stays the same; the reason must be 5 to 500 characters. It is refused if it clashes with another booking for that artist or that station, or if the booking is already Cancelled, Completed or No-show. It does not check the artist's working hours or time off, so check the Planner first. Both the client and the artist are emailed ("Appointment ... moved to ...") with the reason, and the owners are blind-copied.
- **Cancel appointment** needs owner or studio manager access. The reason is 5 to 500 characters and the deposit outcome is one of: Pending review, Retained, Credited to a future booking, or Refund. This only records your decision. No money moves and no credit is created by it; a Stripe refund is not built yet, so any refund is made by hand. The booking and its enquiry become Cancelled, the client is emailed the reason and the outcome, and a cancellation record is kept. The artist is not emailed.

### Completion

The artist presses Mark completed with the final price (owners and studio managers can also do it from the booking page). What it does is described in section 3. Studio credit has to be applied before this, not at this step: the Apply studio credit box is switched off once a booking is Completed, Cancelled or No-show.

### Studio credit, rewards and referrals

Studio credit is earned by clients and spent at the desk. It has no cash value, cannot be transferred and nothing in the system expires it. The rules:

- **Referral code.** Every client gets a rewards account with a code of their own the first time they need one (up to four letters from their name, a dash and four letters or numbers, for example CASE-3F2A). They share the code, or a link that opens the enquiry form with it filled in.
- **When a code counts.** A friend enters it on the enquiry form. It is accepted only if it exists, is not their own, and the friend has no earlier confirmed or completed booking. A friend can only ever be linked to one referrer (the first). A code that does not fit is silently ignored; the enquiry carries on as normal.
- **When credit is awarded.** On the friend's first completed appointment, the friend receives £10 welcome credit and the person who referred them receives £10, the referral turns from Pending to Rewarded, and the referrer is emailed. Both amounts are settings (section 16).
- **Earning.** While the programme is on, every completed appointment earns the client 5% of the final price as credit, rounded down to the penny. Even a referral friend earns this on that first appointment too.
- **Spending (Apply studio credit).** The owner, studio manager or desk presses Apply studio credit on the booking page and types an amount. The amount must be at least £5, no more than the client's balance, and the box is only available before the booking is closed. The client then pays that much less on the day: the booking shows "Studio credit applied". It can be pressed more than once, and it is not checked against the price, so do not apply more than the balance on the day. The client's page says credit cannot be used on deposits. Credit is not posted to the ledger; it is just taken off what the client pays in the studio.
- **History.** The client's Rewards page shows their credit, their code, friends referred and every earn and spend line.
- **Switch.** The whole programme can be off. When it is off nothing is earned or rewarded, the Apply studio credit box does not appear and the client's Rewards page says "The rewards programme is not running at the moment". The amounts and the on/off switch have no Settings screen (section 16). The live site was set up with the programme switched off while a different scheme is planned, so check a client's Rewards page to see its current state.

### Ledger and reports

Every payment posts to an append-only ledger (a mistake is corrected by a reversing entry, never by editing; the database refuses edits and deletions). The Reports page shows payments received and by method, and the finance adviser role is intended to read the ledger without changing anything. Each booking page shows its payments and ledger lines.

What the ledger records today:

| Event | Debit | Credit |
|---|---|---|
| Deposit by card | Stripe clearing | Client deposits held |
| Deposit by bank transfer | Bank | Client deposits held |
| Deposit in cash | Cash | Client deposits held |
| Stock sold to an artist | Artist receivable | Stock sales |
| Artist pays their stock account | Cash or Bank | Artist receivable |
| Retail sale to a client | Cash, Bank or Stripe clearing | Stock sales |

Nothing else posts yet. In particular, the final price, balance paid on the day, tips, completion and studio credit are not recorded in the ledger, and a deposit stays in "Client deposits held" after the work is done because the step that settles it into sales (and commission) is not built yet.

### Stock money

Stock issued free under an arrangement costs the artist nothing. Stock sold to an artist creates an amount they owe the studio, shown on the artist's Studio stock page and on the owner's stock account page, and the owner or studio manager presses Record payment received when they settle. The contract drafts set a seven-day limit on this; the system does not enforce it.

### Commission

Daily commission settlement, rent invoicing, payout statements, tips, expenses, refunds through Stripe and VAT calculations are described in the contract drafts and the plans but are not yet built in the app (the VAT-registered setting is stored for your accountant and nothing reads it). Until they are, the daily statement is done by hand from the Reports page.

---

## 9. Oversight

Owners are kept in the loop without having to look:

- **Blind copies** of client-facing emails (acknowledgements, new-message notices, quotes, booking confirmations, moves and cancellations). Never sign-in links, marketing, reward or restock emails.
- **Thread copies.** The full text of every thread message, including internal notes, emailed to the owners as it is posted.
- **Morning digest** at 7.30 am (8.30 am by the clock in summer time): new enquiries, clients who have waited longer than the limit for an artist, deposits unpaid longer than the limit, and today's appointments.
- **Chat** is readable by owners and managers in every channel.
- **Audit log** of every significant action.

Each of the first three can be switched off, and the recipient list changed, under Settings (the oversight settings). By default copies go to every active owner. The privacy notice tells clients that threads are visible to the owners.

### Exactly who gets what

- **Recipients.** If the "who gets copies" list in Settings has valid addresses, those people. If it is empty, every active owner's sign-in email. Nobody is ever copied on a message they sent or already received, and a person with only a placeholder address (username sign-in, no email) receives nothing.
- **Blind copies** are added automatically to each email in the list above, one blind copy per email sent. A move email goes to the client and to the artist, so owners get a blind copy of each.
- **Thread copies.** Whenever anyone posts in an enquiry thread, each owner receives a separate email "Copy: message on ENQ-... from (name)" or "Copy: internal note on ..." with the full text, the number of attachments, who wrote it, which artist the enquiry is with, and a link. The writer is left out. Because blind copies and thread copies are separate switches, an owner can receive two emails for one visible message: the short notice (blind copy) and the full-text copy.
- **Morning digest.** Sent every day at 07:30 UTC, which is 07:30 on the clock in winter and 08:30 in British Summer Time, to each recipient individually, even on a day when every list is empty. It has four sections:
  1. *Waiting on an artist for more than 24 hours.* Open enquiries (New up to Awaiting acceptance) where the client wrote last, or nobody has written yet, and nothing has happened for longer than the limit. An enquiry that has no messages at all counts as waiting from the day it arrived, even if a quote has gone out. Each line shows the reference, the client, the artist and the hours waited.
  2. *New enquiries in the last 24 hours.*
  3. *Deposits unpaid for more than 48 hours.* Enquiries still at Awaiting deposit that have not been touched for longer than the limit. This includes enquiries whose 20-minute hold has lapsed, so a client who never came back keeps appearing until someone closes or re-engages the enquiry.
  4. *Today's appointments* with time, artist, client, deposit amount and "paid" or "NOT PAID" (Awaiting deposit, Confirmed, Checked in and In session).
- The subject line summarises it: "Studio digest: N waiting, N new, N today".
- **What the owners cannot do from the copies.** Nothing in them changes what a client or artist can see. Owners already have access to every thread; the copies only inform them sooner.
- **Switching off.** Each of the three is its own tick in Settings (section 16), and the 24 hour and 48 hour limits are numbers there too.

---

## 10. Daily and weekly routines

**Desk, each morning**
1. Enquiries: assign anything New (give a reason; tell the artist, who is not emailed); chase any enquiry where the client has not answered for a day or more.
2. Tell the owner or studio manager about any transfers received so they can press Record verified deposit; then tell the client it is confirmed.
3. Planner: check today's appointments and who is in.
4. Clients: add anyone new and ask the consent question from the script.
5. Ask an owner to look at the Outbox if a client says an email did not arrive.

**Artists, each day**
1. Today: answer anything in your inbox within 24 hours (the owners' digest flags anything older).
2. Send quotes promptly; they expire.
3. Mark completed at the end of each session with the final price.
4. Keep My hours accurate so clients only book when you are in.

**Owner or studio manager, each week**
1. Reports for the week: enquiries, response times, bookings, payments.
2. Apprentices (owner): anything Waiting on you.
3. Stock: the stock needing attention report.
4. Documents: approve anything you have reviewed; keep an eye on review dates.
5. Audit log: skim for anything unexpected.

**Owners, each morning**
1. Read the morning digest.
2. Bank statement: Record verified deposit for any transfers received and tell the client.
3. Outbox: anything failed (apart from the expected "No email on file" rows).

---

## 11. Problems and fixes

| Symptom | Likely cause and fix |
|---|---|
| Staff member cannot sign in | Wrong tab (use Staff: username), wrong username (check the team table), or locked after five tries (wait 15 minutes or Reset password). Suspended accounts cannot sign in. |
| "Set your password" page appears | Normal on first sign-in or after a reset. Choose at least 10 characters, not containing the username. |
| Client says no sign-in email arrived | Ask an owner to check the Outbox for the send. Ask them to check junk and request a new link. Links last 24 hours. |
| A staff member gets no emails | They signed up by username with no real email address, so their address is a placeholder and the Outbox shows "No email on file (username sign-in)". Their notifications are silently skipped. Re-add or edit their email, or tell them by message. |
| Gumball says restocking or is off | Fewer available designs than the minimum in Settings, or the machine is switched off in Settings. Add designs under Flash. |
| Three machines says it is off | Switched off in Settings. It has no stock to run out of. |
| Client cannot see the quote | If artist quotes need owner approval, it is waiting as a draft: open the enquiry and press Approve and send. Approving does not email the client, so also tell them or post in the thread. |
| Client's quote has expired | They will be told to message for a new one. The artist sends a new quote. |
| Slot the client wanted has gone | It was held by someone else, is in someone's 20-minute hold, or is less than 24 hours away (online times start 24 hours ahead). |
| No times are offered at all | The artist has no "Online bookings" hours, is on time off, or (for an apprentice) the supervisor is not in. Check My hours for both. |
| Booking stuck at Awaiting deposit | No one has pressed Record verified deposit. Check the bank statement, then the booking. If the 20 minutes passed and the booking was cancelled, the client must choose a new time. |
| Client paid but no confirmation email | For a bank transfer the system does not send one. Message the client. |
| Document shows a draft banner | It has not been approved on the Documents page. |
| Privacy page shows a Draft badge | That wording is in the page itself. Ask the desk to change it after your review. |
| Image will not upload | Must be JPEG, PNG, WebP or HEIC (PDF for thread attachments), under 15 MB. |
| Artist not on the public site | Not published (team table says "not on public site"), or suspended. There is no screen to publish later; ask the desk. Reactivating a suspended person does not publish them again. |
| Artist cannot be chosen in the enquiry form | Their Books open tick is off, or they are not published. |
| Apprentice price does not appear on flash designs | The design is not marked apprentice-available, or the apprentice is unpublished, has Books open off, or is not supervised by that design's artist. |
| Email campaign will not send | You must type SEND exactly, and there must be opted-in clients in the audience. Only owners can send. |
| Studio credit box is greyed out | The booking is closed (Completed, Cancelled or No-show), the client's balance is under £5, or the rewards programme is off. |
| Apprentices page says forbidden | It needs owner access (or the sign-off permission plus access to the owner area). |
| Report shows fewer or no rows | The period is wrong (the page opens on this month), or nothing matched. Stock needing attention ignores the period and is always as of now. |

---

## 12. Compliance quick reference

- **Age.** Tattooing anyone under 18 is illegal. The site asks for the 18+ tick and (optionally) the date of birth on the enquiry form, requires a date of birth at the games, and photographic ID is checked in the studio at every appointment. The system refuses any tattoo enquiry that declares or shows under 18, and the check is repeated when a slot is held. Piercing is 18+ only in the system at present; the "Piercing minimum age" setting is stored but nothing reads it, and the under-18 policy and parental-consent form in the documents only apply once you approve them and the desk builds a route for it.
- **Consent.** Paper consent forms are in the document library. Digital consent and health forms are a later phase, as is recording the ID check. Health answers are sensitive data: keep paper forms locked away. The system stores no health answers today.
- **Documents.** Nothing in the library should be given to a client while it shows the draft banner. Approve on the Documents page once a qualified practitioner has settled the "Practitioner to confirm" notes.
- **Privacy.** The privacy notice is public (and still carries its draft badge until the desk updates it). Thread oversight by owners is disclosed there. Client marketing needs a recorded opt-in; every campaign email has an unsubscribe link. The notice promises that enquiries which do not proceed are deleted after 12 months, and the system does not do this automatically yet (section 18).
- **Games.** Free to play, nothing is won or lost, nothing is charged to spin. They only lead to a fixed-price booking. Keep it that way; charging to play or awarding prizes would make them gambling.
- **Artwork.** Only original or licensed images on the site. The stamp set is the studio's own. Archive flash should be replaced with your own work (see docs/15).
- **Advertising claims.** Avoid medical or clinical claims ("medical-grade"). "Sterile", "single-use" and "licensed" are fine because they are true and checkable. Promotions must carry real dates.
- **Social posts.** Only images with a recorded permission for social media can be posted from the system.
- **Contracts.** Drafts for each arrangement are in docs/contracts. Have a solicitor review before anyone signs.

---

## 13. Changing things and getting help

Things you can change yourselves (owners unless stated): everything under Settings, promotions (owner, studio manager or the artist), flash and gumball designs (owner, studio manager or the artist for their own), team members and access (owner and studio manager), document approval (owner and studio manager), hours, rate cards, stock (owner and studio manager).

Things that need the desk (the development assistant): new wording on the public pages, new documents or new versions of existing ones, new settings, connecting Stripe, changing the games' rules, publishing or republishing a profile, adding portfolio photos, setting up arrangements, licences or insurance, changing the rewards amounts or switch, and anything that is not on a screen.

When something looks wrong, note the page, the time and the reference number, and check the Audit log and Outbox first; between them they explain most things.

### What is not built yet

Where a plan or an older document promised these, the code does not do them today:

- Card payments (the Stripe connection is written and tested but not switched on) and Stripe refunds.
- Digital consent and health forms, e-signatures, recording the photographic ID check, treatment photo consent screens, and the incident log.
- Appointment reminders, aftercare emails, healed-photo requests, review requests and a waiting list.
- Clients moving or cancelling their own bookings, "Checked in", "In session", "No-show" and "Forms pending" buttons, and Needs information, Expired and Declined being set automatically.
- Chair-rent billing, commission statements, payouts, expenses, tips and VAT calculations.
- Portfolio upload with permission capture, scanning uploads for viruses, and a drag and drop planner.
- Rate limiting on public forms, two-step sign-in (MFA) for privileged roles, staff invitations by email, and listing or revoking signed-in devices.
- Data export for clients, automatic deletion of old data, and a record page for each client.
- The AI assistant, WhatsApp messaging, accounting export and the later game collections (Tarot, Claw, Drop, Advent, Needle Town).

---

## 14. Every email the system sends

Everything below goes out through the studio's email service from thedesk@rebelliousink.tattoo, with replies going back to the same mailbox. Each message has a plain-text and a styled version, is logged in the Outbox with its status, and is stored there with the recipient, subject and template key only (not the message text). Message subjects never contain what a client wrote, and nothing sent contains health information. Staff who sign in by username and have no real email address are never emailed; the attempt shows in the Outbox as failed with "No email on file (username sign-in)".

"Blind-copied" means the owners (section 9) receive a hidden copy of that email automatically, unless the owners' copy switch is off in Settings.

| Template key | When it goes | To | Blind-copied | What it contains |
|---|---|---|---|---|
| `auth.magic_link` | A client (or an email-link staff member) asks for a sign-in link on the login page | The address typed in | No, never | Subject "Your sign-in link for Rebellious Ink". The site name, the one-time link (valid 24 hours) and a line to ignore it if they did not ask |
| `enquiry.acknowledged` | An enquiry is submitted, from the website or logged at the desk | The enquirer | Yes | Subject begins "We've received your enquiry" and ends with the ENQ reference. Thanks, the reference, which artist (or "The studio") will reply through the portal, and a sign-in link |
| `enquiry.new_message` | A client-visible message is posted in an enquiry thread: when staff post, it goes to the client; when the client posts, it goes to the assigned artist (nothing if no artist is assigned). Internal notes never trigger it | The other party | Yes | Subject "New message on" plus the ENQ reference. A sign-in link. No message text |
| `quote.sent` | A quote is sent to the client: issued straight to the client, not when a draft is approved | The client | Yes | Subject "Your quote for" plus the ENQ reference. The total and deposit and a link to review and accept |
| `booking.confirmed` | A card payment is confirmed by Stripe. Not sent when staff record a bank-transfer or cash deposit | The client | Yes | Subject begins "Booking confirmed" and ends with the RI reference. Artist, date and time, reference, deposit received, link to the booking page |
| `booking.rescheduled` | Move and notify is pressed on a booking | The client and the artist, one email each | Yes (each one) | Subject "Appointment (RI reference) moved to (date and time)". The new time, the reason, a sign-in link |
| `booking.cancelled` | Cancel appointment is pressed | The client only | Yes | Subject "Appointment (RI reference) cancelled". The reason and the deposit outcome (pending review, retained, credited or refunded) |
| `oversight.message_copy` | Anyone posts any message in an enquiry thread (visible or internal), if the thread-copy switch is on | Each recipient on the owners' list except the writer | Not applicable (these are the copies) | Subject "Copy: message" or "Copy: internal note" plus the reference and who wrote it. Full text, attachment count, which artist, link to open the thread |
| `oversight.daily_digest` | Every day at 07:30 UTC, if the digest switch is on | Each recipient on the owners' list | No | Subject "Studio digest: N waiting, N new, N today". Four sections: waiting on an artist, new in 24 hours, deposits unpaid, today's appointments (section 9) |
| `loyalty.referral_rewarded` | A referred friend's first appointment is completed and the referral is rewarded | The person who referred them | No | Subject "You've earned (amount) studio credit". A line that their friend finished a first appointment, and a link to their rewards |
| `gumball.restocked` | The owner presses the restock alert button, and the machine has enough designs again | Each address on the restock waiting list, once each | No | Subject "The gumball machine is full again". A link to spin and the total price |
| `campaign:(campaign ID)` | The owner sends a marketing campaign (typing SEND) | Each opted-in client in the audience, never twice | No | The campaign's own subject and body, "there" or the client's name for the {{name}} placeholder, and an unsubscribe link in the footer |
| `campaign:(campaign ID):test` | Send me a test on a campaign | The person who pressed it | No | Subject starts "[TEST]". The same body, with a working unsubscribe link for the sender |

**What the system does not email** (so tell people yourself): an artist when an enquiry is assigned to them; an owner approving a draft quote; an artist when a client accepts or declines a quote; the client when staff record a bank-transfer or cash deposit; anyone when a slot hold lapses or a booking is cancelled for non-payment; the artist when a booking is cancelled; password resets (the one-time password is read out on screen); appointment reminders, aftercare, healed-photo or review requests (not built yet).

**If an email fails.** The Outbox row is marked failed with the provider's reason. Most notices are best-effort: if one fails, the action that triggered it (for example a message in a thread or a cancellation) still goes through, and the failure is only visible in the Outbox. The live site will not start at all without an email service connected. In test setups with no email service, messages are written to a development outbox instead of being sent.

---

## 15. Automatic jobs and integrations

### Scheduled jobs

Two jobs run on a schedule set on the hosting service. Schedules are written in UTC, so in British Summer Time (late March to late October) each runs an hour later by the clock. Each job refuses to run unless the scheduler presents the studio's secret key, so nobody can trigger them by visiting an address.

| Job | When | What it changes |
|---|---|---|
| Hold clean-up | Every day at 03:00 UTC (4 am in summer) | Cancels every Awaiting deposit booking whose 20-minute hold has run out (reason "Deposit not received before hold expiry"; audit entry from "System: hold expiry"); deletes unused slot holds that have lapsed; returns one-off flash designs whose hold has run out to Available. It does not email anyone and does not change the enquiry, which stays at Awaiting deposit |
| Morning digest | Every day at 07:30 UTC (8:30 am in summer) | Sends the owners' digest if it is switched on and there is at least one recipient (section 9). Changes nothing else |

The clean-up also happens without a job, so a slot never stays blocked for long: when a client picks a time with an artist, that artist's lapsed holds are cleared first; and whenever a flash or gumball page loads, lapsed one-off design holds are returned. A lapsed hold never blocks the diary even before it is cleaned up. There are no other scheduled jobs: nothing sends reminders, expires quotes or enquiries, expires credit, or deletes old data on a timer.

### Stripe (card payments) and the bank-transfer fallback

- **Not connected today.** Card payments switch on only when both Stripe secrets are added; one without the other stops the live site starting. Until then every deposit is a bank transfer or cash: the client sees the booking reference to quote, the booking stays Awaiting deposit, and the owner or studio manager records the deposit after seeing it (section 8).
- **When connected.** Pressing Pay by card creates a Stripe checkout for the deposit (in pounds) with the booking reference, and a pending payment record. Stripe sends signed messages to the site's Stripe webhook address; the site checks the signature before trusting anything and ignores unsigned or altered ones.
- **Events acted on.** Checkout completed and delayed payment succeeded (if marked paid: confirm the booking, post the ledger entry, send the confirmation email, mark any one-off design Booked, count a game deposit); checkout expired and delayed payment failed (mark the payment failed); charge refunded (noted only, nothing else changes). Anything else is stored and ignored.
- **Safety.** Each Stripe event is stored by its ID and processed once, even if Stripe resends it. A paid amount lower than the deposit due is refused and Stripe is told to retry. If processing fails Stripe is told so and tries again later; the outcome of every event is kept.

### Email (Resend)

All email goes through Resend. A message that cannot be sent is logged as failed with the reason. The live site refuses to start without it. Messages to placeholder staff addresses are skipped. Owner copies never include the recipient or the sender of the original.

### Buffer (social posts)

Optional. Needs two values set on the hosting project. When connected, the Social page lists your connected channels and sends posts to Buffer (queued, or at the date and time chosen), with the image attached through a one-hour link. When not connected, posts stay as drafts.

### The file store and signed links

Every uploaded file (reference images, thread attachments, product and design photos, avatars, apprentice photos) is kept in a private store that cannot be reached directly. A page asks for a signed link that expires, so a copied link stops working. Files must be JPEG, PNG, WebP or HEIC images or PDFs, under 15 MB (design, product and avatar pictures must be images, not PDFs). Uploads are not scanned for viruses yet: every file stays "pending", and a file marked flagged would be hidden and refused, but nothing flags files automatically.

| Where the link appears | How long it lasts |
|---|---|
| Artist, flash, product and avatar pictures on public and staff pages | 1 hour |
| Posting an image to Buffer | 1 hour |
| Thread attachments and apprentice progression photos | 15 minutes |
| Reference images on an enquiry, and images on My portfolio | 10 minutes |

Opening a link works while it has not expired; the browser may keep the file for up to a minute. Reload the page to get fresh links.

### PDFs and share images

| Output | How it is made |
|---|---|
| Guide PDF (every document) | Made on request from the current version: A4, logo, document type, title, version, issue date, a red draft box if unapproved, footer with key, version, owner, approver, review date, page numbers. A fingerprint of the PDF is sent in the download. Kept private for 5 minutes |
| Flash sheet PDF | A4, dark theme, up to 12 of the artist's catalogue designs with current prices, apprentice price, QR code per design and a main QR code. Public address; refreshed every 10 minutes |
| Flash feed image | 1080 by 1350 pixels, up to 12 designs, same data |
| Flash story image | 1080 by 1920 pixels, up to 9 designs, same data |
| Gumball share card | 1080 by 1920 pixels: the design and artist, "Get what you get", no price, 18+. Only the person who spun can open it |

### Analytics events

The site counts what happens on the games with its own tables only; nothing is sent to a third-party tracker. Each event stores the event name, the game, an anonymous visitor ID (a random code in a cookie), the account if signed in, the design and the play, and the time.

| Event | Recorded when |
|---|---|
| Game viewed | Someone opens the gumball or three machines page |
| Age gate passed | Someone passes the date-of-birth check (always counted under the gumball) |
| Play started and Result shown | A spin or go is made (both at once) |
| Deposit paid | The deposit is recorded for a booking that came from a game |
| Restock alert signup | Someone leaves their email for the restock alert |
| Replay bought | Defined for a later feature, never recorded |

### Cookies and sign-in tokens

A sign-in cookie (14 days), an anonymous visitor ID cookie (one year, used for spin limits and the counts above) and an "adult" cookie (one year) set when someone passes the age gate. There are no advertising or third-party tracking cookies.

### Health check

A public status page reports whether the database, email, payments and file store are connected, with no secrets. The Overview shows the email and card payment status to anyone who can open it.

---

## 16. Settings reference

The Settings page lists every setting as a plain list in the order below; it is not split into headed groups, and the headings here are only to make this table easier to read. Only owners can open it. Each box has its own Save button, takes effect at once, and is recorded in the Audit log with the old and new values.

**How to type a value.** A box takes one of four kinds of value: the word true or false; a plain number (no £ sign, no commas; every "pence" setting is in pence, so £30 is 3000); a list in square brackets, written like ["hands","neck"] or [4,5,6,7,8] with double quotes around words; or ordinary text. If a box holds the wrong kind of value, for example words where a number is needed, the system ignores it and uses the default. "Live" below means the system reads the setting; "Stored only" means it is saved but nothing in the system uses it yet.

### Finance and pricing guide

| Key | On-screen label | Default | Allowed values | Effect |
|---|---|---|---|---|
| `finance.monthlyOverheadsPence` | Monthly overheads (pence) | 200000 (£2,000) | Number of pence | Live: the starting figure for overheads in the side-by-side calculator on Artists & models |
| `finance.defaultWeeklyChairRentPence` | Default weekly chair rent (pence) | 20000 (£200) | Number of pence | Stored only: the calculator always starts at £200 |
| `finance.defaultStudioPercent` | Default studio commission (%) | 40 | Number | Stored only: the calculator always starts at 40 |
| `pricing.tattooHourlyMinPence` | Illustrative tattoo hourly rate, low (pence) | 6000 (£60) | Number of pence | Stored only |
| `pricing.tattooHourlyMaxPence` | Illustrative tattoo hourly rate, high (pence) | 8000 (£80) | Number of pence | Stored only |

### Booking and quotes

| Key | On-screen label | Default | Allowed values | Effect |
|---|---|---|---|---|
| `booking.holdMinutes` | Slot hold while paying (minutes) | 20 | Number | Stored only: the hold is always 20 minutes |
| `booking.minNoticeHours` | Minimum booking notice (hours) | 24 | Number | Stored only: online times always start 24 hours ahead |
| `booking.cancellationNoticeHours` | Free reschedule notice (hours) | 48 | Number | Stored only: the quote terms always say 48 hours |
| `quote.requiresOwnerApproval` | Artist quotes need owner approval | false | true or false | Live: when true, an artist's quote is held as a Draft until an owner or studio manager presses Approve and send. Quotes from owners and managers are never held |
| `piercing.minimumAge` | Piercing minimum age (public setting) | 18 | Number | Stored only: piercing enquiries need the 18+ tick whatever this says |

### Academy and studio

| Key | On-screen label | Default | Allowed values | Effect |
|---|---|---|---|---|
| `academy.minimumHours` | Apprentice minimum verified hours for junior sign-off | 500 | Number of hours | Live: the hours target shown for each apprentice, and the hours needed before the junior sign-off button works |
| `studio.vatRegistered` | Studio is VAT registered | false | true or false | Stored only: for your accountant; no VAT is calculated |

### Gumball machine

| Key | On-screen label | Default | Allowed values | Effect |
|---|---|---|---|---|
| `gumball.pricePence` | Gumball: fixed price (pence) | 3000 (£30) | Number of pence | Live: total price shown before the spin and charged on the booking |
| `gumball.depositPence` | Gumball: deposit when booking (pence) | 1000 (£10) | Number of pence | Live: deposit, never more than the price |
| `gumball.spinsPerDay` | Gumball: spins per person per day | 1 | Number | Live: spins allowed per browser or account per UK day |
| `gumball.minStock` | Gumball: minimum designs before the machine shows as restocking | 5 | Number | Live: below this many available designs the machine stops and offers the restock alert |
| `gumball.enabled` | Gumball: machine switched on | true | true or false | Live: false switches the machine off |

### Oversight

| Key | On-screen label | Default | Allowed values | Effect |
|---|---|---|---|---|
| `oversight.copyTo` | Oversight: who gets copies and the digest (JSON list of emails) | empty list | A list of email addresses, e.g. ["a@b.com"] | Live: empty means every active owner's sign-in email. Anything that is not a valid email address is dropped |
| `oversight.copyEmails` | Oversight: blind-copy owners on client emails (acknowledgements, quotes, bookings) | true | true or false | Live: false stops blind copies |
| `oversight.copyMessages` | Oversight: email owners the full text of every thread message | true | true or false | Live: false stops the thread copies |
| `oversight.digestEnabled` | Oversight: morning digest to owners | true | true or false | Live: false stops the digest (the label says it is sent at 07:30, which is UTC) |
| `oversight.flakyHours` | Oversight: hours a client may wait for an artist before the digest flags it | 24 | Number above 0 | Live: the waiting limit in the digest |
| `oversight.depositHours` | Oversight: hours a deposit may stay unpaid before the digest flags it | 48 | Number above 0 | Live: the unpaid-deposit limit in the digest |

### Three machines

| Key | On-screen label | Default | Allowed values | Effect |
|---|---|---|---|---|
| `trio.pricePence` | Three machines: fixed price (pence) | 4000 (£40) | Number of pence | Live: total price shown before the pull and on the booking |
| `trio.depositPence` | Three machines: deposit when booking (pence) | 1000 (£10) | Number of pence | Live: deposit, never more than the price |
| `trio.spinsPerDay` | Three machines: goes per person per day | 1 | Number | Live: goes allowed per browser or account per UK day |
| `trio.enabled` | Three machines: switched on | true | true or false | Live: false switches the game off |
| `trio.inks` | Three machines: ink options (JSON list) | Black and grey, Colour | A list of words, not empty | Live: the first machine. A colour is anything whose name contains "colour" |
| `trio.styles` | Three machines: style options (JSON list) | Traditional, Fine line, Blackwork, Neo-traditional, Dotwork, Geometric, Illustrative, Sketchy | A list of words, not empty | Live: the second machine |
| `trio.subjects` | Three machines: subject options (JSON list) | Spider, Angel, Dagger, Rose, Swallow, Anchor, Snake, Skull, Heart, Moon, Star, Butterfly, Cherries, Lightning bolt, Eye, Key, Horseshoe, Bee, Mushroom, Sun, Crown, Flame, Cat, Wave, Diamond | A list of words, not empty | Live: the third machine; keep to simple ideas your artists are happy to draw |

### Flash

| Key | On-screen label | Default | Allowed values | Effect |
|---|---|---|---|---|
| `flash.smallPence` | Flash: default price (pence) | 6000 (£60) | Number of pence | Live: the price for every design that has no price of its own |
| `flash.sizeOptionsCm` | Flash: size options the client can pick (JSON list of cm) | [4,5,6,7,8] | A list of whole numbers | Live: the sizes offered, all one price; the last is the maximum. A booking for a size not in the list is refused |
| `flash.apprenticeSmallPence` | Flash: apprentice price (pence) | 4000 (£40) | Number of pence | Live: the supervised-apprentice price for designs with no price of their own |
| `flash.depositSmallPence` | Flash: deposit (pence) | 2000 (£20) | Number of pence | Live: deposit for the artist tier, never more than the total |
| `flash.apprenticeDepositPence` | Flash: apprentice deposit (pence) | 1500 (£15) | Number of pence | Live: deposit for the apprentice tier |
| `flash.smallMaxCm` | Flash: size shown on sheets and guides (cm) | 8 | Number | Live: the largest size quoted on sheets, in game bookings and as the default size; should match the last size option |
| `flash.minutesSmall` | Flash: diary minutes per flash tattoo | 60 | Number | Live: appointment length for flash and both games, plus set-up and clean-down |
| `flash.designHoldMinutes` | Flash: one-off design hold while booking (minutes) | 15 | Number | Live: how long a one-off design is held while a client starts a booking (35 once a slot is chosen) |
| `flash.fixedPlacements` | Flash: flat, easy placements the fixed price applies to (JSON list) | upper arm (outer), forearm (outer), forearm (inner), shoulder (top), thigh (outer), calf | A list of words | Live: the placements offered on flash, gumball and three machines bookings; anywhere else is a custom price from the desk |

### Settings that exist but have no screen

These are read by the system, but there is no box for them on the Settings page, so only the desk can change them. The values below are what applies when nothing is stored.

| Key | Default | Effect |
|---|---|---|
| `loyalty.enabled` | true (the live site was set up with it switched off) | Turns the whole rewards programme on or off |
| `loyalty.referralBonusPence` | 1000 (£10) | Credit for the person who referred a friend |
| `loyalty.welcomeCreditPence` | 1000 (£10) | Credit for the referred friend |
| `loyalty.earnPercent` | 5 | Percentage of the final price earned back as credit |
| `loyalty.minRedeemPence` | 500 (£5) | The smallest amount of credit that can be applied |
| `gumball.holdMinutes` | 15 | How long a one-off capsule is held for the person who drew it |
| `flash.palmEnabled` | false | A second, larger "palm" flash size; off, and hidden everywhere |
| `flash.palmPence`, `flash.apprenticePalmPence`, `flash.depositPalmPence`, `flash.palmMaxCm`, `flash.minutesPalm` | 11000, 7000, 3000, 12, 120 | The palm size's prices, size and time, used only if palm is switched on |
| `flash.quotePlacements` | hands, fingers, neck, face | Stored; nothing reads it today |

---

## 17. Roles and permissions reference

### The roles in words

| Role | Who it is for | Notes |
|---|---|---|
| Owner | The studio's owners | Holds every permission |
| Studio manager | Runs the studio day to day | Everything except Settings, Outbox, Marketing, Apprentices, refunds and the owner-only tools below. Can manage the team and give anyone owner access |
| Desk (reception) | Front of house | Enquiries, clients, bookings (view), Planner, stock (view), apply studio credit, chat |
| Resident artist, Chair-rent artist, Guest artist | Tattoo artists by arrangement | Their own enquiries, quotes, bookings, hours, profile and flash. Guests do not have the stock-view permission, although the Studio stock page itself opens for anyone with a practitioner profile |
| Piercer | Piercers | Same as an artist without the AI permission |
| Apprentice | Apprentices | Own enquiries and bookings, training, stock view |
| Mentor | Signs off apprentices | Sign-off permission and chat only |
| Finance adviser | An outside accountant | Studio finance view and export permissions |
| Client | Everyone else who signs in | No permissions. Sees only their own enquiries, bookings, documents, rewards and preferences |
| AI assistant | Reserved | Not built yet |

Each team member holds one role at a time, set from the access dropdown on Artists & models. A junior artist is a practitioner type, not a role: on sign-off they become a Resident artist.

### What each permission allows

"Y" means the role holds it by default (Mgr is the Studio manager, Appr the Apprentice, Finance the Finance adviser, AI the AI assistant). Roles marked "Res/Chair" are Resident and Chair-rent artists, who are identical. A team member's permissions are exactly the role's defaults plus any overrides that the desk has set (there is no screen for overrides).

| Permission | In words | Owner | Mgr | Desk | Res/Chair | Guest | Piercer | Appr | Mentor | Finance | AI |
|---|---|---|---|---|---|---|---|---|---|---|---|
| studio.manage | Owner-only tools: Outbox, Marketing pages and sending campaigns, junior-artist sign-off, game restock emails, free-issuing stock against an arrangement | Y | | | | | | | | | |
| settings.manage | Open and change Settings | Y | | | | | | | | | |
| roster.manage | Add and manage the team, passwords, access, suspensions, job titles; edit anyone's profile, hours, flash and promotions; open the Flash and Gumball pages | Y | Y | | | | | | | | |
| enquiries.view_all | See every enquiry; open the owner area, Ask the desk and the staff area | Y | Y | Y | | | | | | | |
| enquiries.view_assigned | See enquiries assigned to you | Y | | | Y | Y | Y | Y | | | |
| enquiries.create_desk | Add or update a client at the desk and record marketing consent | Y | Y | Y | | | | | | | |
| enquiries.assign | Assign an artist to an enquiry | Y | Y | Y | | | | | | | |
| quotes.issue | Send a quote on your own enquiry | Y | | | Y | Y | Y | | | | |
| quotes.approve | Approve draft quotes and send quotes on any enquiry | Y | Y | | | | | | | | |
| bookings.view_all | Open any booking | Y | Y | Y | | | | | | | |
| bookings.view_own | Reserved: not checked on any screen yet (artists see their own bookings through their diary) | Y | | | Y | Y | Y | Y | | | |
| bookings.override | Move bookings; mark any booking completed; apply studio credit | Y | Y | | | | | | | | |
| bookings.cancel | Cancel a booking | Y | Y | | | | | | | | |
| finance.view_studio | Reports, report downloads and the retail sales report | Y | Y | | | | | | | Y | |
| finance.view_own | Reserved: not checked on any screen yet | Y | | | Y | Y | Y | | | | |
| finance.verify_manual_payment | Record a verified deposit; record an artist's payment for stock | Y | Y | | | | | | | | |
| finance.refund | Reserved: refunds are not built yet | Y | | | | | | | | | |
| finance.export | Reserved: report downloads use the studio finance view permission | Y | | | | | | | | Y | |
| clients.view_assigned | Reserved: not checked on any screen yet | Y | | | Y | Y | Y | | | | |
| clients.view_all | Open the Clients page | Y | Y | Y | | | | | | | |
| health.view_need_to_know | Reserved for health forms (not built yet) | Y | | | Y | Y | Y | | | | |
| portfolio.manage_own | Reserved: portfolio upload is not built yet | Y | | | Y | Y | Y | Y | | | |
| portfolio.publish | Open Social; draft and send posts | Y | Y | | | | | | | | |
| stock.view | View stock pages | Y | Y | Y | Y | | Y | Y | | | |
| stock.manage | Add and edit products, receive, adjust, issue and sell stock; record a sale on someone else's behalf | Y | Y | | | | | | | | |
| documents.manage | Approve and withdraw approval on client documents | Y | Y | | | | | | | | |
| audit.view | Open the Audit log | Y | Y | | | | | | | | |
| staff.chat | Reserved: the chat opens for anyone with a staff role | Y | Y | Y | Y | Y | Y | Y | Y | | |
| academy.learn | Use My training as an apprentice | Y | | | | | | Y | | | |
| academy.signoff | Open the Apprentices pages and sign off skills | Y | | | | | | | Y | | |
| ai.use | Reserved: not built yet | Y | Y | | Y | | | | | | Y |
| loyalty.redeem | Apply studio credit to a booking | Y | Y | Y | | | | | | | |

### Which page needs what

| Page | Needs |
|---|---|
| Owner area (menu, Overview, Enquiries list, Planner, Artists & models page itself) | enquiries.view_all (owner, studio manager, desk) |
| Chat, staff area | An artist profile, or enquiries.view_all |
| Reports and its downloads, Retail sales report | finance.view_studio |
| Clients | clients.view_all |
| Ask the desk | enquiries.view_all |
| Stock (list and product page), artist stock account | stock.view (changing things needs stock.manage; recording an artist's payment needs finance.verify_manual_payment) |
| Apprentices | academy.signoff or studio.manage (in practice the owner) |
| Flash, Gumball, Promotions (owner pages), an artist's profile and hours (owner pages) | roster.manage |
| Documents | documents.manage |
| Marketing, Outbox | studio.manage |
| Social | portfolio.publish |
| Audit log | audit.view |
| Settings | settings.manage |
| A booking page in the owner area | bookings.view_all |

### Rules the permission list does not show

- **Records are scoped by ownership.** Anyone who can see all enquiries sees them all. An artist sees only enquiries assigned to them. A client sees only their own. Anything else shows as "not found", so its existence is not revealed. A client never sees internal notes or draft quotes and cannot post an internal note.
- **Only the client accepts or declines their quote**, and only while it is Sent and in date.
- **A booking page** is visible to its client, its artist, or anyone with the open-any-booking permission.
- **Completion** is by the booked artist or someone who can move bookings. **Credit** is applied by someone with the apply-credit permission or the move-bookings permission.
- **Flash designs and sheets** can be changed by their own artist or by the team-management permission; promotions and rate cards likewise; a retail sale is recorded by the practitioner on their own book or by stock managers.
- **Suspended people** lose every permission at once.
- **An access end date** can be set on a membership; after it passes the person is treated as an ordinary client. There is no screen to set it.
- **The staff and owner areas, in practice.** The owner area opens only for people who can see all enquiries; the staff area opens for anyone with a practitioner profile or who can see all enquiries. A person whose only role is Mentor or Finance adviser meets neither test, so after sign-in they are taken to the client area. Until that is changed by the desk, treat those two roles as not usable on their own.
- **Who can give out access.** The team-management permission covers changing roles, including to Owner, and it is held by studio managers as well as owners. The only guards are that nobody can remove their own owner access or suspend themselves, and the last active owner cannot be demoted or suspended.
- Everything is also checked on the server for each action, not only by hiding buttons.

---

## 18. Data the system keeps and for how long

The system has no timer that deletes personal data. Anything listed as "kept" stays until the desk removes it by hand. The privacy notice promises that enquiries which do not proceed are deleted after 12 months and that consent and treatment records are kept for the period your insurer and council require (to be confirmed and published); neither is automated yet.

| What | What exactly is stored | Who can see it | How long | Why we are allowed (from the compliance register and privacy notice) |
|---|---|---|---|---|
| Client identity | Name, email, phone, date of birth, access needs (voluntary), how they found us | Desk, owners, managers, and the assigned artist through the enquiry. Date of birth is not on the Clients list | Kept | Contract (planning and providing the tattoo or piercing) and, for date of birth, legal obligation under the Tattooing of Minors Act 1969 |
| ID check | Not stored. Photographic ID is checked in the studio; no copy is kept. A place to record the outcome exists but has no screen yet | n/a | n/a | Legal obligation; studio policy |
| Enquiries, threads and quotes | The brief, up to six private reference images, every message and attachment, quote versions with the terms the client accepted, status history | The client, the assigned artist, the desk, owners and managers. Internal notes are staff only | Kept (the privacy notice says non-proceeding enquiries are deleted after 12 months: not automatic) | Contract; owners' sight of threads is legitimate interests (quality, safeguarding, complaints), disclosed in the notice |
| Bookings and payments | Appointment, deposit, final price, credit applied, payment method and bank reference, who verified it, ledger entries | Owners and managers; the artist sees their own; the client sees their own | Kept. Ledger entries can never be edited or deleted | Contract and legal obligation (card details are never stored by us; Stripe handles them) |
| Marketing consent | Each answer is a numbered version with yes or no, when, and where it came from (enquiry form, client portal, the desk staff member, or the unsubscribe link). The latest version decides | Clients list shows the latest answer; Reports show counts | Kept as the history of consent | Consent (UK GDPR and PECR). Nothing is pre-ticked; saying no changes nothing about a booking; details are never shared or sold |
| Photo and publication permissions | A separate permission per image and purpose (portfolio publication, social media and so on) with who recorded it and when, and when it was withdrawn | Owners, managers, the artist | Kept | Consent, separate from any other consent |
| Portfolio and design images | The file, type, size, who took it and who holds the rights | Public only if published with permission; designs by choice of the studio | Kept | Consent for client work; the studio's own flash is its own artwork |
| Health information | Nothing yet. A separate restricted area and an access log are ready in the database, but no screen or code stores or reads health answers. Paper forms are the record for now | Nobody | n/a | Explicit consent (UK GDPR Article 9) is the design assumption; the owner decides the condition with advice |
| Staff accounts | Name, username or email, a scrambled password (never readable), failed-attempt count and lock time, role, job title, status, sign-in sessions and a log of sign-ins | Owners and managers (not passwords) | Sessions last 14 days. Everything else kept | Not set out in the compliance register yet; confirm with your adviser |
| Chat | Every message with sender and time | Staff in that channel; owners and managers can read all | Kept; there is no delete | Not set out in the compliance register yet |
| Audit log | Who, what, when, record, reason, before and after; a scrambled form of the visitor's address on enquiry creation | Owners and managers | Kept; cannot be edited from the system | The compliance register describes it as append-only; its lawful basis is not set out yet, so confirm with your adviser |
| Emails sent | Recipient, subject, template key, status, provider ID (not the message text) | Owners (Outbox); clients see their own list under My documents | Kept | Not set out in the compliance register yet; confirm with your adviser |
| Visitor and game data | An anonymous visitor ID, the spin or go (design or brief, prices shown, booked or not) and event counts; no names unless the person is signed in. The date of birth typed at the age gate is not kept unless they are signed in and had none on file | Owners and managers (Gumball page and reports) | Kept | The compliance register does not name a basis for visitor cookies and counts yet; confirm with your adviser. No third-party trackers are used |
| Rewards | Credit balance, every earn and spend line, referral links and status | The client; owners and the desk | Kept | Promotion terms: credit has no cash value and is earned only on completed paid appointments |
| Apprentice records | Hours, notes, progression photos, skill status, mentor comments, the junior sign-off statement and a snapshot | The apprentice, mentors and owners | Sign-off statement kept permanently | Apprenticeship records; employment status is for your adviser |
| Documents and approvals | Each version of each guide, who approved it and when, withdrawals | Public (current version); approvals to owners and managers | Old versions stay on record | The practitioner approval gate in the compliance register; the approver's name is the only personal data |

### Privacy preferences and unsubscribe

There are seven separate permission types in the system: treatment photography, portfolio publication, social media, marketing email, marketing text messages, merchandise use and WhatsApp contact. They are never bundled and never pre-ticked. Only marketing email has a screen for the client (Preferences, where they can turn it on or off at any time; booking and treatment emails are always sent) and for the desk (the consent script). Photo permissions are recorded by the desk per image. The others are not built yet.

Every marketing email has an unsubscribe link in the footer. Opening it needs no sign-in: it records a "no" immediately as a new version with the source "unsubscribe link", shows a confirmation, and leaves booking emails alone. A link cannot be forged, and it does not expire. If a client who unsubscribed ticks the marketing box on a later enquiry, their existing answer is not changed (the enquiry form only records an answer for someone who has none); they can turn it back on from Preferences.

Requests for a copy of someone's data, correction or erasure are handled by the desk by hand; a client export is not built yet.

---

## 19. Reports reference

Reports are on the Reports page (owners and studio managers). Choose a period and press Run. "In the period" means enquiries created, bookings starting or payments made between the first and last moment of the chosen dates in UK time. Each report has a Download CSV button; in the file, money columns are in pounds. Download is recorded in the Audit log.

| Report | Columns | What counts |
|---|---|---|
| Enquiries by artist | Artist, Enquiries, Booked, Conversion, Completed, Lost; with an All row | Enquiries created in the period, grouped by assigned artist ("Unassigned / match me" if none). Booked means the enquiry reached Awaiting deposit or beyond (Awaiting deposit, Confirmed, Forms pending, Checked in, In session, Completed). Conversion is Booked divided by Enquiries. Completed is Completed. Lost is Cancelled, Expired or Declined, so a booking that was later cancelled counts in both Booked and Lost |
| Enquiries by source | Source, then the same five columns | The same counts grouped by where it came from. The system can record website, walk in, telephone, Instagram, Facebook, WhatsApp, referral or other, but every screen that creates an enquiry today (including Log desk enquiry) records "website", so expect one row until a source picker is added |
| Enquiries by service | Service, then the same five columns | Grouped by tattoo, consultation, piercing, flash or multi session project. Gumball and three-machines bookings count as flash |
| Response times | Artist, Enquiries, Replied, Average first reply (h), Median first reply (h), Waiting now over 24h | Enquiries created in the period. First reply is the first client-visible message from anyone other than the client, measured in hours from when the enquiry arrived. Waiting now counts enquiries (not closed or completed) where the client wrote last or nobody has written, for more than 24 hours; this uses a fixed 24 hours, not the digest setting |
| Bookings by artist | Artist, Appointments, Completed, Cancelled, No-show, Deposits paid, Deposits unpaid; with an All row | Appointments starting in the period. Deposits paid is the total of deposits for bookings whose deposit is recorded; Deposits unpaid is the number still Awaiting deposit |
| Payments received | Purpose, Payments, Amount; with an All row | Successful payments recorded in the period (today these are deposits), by purpose. Balances paid in the studio are not recorded in the system, so they are not here |
| Payments by method | Method, Payments, Amount | The same payments by card, bank transfer or cash |
| Retail and jewellery sales | Practitioner, Items, Amount; with an All row | Sales recorded on Retail sales in the period, by who sold them. Not counted in Payments received |
| Games | Game, Page views, Age checks passed, Goes, Booked, Goes to bookings | Page views, passes of the age check (always counted under the gumball), spins or goes made and how many were booked, for the Gumball machine and Three machines. Goes to bookings is Booked divided by Goes |
| Email marketing list | Measure, Count | Opted in now (people whose latest answer is yes), New opt-ins in the period, Opt-outs in the period, and Opted in via each source (enquiry form, portal, desk, unsubscribe link and so on) |
| Campaigns sent | Campaign, Subject, Recipients, Sent, Failed, Sent on | Campaigns whose send date falls in the period |
| Stock needing attention | Product, SKU, Category, On hand, Reorder at, Low, Lots expiring, Lots expired, Supplier | Always as of now, whatever period is chosen. A product appears if it is at or below its reorder level, or has a lot with stock that expires within 60 days or has already expired |
| Apprentices | Apprentice, Supervisor, Hours logged, Hours verified, Skills competent, Awaiting review | For each apprentice: hours with a log date in the period (all, and verified only), and across all time the skills signed off and the skills waiting for a mentor's review |
| Clients | Measure, Count | New clients in the period (every new client record, which also includes staff added to the team), of which added at the desk, clients with at least one completed appointment (all time), and repeat clients with two or more completed appointments (all time) |

### Overview and Today figures

| Figure | What counts |
|---|---|
| Deposits verified today | Successful deposit payments verified since midnight UK time |
| Takings this week | Every successful payment verified since Monday |
| Client deposits held | Deposits received minus deposits released, from the ledger (releases are not built, so it only grows) |
| Open enquiries | Enquiries at New, Needs information, In discussion, Quoted or Awaiting acceptance |
| Awaiting deposit | Enquiries at Awaiting deposit |
| Confirmed this week | Bookings starting this week that are Confirmed, Checked in, In session or Completed |
| Cancelled / no-show | Bookings starting this week with those statuses |
| Pending manual deposits | Bookings at Awaiting deposit |
| Chair rent overdue | Overdue rent charges (always 0 until billing is built) |
| Artists this week: booked hours and value | Hours between start and end of the week's bookings, and the total of their quoted prices (gross client sales, not studio income) |
| Today (artists): open enquiries, upcoming appointments, deposits this month | Your enquiries from New to Awaiting deposit, your next ten bookings, and verified deposits on your bookings since the start of the month |

---

## 20. Glossary

| Term | Meaning |
|---|---|
| Access end date | A date after which a team member is treated as an ordinary client. No screen sets it yet |
| Apprentice slot | A time when an apprentice can be booked. It exists only while their supervising artist is also in the studio (section 3) |
| Arrangement | How an artist works with the studio: resident on commission, chair rent or guest spot. It decides whether supplies are included and what the studio takes |
| Audit | The log of significant actions, with who did them and before and after values. Read only |
| Blind copy | A hidden copy of a client email sent to the owners |
| Books open | A tick on an artist's profile. When off, new enquiries cannot be sent to them and the public page says "Books closed" |
| Booking reference | RI-year-number, given when a client holds a slot. Quote it on transfers |
| Capsule | One design in the gumball machine |
| Chair rent | A fixed weekly fee an artist pays for their chair, keeping their own takings. The calculator starts at £200 |
| Collection | Which wall a flash design belongs to: Catalogue (public wall), Gumball (the machine), or one of the later-game collections |
| Commission | A percentage of an artist's eligible sales that the studio keeps. The calculator starts at 40% |
| Consent version | Each time a client's marketing answer changes, a new numbered version is saved with who recorded it and where. The latest decides |
| Core skill | An apprentice skill that must be signed off before junior-artist sign-off. 89 of the 118 are core |
| Credit | See studio credit |
| Deposit | The part of the price paid up front to secure the appointment. It comes off the final price |
| Deposit verified | The moment the owner or studio manager records, under their own name, that the money has really arrived. It confirms the booking |
| Desk | Reception. Also the studio's way of saying "the person who runs the system for you" in section 13 (the development assistant) |
| Digest | The owners' morning email: waiting enquiries, new enquiries, unpaid deposits, today's appointments |
| Draft (document) | A client document that has not been approved by a practitioner, so it shows a draft banner and must not be given to clients |
| Draft (quote) | A quote saved but not yet visible to the client, awaiting owner approval |
| Edition | A field on flash designs for a later numbered-edition game. It has no effect today |
| ENQ reference | ENQ-year-number, given to every enquiry |
| FEFO | First expiry, first out: stock always leaves from the lot that expires soonest |
| Flash | Ready-drawn designs sold at a fixed price. One price per design, for any size up to the maximum |
| Hold | A slot kept for a client for 20 minutes while they pay, or a one-off design kept for a client while they book |
| Junior artist | An apprentice who has been signed off by the owner and becomes a resident artist |
| Ledger | The permanent money record. Entries can be reversed but never edited |
| Lot | One delivery of a product, with its own expiry date and quantity. Stock is counted and issued by lot |
| Mentor | Someone who verifies an apprentice's hours and signs off skills: the holder of the sign-off permission or the apprentice's own supervisor |
| Movement | One line in a product's history: received, adjusted, issued, sold |
| One-off | A flash design that can only be tattooed once. After the deposit it is Booked and gone |
| Outbox | The list of every email the system sent or tried to send, with status. Owners only |
| Oversight | The owners' view of the studio: blind copies, thread copies, the digest, readable chat and the audit log |
| Placeholder email | A made-up address ending in staff.invalid given to staff who sign in by username with no email. Nothing is ever sent to it |
| Play | One spin of the gumball machine or one go on the three machines, saved with its result and whether it was booked |
| Practitioner to confirm | A highlighted note in a client document marking something the drafter could not settle. Resolve each one before approving |
| Rate card | An artist's public prices and boundaries: hourly range, day rate, minimum charge, what they do and do not do, and their price list |
| Referral code | A client's personal code (for example CASE-3F2A). A new friend who enters it earns both of them credit after their first appointment |
| Repeatable | A flash design that can be booked any number of times |
| Reversal | A ledger entry that cancels an earlier one, instead of changing it |
| Sheet | One uploaded picture holding several flash designs, each marked with a box. Also the printable or shareable page of an artist's designs |
| Signed link | A web address for a private file that stops working after a few minutes |
| Station | A chair or room. Two bookings cannot overlap on the same station, even for different artists |
| Studio credit | Money earned by clients through rewards and referrals, taken off what they pay in the studio. It has no cash value |
| Supervisor | The artist or piercer responsible for an apprentice. An apprentice can only be booked while their supervisor is in |
| Tier | Which price a flash booking uses: artist, or supervised apprentice |
| Unsubscribe link | The footer link in marketing emails that opts the client out in one click with no sign-in |
| Verified hours | Apprentice hours that a mentor has confirmed. Only these count towards the target |
