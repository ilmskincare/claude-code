# Deployment record

## 6 November 2026: first deployment

- Vercel project `rebellious-hustler` (team lush-labs-projects), deployed from this folder with the Vercel CLI. The project's framework preset had to be set to Next.js by API; it was created as "Other" and served a 404 until then.
- Database: the production Supabase project shared with the studio app, in a separate Postgres schema `shop`. The init migration was applied by SQL (schema created, `search_path` set, migration recorded in `shop._prisma_migrations`). Prisma migrate cannot reach the pooler from the build sandbox, so later migrations are applied the same way.
- Connection: `DATABASE_URL` points at the Supabase transaction pooler on port 6543 with `?schema=shop` and no `sslmode` parameter. With `sslmode=require` in the URL, `pg` replaces the SSL options from the connection string and the root certificate in `DATABASE_SSL_CA` is ignored, which fails with "self-signed certificate in certificate chain". `DATABASE_SSL_CA` holds the Supabase root certificate.
- Images: public Blob store `rebellious-hustler-images` connected to the project (`BLOB_STORE_ID`; the SDK fetches its own OIDC token on Vercel).
- Seed: admin user `hustler` (must change password on first sign-in), store settings, and 8 sample products with 91 variants and generated placeholder art, loaded by SQL dump from a local seed run.
- Environment variables set: `DATABASE_URL`, `DATABASE_SSL_CA`, `SESSION_SECRET`, `ADMIN_INITIAL_PASSWORD`, `APP_BASE_URL`, `EMAIL_FROM`. Not yet set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (checkout shows the "being connected" notice until they are), `RESEND_API_KEY`.
- Domain: `rebellioushustler.com` is already registered to the brand (via LCN, expires 31 March 2027) and currently points at a frozen Shopify store. To move it: add the domain to the Vercel project, then at LCN set the apex A record to Vercel's address and `www` as a CNAME to `cname.vercel-dns.com`, or move the nameservers to Vercel.
