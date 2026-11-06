# Schedule of Commercial Terms: Fill-in Template

> **DRAFT for studio review. Not legal advice. Have a solicitor review before signature.**
>
> v0.1, 22 October 2026

*Rebellious Ink. One master sheet for agreements 01 to 04. Fill it in once, then copy the figures into the Schedule at the end of the agreement you are using. Agreement 05 (apprentice) has its own Schedule.*

**Applies to:** **C** chair rent (01), **R** resident commission (02), **G** guest (03), **P** piercer (04). **Placeholders:** `[CAPITALS]` you must fill in. `[24]` a proposed figure to keep or change. `[to confirm]` a term from the owner's brief to confirm.

| No. | Item | Agreed term | Applies |
|---|---|---|---|
| S1 | Studio | [STUDIO LEGAL ENTITY NAME], company no. [NUMBER], address [ADDRESS]. Owner: Charlie [SURNAME]. Notices: [EMAIL] | All |
| S2 | Artist / Piercer | [FULL LEGAL NAME], trading as [TRADING NAME], [ADDRESS], [EMAIL], UTR [UTR], VAT no. [if registered] | All |
| S3 | Premises and council | [PREMISES ADDRESS]; [COUNCIL]; studio registration [REF] | All |
| S4 | Station and what the Studio supplies | [STATION]; [CHAIR OR BED, LIGHTING, STERILISATION, WASTE, UTILITIES, WIFI] | All |
| S5 | Start date / Guest Period | [START DATE] (guest: to [END DATE]) | All |
| S6 | Agreed Days / Guest Days and usual hours | [DAYS AND HOURS]. Held for the artist. Not days they must work | All |
| S7 | Notice periods | Trial [4] weeks on [7] days' notice; normal [4] weeks; after an activity review [7] days; guest [7] days | All |
| S8 | Rent | £[AMOUNT] per [day / week / month]; VAT [added / not added] | C, G, P |
| S9 | Rent day and method | [DAY / DATE], in advance, via the Studio System | C, G, P |
| S10 | Rent review; optional rent break | Once in 12 months on [8] weeks' notice; break [4] weeks / not offered | C, P |
| S11 | Commission split | Studio [%] / Artist [%] | R, G, P |
| S12 | Excluded from Eligible Sales | VAT [Y/N]; tips [Y/N]; card and payment fees [Y/N]; materials [Y/N] | R, G, P |
| S13 | Card and payment fees on Deposits | [Studio absorbs / at cost from artist] | All |
| S14 | Slot deposit (guest) | £[AMOUNT] by [DATE]; kept if cancelled under [14] days | G |
| S15 | Close of Business | [TIME, e.g. 18:00]. Sums due to the Studio settled the same day [to confirm] | All |
| S16 | Studio pays the artist | By end of the next Working Day [to confirm timing] | All |
| S17 | Working Days | [Mon to Fri, excluding bank holidays] | All |
| S18 | Missed settlement | Interest from next day; suspension after [7] days; ending after [14] days | All |
| S19 | Included Consumables | [LIST / NONE]. All else at the Artist Price, paid within seven (7) days of issue [to confirm] | All |
| S20 | Artist supplies own consumables | [YES, LIST / NO] | All |
| S21 | Jewellery price and standard | [LIST / % OF CLIENT PRICE]; [MATERIAL AND STERILITY STANDARD] | P (and any artist selling jewellery) |
| S22 | Piercing age policy | [MINIMUM AGE]; [EXCEPTIONS, ID, PARENTAL RULES] | P; all if piercing |
| S23 | Insurance | Public liability at least [£5 million]; [INSURER], [POLICY], expires [DATE] | All |
| S24 | Registration | [COUNCIL], [NUMBER], expires [DATE]; displayed at the Station | All |
| S25 | Brand | Hashtag [#HASHTAG]; Studio Manager [Elle Evaa] [to confirm]; approval of branded posts within [2] Working Days [to confirm] | All |
| S26 | Service standards | Respond to assigned enquiries in [24] hours; attend or give [48] hours' notice; touch-ups [3 months] [to confirm] | All |
| S27 | Activity review | [8] consecutive weeks with no bookings or Deposits through the Studio System [to confirm]; meeting in [14] days; then [7] days' notice. Guest: pre-arrival check [14] days before | All |
| S28 | Keys and alarm; special terms | [ARRANGEMENTS]; [NONE / LIST] | All |

### Entering the same figures in the Studio System

The arrangement is recorded in the system as an effective-dated compensation model. Use the same numbers there so the contract and the ledger agree.

| This sheet | System field |
|---|---|
| S8 rent (per week or day) | `weeklyRentPence` or `dailyRentPence` (pence, e.g. £150.00 = 15000) |
| S9 rent day | `rentDueWeekday` (1 = Monday) |
| S8 VAT | `vatOnRent` |
| S11 split | `studioPercent` and `artistPercent` (should total 100) |
| S12 exclusions | `eligibleBase` (VAT, tips, card fees, materials) |
| S19 Included Consumables | `suppliesIncluded` and `suppliesNote` |
| S5 start date | `effectiveFrom` (a change of terms is a new row, not an edit) |
| Signed contract | `ArtistContractVersion` (PDF and hash) |

The system has weekly and daily rent fields only. If the contract says a monthly rent, record the weekly equivalent in the system and say so in `notes`, or ask for a monthly field. Check each figure against the signed contract before saving. A mistake is corrected by a new effective-dated row, not by editing history.
