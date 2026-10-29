# Risk register

Likelihood and impact: Low / Medium / High. Owner is who must act.

| # | Risk | L | I | Mitigation in place | Still needed | Owner |
|---|---|---|---|---|---|---|
| R1 | Tattooing a minor (Tattooing of Minors Act 1969) | L | H | Under-18 tattoo enquiries rejected; holds refused without the 18+ declaration; no setting can override; DOB captured. | In-person ID check record per appointment and treatment block (P2-04). | Studio owner |
| R2 | Consent forms not legally valid or not procedure-specific | M | H | Versioned consent templates and immutable signatures designed in the schema; nothing issued yet. | Legal review before Phase 2 goes live. | Owner + solicitor |
| R3 | Health data mishandled (UK GDPR special category) | M | H | Separate `restricted` schema, encrypted blob design, immutable access log, no health fields on general models. | DPIA, key management, RLS, retention job, privacy notice sign-off. | Owner + DPO/adviser |
| R4 | HMRC employment status of chair-rent artists misjudged | M | M | Arrangements recorded as effective-dated data, not labels; notes flag "to be confirmed". | Accountant review of actual working arrangements. | Accountant |
| R5 | VAT treatment wrong (rent, services) | M | M | VAT fields on models and invoices; `studio.vatRegistered` setting; nothing charged yet. | Accountant confirmation before Phase 3 billing. | Accountant |
| R6 | Double booking | L | H | Advisory locks + exclusion constraints + holds; tested under concurrency. | Scheduler for hold expiry (P1-17). | Dev |
| R7 | Deposit recorded without money received | L | H | Confirmation only via signed webhook or named finance verifier; underpayment refused; ledger journal. | Bank reconciliation report (P3-07). | Dev + owner |
| R8 | No-shows and disputes over deposits | M | M | Terms snapshot on each quote; cancellation records deposit outcome; audit trail. | Published policy (blocking question 5). | Owner |
| R9 | Owner account takeover (no MFA yet) | M | H | Magic-link only, database sessions, suspension flag. | MFA (P1-14), session revocation UI (P1-21). | Dev |
| R10 | Signed URL leakage | L | M | HMAC with expiry (10 minutes by default; 1 hour for public portfolio), flagged files never served. | Shorter TTL for private references, S3 driver. | Dev |
| R11 | Malicious uploads | M | M | MIME and size limits, served with nosniff, inline only. | Malware scanning (P1-18). | Dev |
| R12 | Webhook replay or spoofing | L | H | Signature verification, unique `WebhookEvent`, idempotent confirmation. | None beyond monitoring. | Dev |
| R13 | Unapproved guide content reaches clients | M | M | Draft banner on web and PDF until `approvedAt` set. | Practitioner approval workflow in `/owner`. | Practitioners |
| R14 | App coupled to the claude-code fork repository | H | L | Documented; self-contained folder. | Move to its own repository (blocking question 10). | Owner |
| R15 | No staging environment yet | H | M | Health endpoint and env guards ready. | P1-27. | Owner + dev |
| R16 | Backups and restore untested | H | H | Managed Postgres assumed. | Enable PITR and rehearse a restore before real data. | Owner + dev |
| R17 | Rebellious Hustler brand mixed into Rebellious Ink data | L | M | Separate `LegalEntity` records; no clothing data in this system. | Keep separate until a documented relationship exists. | Owner |
