import { config } from "dotenv";

// Tests run against the local development database named in .env (the "shop" schema on localhost:5433).
config({ path: ".env" });
(process.env as Record<string, string>).NODE_ENV = "test";
process.env.SESSION_SECRET ??= "test-only-session-secret-0123456789";
process.env.APP_BASE_URL ??= "http://localhost:3000";
