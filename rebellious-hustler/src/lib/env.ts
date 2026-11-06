import { z } from "zod";

/**
 * Validated environment. Optional providers (Stripe, Blob, Resend) switch features on
 * when present; the admin settings page lists whichever are still missing.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(16).default("dev-only-session-secret-change-me-please"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  /** Set by Vercel when a Blob store is connected to the project; the SDK then fetches its own token. */
  BLOB_STORE_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Rebellious Hustler <orders@localhost>"),
  STORAGE_LOCAL_DIR: z.string().default("./storage"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Invalid environment: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const e = parsed.data;
  if (e.NODE_ENV === "production" && e.SESSION_SECRET === "dev-only-session-secret-change-me-please") {
    throw new Error("Production refuses to start with the default SESSION_SECRET. Set a random value.");
  }
  cached = e;
  return e;
}

/** Test helper: forget the cached environment so a test can change process.env. */
export function resetEnvCache() {
  cached = null;
}

export const isProduction = () => env().NODE_ENV === "production";
export const stripeConfigured = () => Boolean(env().STRIPE_SECRET_KEY);
export const stripeWebhookConfigured = () => Boolean(env().STRIPE_SECRET_KEY && env().STRIPE_WEBHOOK_SECRET);
export const blobConfigured = () => Boolean(env().BLOB_READ_WRITE_TOKEN || env().BLOB_STORE_ID);
export const emailConfigured = () => Boolean(env().RESEND_API_KEY);

export type EnvCheck = { name: string; set: boolean; purpose: string };

/** Which variables are set, for the admin settings page. Values are never exposed. */
export function envChecks(): EnvCheck[] {
  const e = env();
  const raw = process.env;
  return [
    { name: "DATABASE_URL", set: Boolean(e.DATABASE_URL), purpose: "Postgres connection (shop schema)" },
    { name: "APP_BASE_URL", set: Boolean(raw.APP_BASE_URL), purpose: "Public site address for Stripe return links, emails and the sitemap" },
    { name: "SESSION_SECRET", set: Boolean(raw.SESSION_SECRET), purpose: "Signs the cart and admin cookies" },
    { name: "STRIPE_SECRET_KEY", set: Boolean(e.STRIPE_SECRET_KEY), purpose: "Online card checkout" },
    { name: "STRIPE_WEBHOOK_SECRET", set: Boolean(e.STRIPE_WEBHOOK_SECRET), purpose: "Verifies Stripe payment notifications so orders are created" },
    { name: "BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID", set: blobConfigured(), purpose: "Product photo storage on Vercel Blob (otherwise photos save to local disk)" },
    { name: "RESEND_API_KEY", set: Boolean(e.RESEND_API_KEY), purpose: "Order confirmation and dispatch emails" },
    { name: "EMAIL_FROM", set: Boolean(raw.EMAIL_FROM), purpose: "Sender address on customer emails" },
  ];
}

export function missingEnv(): EnvCheck[] {
  return envChecks().filter((c) => !c.set);
}
