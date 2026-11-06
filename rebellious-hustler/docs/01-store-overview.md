# Store overview

What the Rebellious Hustler store is made of, how data moves through it, and what is still a placeholder.

## Pages

### Storefront (`src/app/(store)`)

| Route | What it shows |
| --- | --- |
| `/` | Hero with the crest and "Made of hustle, grit & loyalty", range tiles (Mens, Womens, Boys, Girls), four featured products, "The movement" section with the family wording, Instagram call to action. |
| `/shop` | Live products. Filters: `?audience=mens|womens|boys|girls|everyone`, `?category=tracksuits|t-shirts|hoodies|sportswear|accessories`, `?sort=newest|price-asc|price-desc`. |
| `/shop/[slug]` | Gallery, price and "was" price, colour and size picker that only enables in-stock combinations, quantity (max 10), add to cart, description, delivery and returns summary, related products. Unknown or non-live slugs return a 404. |
| `/cart` | Lines with update and remove, order summary, free delivery progress, delivery choice and the Stripe checkout button. Without `STRIPE_SECRET_KEY` the button becomes the "Online checkout is being connected" notice. |
| `/checkout/success` | Thank you page. Shows the order number and a link when the webhook has already created the order. |
| `/checkout/cancelled` | Back to cart. |
| `/orders/[number]?email=` | Order status, items, totals, address and tracking. Only shown when the email matches the order; otherwise an email prompt. |
| `/about`, `/contact`, `/delivery`, `/returns`, `/terms`, `/privacy` | Content pages. Returns and terms cover the Consumer Contracts Regulations 2013 (14 days to cancel, 14 more to return, refund within 14 days, customer pays return postage unless faulty) and the Consumer Rights Act 2015 (30 day right to reject, repair or replace, six month presumption). Privacy covers UK GDPR, Stripe, Resend, Vercel, six year retention of order records, and the two strictly necessary cookies. |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Generated. The sitemap lists live products. Admin, cart, checkout and order pages are disallowed. |

Layout: announcement bar from settings, sticky header (crest, wordmark, Shop, Mens, Womens, Boys, Girls, cart with count), footer (address, email, Instagram, Facebook, help and legal links). Every page is rendered on request (`force-dynamic`) so stock and prices are always current.

### Admin (`src/app/admin`)

| Route | What it does |
| --- | --- |
| `/admin/login` | Username and password. Five failures lock the account for 15 minutes. |
| `/admin/password` | Change password. Forced on first login (`mustChangePassword`). |
| `/admin` | Dashboard: orders today and this week, revenue, orders to dispatch, low stock count, recent orders, missing environment variables. |
| `/admin/products`, `/admin/products/new`, `/admin/products/[id]` | List, create, edit. Status buttons (Publish live, Back to draft, Archive), variants grid, image upload with drag and drop, reorder and delete, alt text, featured flag, delete (only if never ordered). |
| `/admin/orders`, `/admin/orders/[id]` | List with status filter. Detail with items, address, Stripe ids, history, mark fulfilled with tracking (sends the dispatch email), cancel or refund note. |
| `/admin/stock` | Variants at or below a threshold. |
| `/admin/settings` | Delivery rates and free threshold, announcement, contact email, Instagram handle, address, environment variable checklist. |

### API routes

| Route | Purpose |
| --- | --- |
| `POST /api/stripe/webhook` | Verifies the Stripe signature, then `handleStripeEvent`. |
| `GET /api/files/[...key]` | Serves photos from `./storage` when the local storage driver is active. Returns 404 when Blob is configured. |

## Data model (Postgres schema `shop`, `prisma/schema.prisma`)

