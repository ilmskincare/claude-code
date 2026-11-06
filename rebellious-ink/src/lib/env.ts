import { z } from "zod";

/**
 * Validated environment. Production refuses to boot with missing critical
 * providers so that a "live" screen can never silently run on dev fallbacks.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Deployment tier. "staging" keeps NODE_ENV=production builds but permits the dev outbox behind deployment protection. */
  APP_ENV: z.enum(["development", "test", "staging", "production"]).optional(),
  DATABASE_URL: z.string().min(1),
  /** PEM root certificate used to verify the database server (Supabase CA). */
  DATABASE_SSL_CA: z.string().optional(),
  AUTH_SECRET: z.string().min(16),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  STUDIO_TIMEZONE: z.string().default("Europe/London"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Rebellious Ink <bookings@localhost>"),
  /** Where replies to system email land, e.g. the desk mailbox. */
  EMAIL_REPLY_TO: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "blob", "s3"]).default("local"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  STORAGE_LOCAL_DIR: z.string().default("./storage"),
  STORAGE_SIGNING_SECRET: z.string().min(8).default("dev-only-storage-signing-secret"),
  HEALTH_DATA_KEY: z.string().optional(),
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
  if (appEnv(e) === "production") {
    const missing: string[] = [];
    if (!e.RESEND_API_KEY) missing.push("RESEND_API_KEY");
    // Stripe is optional at launch: without it deposits are taken by bank transfer and the booking stays "awaiting deposit" until the desk verifies it.
    if ((e.STRIPE_SECRET_KEY && !e.STRIPE_WEBHOOK_SECRET) || (!e.STRIPE_SECRET_KEY && e.STRIPE_WEBHOOK_SECRET)) missing.push("both STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET, or neither");
    if (e.STORAGE_DRIVER === "local") missing.push("STORAGE_DRIVER=blob|s3");
    if (missing.length) {
      throw new Error(`Production refuses to start without: ${missing.join(", ")}`);
    }
  }
  cached = e;
  return e;
}

function appEnv(e: Env) {
  return e.APP_ENV ?? e.NODE_ENV;
}

/** True only for the real production tier. Staging deliberately returns false so test-only conveniences stay available behind deployment protection. */
export const isProduction = () => appEnv(env()) === "production";
export const isStaging = () => appEnv(env()) === "staging";
export const emailProviderConfigured = () => Boolean(env().RESEND_API_KEY);
export const stripeConfigured = () => Boolean(env().STRIPE_SECRET_KEY && env().STRIPE_WEBHOOK_SECRET);
