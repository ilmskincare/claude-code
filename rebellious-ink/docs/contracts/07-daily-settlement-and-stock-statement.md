# Daily Settlement and Stock Statement: Explainer and Sample

> **DRAFT for studio review. Not legal advice. Have a solicitor review before signature.**
>
> v0.1, 22 October 2026

*Rebellious Ink. Shows how the daily commission settlement and the seven-day stock account in agreements 01 to 04 are worked out. **All figures below are made up** to show the arithmetic. The real percentages, times and prices come from the Schedule.*

## 1. The two accounts

| | Daily settlement | Stock account |
|---|---|---|
| What it covers | Commission owed to the Studio, Deposits and balances held for the artist, tips | Consumables, jewellery and retail bought from studio stock that are not included in the arrangement |
| When it is settled | By Close of Business, the same day [to confirm] | Within seven (7) days of the issue date [to confirm] |
| If missed | Interest; Studio Manager calls next working day; suspension after [7] days; ending after [14] | Interest; no further stock issued until cleared; optional suspension after [14] days |
| Contract clauses | 5 and 6 | 7 |

## 2. How the daily number is worked out

For each piece completed that day:

1. **Eligible price** = what the client pays for the work, after the exclusions in the Schedule (tips, VAT and any others the studio chooses).
2. **Studio share** = eligible price × studio percentage. **Artist share** = eligible price − studio share.
3. **Money the Studio already holds** = verified Deposits applied to the piece + any balance taken at the Studio's desk.
4. **Net to settle** = total studio share − money the Studio already holds. Positive: the artist pays the Studio by Close of Business. Negative: the Studio pays the artist by the end of the next Working Day [to confirm].

A deposit counts only when it is **verified** (card paid and confirmed, or a bank transfer or cash payment checked by an authorised person). Chair-rent artists have a studio share of nil, so for them the net figure is simply the Deposits and balances the Studio holds for them, less any agreed payment fees.

## 3. Sample daily statement

*Example artist, resident commission, Studio 40% / Artist 60%. Thursday 22 October 2026.*

| Piece | Eligible price | Verified Deposit | Balance on the day | Taken by | Studio share (40%) | Artist share (60%) |
|---|---:|---:|---:|---|---:|---:|
| A. Forearm | £300.00 | £50.00 | £250.00 | Artist (cash) | £120.00 | £180.00 |
| B. Palm | £120.00 | £30.00 | £90.00 | Artist (cash) | £48.00 | £72.00 |
| **Totals** | **£420.00** | **£80.00** | **£340.00** | | **£168.00** | **£252.00** |

| Line | Amount |
|---|---:|
| Studio share owed | £168.00 |
| Less: verified Deposits the Studio already holds | −£80.00 |
| **Artist pays the Studio by Close of Business** | **£88.00** |
| Tips taken at the Studio's desk (passed on in full) | £10.00 owed to the artist |
| **Net: artist pays the Studio** | **£78.00** |

*Check:* the artist holds £340.00 cash, pays the Studio £88.00 and receives £10.00 in tips, leaving £262.00. That is the artist's share (£252.00) plus the tip (£10.00).

*Other direction:* if piece A's balance had been paid by card at the Studio's desk, the Studio would hold £50.00 + £30.00 + £250.00 = £330.00. Net = £168.00 − £330.00 = −£162.00, so the Studio pays the artist £162.00.

## 4. Sample stock account

*Position at the end of Thursday 22 October 2026. Due date = issue date + 7 days.*

| Issued | Item | Artist Price | Due | Paid | Status |
|---|---|---:|---|---:|---|
| Mon 12 Oct | Cartridges, 1 box | £42.00 | Mon 19 Oct | £0.00 | **Overdue, 3 days.** Interest runs. No further stock until paid |
| Thu 15 Oct | Gloves, 2 boxes | £14.00 | Thu 22 Oct | £0.00 | **Due today** |
| Mon 19 Oct | Aftercare balm × 6 | £30.00 | Mon 26 Oct | £0.00 | Open |
| Thu 22 Oct | Ink set | £28.00 | Thu 29 Oct | £0.00 | New today |
| Thu 22 Oct | Aftercare balm × 2 (retail, sold on to clients) | £10.00 | Thu 29 Oct | £0.00 | New today |
| | **Total outstanding** | **£124.00** | | | Overdue £42.00. Due today £14.00 |

Retail sold on 22 October: 2 × £8.00 = £16.00 taken from clients. The artist keeps it and owes the Studio only the £10.00 Artist Price above. The £6.00 difference is the artist's. The Studio takes no commission on it.

## 5. How this matches the Studio System

| Statement line | What the system records |
|---|---|
| Verified deposit | A `Payment` with purpose `DEPOSIT`. Held as `CLIENT_DEPOSITS_HELD` until applied to a completed session or forfeited. Bank and cash deposits need a named verifier and time |
| Balance on the day | A `Payment` with purpose `BALANCE`, against `CASH`, `BANK` or `STRIPE_CLEARING` |
| Eligible price | The model's `eligibleBase` (VAT, tips, card fees, materials) |
| Studio share, artist share | `STUDIO_SHARE` and `ARTIST_SHARE`; a `CommissionEntry` holds the eligible base, `studioPence` and `artistPence` |
| Tips | `TIPS_PAYABLE` |
| Payment fees | `PAYMENT_FEES` |
| Consumables issued | A `StockMovement`: `issued_to_artist` (free, supplies included) or `sold_to_artist` with `unitPricePence`, posted to `ARTIST_RECEIVABLE`; payment is marked received later |
| Retail sold | A `RetailSale` (see the note below) |
| Chair rent | A `ChairRentCharge` (due, paid, overdue, waived) and `CHAIR_RENT_RECEIVABLE` |

**What is and is not built.** Stock issued or sold to an artist, and the artist receivable, work today. Commission entries, payouts and settlement statements are Phase 3 and are not built yet. Until they are, prepare this statement by hand from verified payments and completed appointments. The ledger is append-only: fix a mistake with a reversal, never an edit.

**One decision for the owner.** The contracts follow the brief: the artist buys retail and jewellery at the Artist Price and sells on in their own name. The system's retail sale (`RetailSale`, `STOCK_SALES`) treats the sale as the Studio's. Choose one model and make the contract and the system agree.