- **AdminUser**: username, scrypt `passwordHash`, `mustChangePassword`, `failedLogins`, `lockedUntil`, `sessionVersion` (bumped on password change to invalidate old cookies).
- **AuditLog**: actor, action, entity, entityId, before and after JSON, createdAt. Written by every admin action.
- **StoreSettings**: single row `default` with shipping pence, free threshold pence, announcement, contact email, Instagram handle, store address.
- **Product**: name, unique slug, description, `audience` (MENS, WOMENS, BOYS, GIRLS, UNISEX), `category` (TRACKSUITS, T_SHIRTS, HOODIES, SPORTSWEAR, ACCESSORIES), `pricePence`, `compareAtPence`, `status` (DRAFT, LIVE, ARCHIVED), `featured`, `isSample`.
- **ProductImage**: url, thumbUrl, storage keys, alt, position. Cascades with the product.
- **ProductVariant**: size, colour, unique sku, stockQty. Unique on (product, size, colour).
- **Cart** and **CartItem**: the cart id is held in the signed `rh_cart` cookie; items are rows keyed by variant with a quantity.
- **OrderCounter**: one row per year, feeds `RH-YYYY-000001` numbers through an atomic upsert increment.
- **Order**: number, status (PAID, FULFILLED, CANCELLED, REFUNDED), email, customer name, shipping address JSON, shipping method, subtotal, shipping and total pence, unique `stripeSessionId`, payment intent id, tracking reference, fulfilledAt, adminNote.
- **OrderItem**: snapshot of product name, size, colour, SKU, unit pence and quantity, with an optional link back to the variant.
- **WebhookEvent**: every Stripe event id seen, unique, for idempotency.

Money is always integer pence. Prices typed in the admin as pounds are parsed by `parsePoundsToPence` and validated with zod.

## Flows

**Add to cart.** The product page posts `variantId` and `quantity` to a server action. The action creates a cart row if needed and sets the signed httpOnly cookie, then upserts the line clamped to the stock on hand and the per-line maximum of 10. The header count and cart page read the cart from the database on every request.

**Checkout.** `createCheckoutSession` rebuilds the cart from the database (prices and stock are never taken from the browser), refuses if anything is sold out or no longer live, and creates a Stripe Checkout session in GBP with the chosen delivery option (free above the threshold), GB-only shipping address collection and the cart contents encoded in metadata. The customer pays on Stripe's hosted page.

**Order creation.** Stripe calls `/api/stripe/webhook` with `checkout.session.completed`. After signature verification, `processCheckoutCompleted` runs in one transaction: record the event id (unique), allocate the next order number, create the order with item snapshots, decrement each variant's stock with a conditional update (never below zero; oversells are noted on the order), clear the cart. Then it sends the confirmation email through Resend (or logs it). Duplicate deliveries are detected by event id and by session id, so retries are harmless.

**Fulfilment.** Admin marks a PAID order fulfilled with an optional tracking reference; the dispatch email goes out and the audit log records the change. Cancellations and refunds happen in Stripe and are recorded here as a status plus a note.

**Admin auth.** Password check with scrypt and a lockout counter. The session cookie is a signed JSON payload (user id, session version, expiry) valid for 12 hours. Changing the password bumps the session version so other devices are signed out.

**Images.** Uploads go through a server action, are resized with sharp to a 1600 px JPEG plus a 600 px thumbnail, and stored on Vercel Blob (public store, token or project-connected) or on local disk in development.

## Still placeholder or not verified

- The eight seeded products use generated placeholder art, invented descriptions and stock numbers. They are flagged `isSample` and badged in the admin. Real products and photos need adding before launch.
- Opening hours on `/contact` are bracketed placeholders.
- `[legal entity name]`, `[company number]` and `[VAT number]` on `/terms` and `/privacy` need the real details.
- The Facebook link points at facebook.com because the page URL was not supplied.
- `hello@rebellioushustler.com` is a placeholder contact email until the real mailbox exists; change it in Settings.
- The live Stripe flow (hosted page, real webhook delivery) is exercised only with a fake payload in the integration tests; it has not been run against Stripe's API from this environment.
- Vercel Blob uploads were not run from this environment (no token here); the local driver was used. The Blob code path follows the `@vercel/blob` 2.8 API.
- Resend sending was not run; without a key the app logs the email text.
- There is no customer account system, no discount codes and no collect-in-store option by design; these are noted on the delivery page as "message us".
