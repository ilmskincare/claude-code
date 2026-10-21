import { z } from "zod";

/**
 * Validated environment. Production refuses to boot with missing critical
 * providers so that a "live" screen can never silently run on dev fallbacks.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  STUDIO_TIMEZONE: z.string().default("Europe/London"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Rebellious Ink <bookings@localhost>"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
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
  if (e.NODE_ENV === "production") {
    const missing: string[] = [];
    if (!e.RESEND_API_KEY) missing.push("RESEND_API_KEY");
    if (!e.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
    if (!e.STRIPE_WEBHOOK_SECRET) missing.push("STRIPE_WEBHOOK_SECRET");
    if (e.STORAGE_DRIVER === "local") missing.push("STORAGE_DRIVER=s3");
    if (missing.length) {
      throw new Error(`Production refuses to start without: ${missing.join(", ")}`);
    }
  }
  cached = e;
  return e;
}

export const isProduction = () => env().NODE_ENV === "production";
export const emailProviderConfigured = () => Boolean(env().RESEND_API_KEY);
export const stripeConfigured = () => Boolean(env().STRIPE_SECRET_KEY && env().STRIPE_WEBHOOK_SECRET);
